/**
 * BarcodeScannerScreen
 *
 * Full-screen barcode scanner with:
 * - Camera view with scanning overlay
 * - Flash toggle
 * - Haptic feedback on scan
 * - Local DB lookup + OpenFoodFacts API integration
 * - Result confirmation modal
 * - Manual barcode entry option
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Modal, useToast, NumericInput } from '../components/common';
import { colors } from '../constants/theme';
import { FoodItem } from '../types';
import { databaseService } from '../services/database';
import { openFoodFactsService, OpenFoodFactsResult, ServingSizeOption } from '../services/openFoodFacts';
import { addScannedFoodToOfflineList } from '../data/commonFoods';
import { useAppStore } from '../store/appStore';

// ============================================================================
// TYPES
// ============================================================================

type ScanState = 'scanning' | 'processing' | 'found' | 'not_found' | 'error';

interface ScannedProduct {
  foodItem: Omit<FoodItem, 'id' | 'createdAt'>;
  servingSizeOptions: ServingSizeOption[];
  fromCache: boolean;
  rawProduct?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;
const SCAN_DEBOUNCE_MS = 1500;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getMealTypeFromTime = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
};

// ============================================================================
// SCANNING OVERLAY COMPONENT
// ============================================================================

const ScanningOverlay: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const scanLinePosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      // Animate scan line
      scanLinePosition.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );

      // Pulse animation for corners
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1
      );
    }
  }, [isActive, scanLinePosition, pulseScale]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLinePosition.value * 100}%`,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.overlayContainer}>
      {/* Darkened areas around scan zone */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddle}>
        <View style={styles.overlaySide} />

        {/* Scan area */}
        <Animated.View style={[styles.scanArea, cornerStyle]}>
          {/* Corners */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Scan line */}
          {isActive && (
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
          )}
        </Animated.View>

        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom} />
    </View>
  );
};

// ============================================================================
// RESULT MODAL COMPONENT
// ============================================================================

interface ResultModalProps {
  visible: boolean;
  product: ScannedProduct | null;
  onClose: () => void;
  onSave: (foodItem: Omit<FoodItem, 'id' | 'createdAt'>, quantity: number) => void;
  onEdit: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  product,
  onClose,
  onSave,
  onEdit,
}) => {
  const [selectedServing, setSelectedServing] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentMacros, setCurrentMacros] = useState<Omit<FoodItem, 'id' | 'createdAt'> | null>(null);

  useEffect(() => {
    if (product) {
      setCurrentMacros(product.foodItem);
      setQuantity(1);

      // Find default serving option
      const defaultIndex = product.servingSizeOptions.findIndex((o) => o.isDefault);
      setSelectedServing(defaultIndex >= 0 ? defaultIndex : 0);
    }
  }, [product]);

  const handleServingChange = useCallback(
    (index: number) => {
      if (!product || !currentMacros) return;

      setSelectedServing(index);
      const newServingSize = product.servingSizeOptions[index].size;
      const recalculated = openFoodFactsService.recalculateMacros(
        product.foodItem,
        product.foodItem.servingSize,
        newServingSize
      );
      setCurrentMacros(recalculated);
    },
    [product, currentMacros]
  );

  if (!product || !currentMacros) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Product Found" size="lg">
      <View className="py-2">
        {/* Product Image */}
        {currentMacros.imageUri && (
          <View className="items-center mb-4">
            <Image
              source={{ uri: currentMacros.imageUri }}
              className="w-32 h-32 rounded-xl"
              resizeMode="contain"
            />
          </View>
        )}

        {/* Product Name */}
        <Text className="text-lg font-bold text-gray-900 text-center mb-2">
          {currentMacros.name}
        </Text>

        {product.fromCache && (
          <View className="flex-row items-center justify-center mb-3">
            <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
            <Text className="text-success-600 text-sm ml-1">From your database</Text>
          </View>
        )}

        {/* Serving Size Options */}
        <Text className="text-gray-600 text-sm mb-2">Serving Size</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {product.servingSizeOptions.map((option, index) => (
            <Pressable
              key={index}
              onPress={() => handleServingChange(index)}
              className={`px-3 py-2 rounded-lg border ${
                selectedServing === index
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedServing === index ? 'text-white' : 'text-gray-700'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Quantity */}
        <View className="mb-4">
          <Text className="text-gray-600 text-sm mb-2">Quantity</Text>
          <NumericInput
            value={quantity}
            onChange={setQuantity}
            min={0.5}
            max={10}
            step={0.5}
            decimals={1}
          />
        </View>

        {/* Nutrition Info */}
        <Card className="p-4 mb-4 bg-gray-50">
          <Text className="text-gray-600 text-sm mb-3">
            Nutrition per {product.servingSizeOptions[selectedServing]?.label || 'serving'}
            {quantity !== 1 ? ` × ${quantity}` : ''}
          </Text>

          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {Math.round(currentMacros.calories * quantity)}
              </Text>
              <Text className="text-xs text-gray-500">Calories</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-semibold" style={{ color: colors.macros.protein }}>
                {Math.round(currentMacros.protein * quantity * 10) / 10}g
              </Text>
              <Text className="text-xs text-gray-500">Protein</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-semibold" style={{ color: colors.macros.carbs }}>
                {Math.round(currentMacros.carbs * quantity * 10) / 10}g
              </Text>
              <Text className="text-xs text-gray-500">Carbs</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-semibold" style={{ color: colors.macros.fats }}>
                {Math.round(currentMacros.fats * quantity * 10) / 10}g
              </Text>
              <Text className="text-xs text-gray-500">Fat</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View className="flex-row gap-3">
          <Button variant="outline" onPress={onEdit} className="flex-1">
            Edit Details
          </Button>
          <Button
            variant="primary"
            onPress={() => onSave(currentMacros, quantity)}
            className="flex-1"
          >
            Add to Log
          </Button>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// NOT FOUND MODAL COMPONENT
// ============================================================================

interface NotFoundModalProps {
  visible: boolean;
  barcode: string;
  onClose: () => void;
  onManualEntry: () => void;
  onTryAgain: () => void;
}

const NotFoundModal: React.FC<NotFoundModalProps> = ({
  visible,
  barcode,
  onClose,
  onManualEntry,
  onTryAgain,
}) => (
  <Modal visible={visible} onClose={onClose} title="Product Not Found" size="sm">
    <View className="items-center py-4">
      <View className="w-20 h-20 rounded-full bg-warning-100 items-center justify-center mb-4">
        <Ionicons name="search-outline" size={40} color={colors.warning[600]} />
      </View>

      <Text className="text-gray-600 text-center mb-2">
        We couldn't find this product in our database.
      </Text>

      <View className="bg-gray-100 rounded-lg px-4 py-2 mb-4">
        <Text className="text-gray-700 font-mono text-sm">{barcode}</Text>
      </View>

      <Text className="text-gray-500 text-sm text-center mb-6">
        You can add it manually or try scanning again.
      </Text>

      <View className="w-full gap-3">
        <Button variant="primary" onPress={onManualEntry} fullWidth>
          Add Manually
        </Button>
        <Button variant="outline" onPress={onTryAgain} fullWidth>
          Try Again
        </Button>
      </View>
    </View>
  </Modal>
);

// ============================================================================
// ERROR MODAL COMPONENT
// ============================================================================

interface ErrorModalProps {
  visible: boolean;
  errorMessage: string;
  errorCode?: string;
  onClose: () => void;
  onRetry: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  errorMessage,
  errorCode,
  onClose,
  onRetry,
}) => (
  <Modal visible={visible} onClose={onClose} title="Scan Error" size="sm">
    <View className="items-center py-4">
      <View className="w-20 h-20 rounded-full bg-error-100 items-center justify-center mb-4">
        <Ionicons name="alert-circle-outline" size={40} color={colors.error[500]} />
      </View>

      <Text className="text-gray-600 text-center mb-2">{errorMessage}</Text>

      {errorCode === 'NETWORK_ERROR' && (
        <Text className="text-gray-500 text-sm text-center mb-4">
          Please check your internet connection and try again.
        </Text>
      )}

      <View className="w-full gap-3 mt-4">
        <Button variant="primary" onPress={onRetry} fullWidth>
          Try Again
        </Button>
        <Button variant="ghost" onPress={onClose} fullWidth>
          Cancel
        </Button>
      </View>
    </View>
  </Modal>
);

// ============================================================================
// MANUAL ENTRY MODAL
// ============================================================================

interface ManualEntryModalProps {
  visible: boolean;
  initialBarcode?: string;
  onClose: () => void;
  onSubmit: (barcode: string) => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  visible,
  initialBarcode = '',
  onClose,
  onSubmit,
}) => {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setBarcode(initialBarcode);
      setError('');
    }
  }, [visible, initialBarcode]);

  const handleSubmit = () => {
    const validation = openFoodFactsService.validateBarcode(barcode);
    if (!validation.valid) {
      setError(validation.error || 'Invalid barcode');
      return;
    }
    onSubmit(barcode);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Enter Barcode" size="sm">
      <View className="py-2">
        <Text className="text-gray-600 text-sm mb-3">
          Type or paste the barcode number below
        </Text>

        <View 
          className={`bg-gray-100 rounded-xl px-4 ${error ? 'border-2 border-error-500' : ''}`}
          style={{ height: 52, justifyContent: 'center' }}
        >
          <TextInput
            value={barcode}
            onChangeText={(text) => {
              setBarcode(text.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="e.g., 3017620422003"
            keyboardType="number-pad"
            maxLength={14}
            className="text-lg font-mono text-center"
            accessibilityLabel="Barcode number input"
          />
        </View>

        {error && (
          <Text className="text-error-500 text-sm mt-2 text-center">{error}</Text>
        )}

        <View className="flex-row gap-3 mt-6">
          <Button variant="outline" onPress={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={barcode.length < 6}
            className="flex-1"
          >
            Search
          </Button>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NO_BARCODE_TIMEOUT = 5000; // Show AI suggestion after 5 seconds

const BarcodeScannerScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation();
  
  // Permissions
  const [permission, requestPermission] = useCameraPermissions();

  // State
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string }>({ message: '' });
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  // Modals
  const [showResultModal, setShowResultModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);

  // Refs
  const lastScanTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);
  const noBarcodeTimer = useRef<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Store & Toast
  const user = useAppStore((state) => state.user);
  const toast = useToast();

  // ============================================================================
  // SMART DETECTION - Show AI suggestion if no barcode detected
  // ============================================================================

  useEffect(() => {
    if (scanState === 'scanning') {
      // Start timer when scanning begins
      noBarcodeTimer.current = setTimeout(() => {
        setShowAISuggestion(true);
      }, NO_BARCODE_TIMEOUT);
    } else {
      // Clear timer if state changes
      if (noBarcodeTimer.current) {
        clearTimeout(noBarcodeTimer.current);
        noBarcodeTimer.current = null;
      }
      setShowAISuggestion(false);
    }

    return () => {
      if (noBarcodeTimer.current) {
        clearTimeout(noBarcodeTimer.current);
      }
    };
  }, [scanState]);

  // Reset AI suggestion timer when user interacts
  const resetAISuggestionTimer = useCallback(() => {
    setShowAISuggestion(false);
    if (noBarcodeTimer.current) {
      clearTimeout(noBarcodeTimer.current);
    }
    noBarcodeTimer.current = setTimeout(() => {
      if (scanState === 'scanning') {
        setShowAISuggestion(true);
      }
    }, NO_BARCODE_TIMEOUT);
  }, [scanState]);

  // Navigate to AI Scanner
  const handleSwitchToAI = useCallback(async () => {
    // Just navigate to AI scanner - don't try to capture image
    // (Simulator cameras don't work well, and it's better UX to let user take fresh photo)
    // @ts-ignore
    navigation.replace('AIScanner', { mealType: getMealTypeFromTime() });
  }, [navigation]);

  // ============================================================================
  // BARCODE PROCESSING
  // ============================================================================

  const processBarcode = useCallback(async (barcode: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    setScanState('processing');
    setScannedBarcode(barcode);

    try {
      // 1. Check local database first
      const cachedItem = await databaseService.getFoodItemByBarcode(barcode);

      if (cachedItem) {
        // Found in local cache
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Announce for accessibility
        AccessibilityInfo.announceForAccessibility(`Found ${cachedItem.name} in your database`);

        setScannedProduct({
          foodItem: cachedItem,
          servingSizeOptions: [
            { label: `${cachedItem.servingSize}${cachedItem.servingUnit}`, size: cachedItem.servingSize, unit: cachedItem.servingUnit as 'g' | 'ml', isDefault: true },
            { label: '100g', size: 100, unit: 'g' },
          ],
          fromCache: true,
        });
        setScanState('found');
        setShowResultModal(true);
        isProcessing.current = false;
        return;
      }

      // 2. Query OpenFoodFacts API
      const result = await openFoodFactsService.getProductByBarcode(barcode);

      if (result.success && result.data) {
        // Found in API
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Announce for accessibility
        AccessibilityInfo.announceForAccessibility(`Found ${result.data.name}`);

        // Get serving size options
        const servingSizeOptions = result.rawProduct
          ? openFoodFactsService.getServingSizeOptions(result.rawProduct)
          : [{ label: '100g', size: 100, unit: 'g' as const }];

        setScannedProduct({
          foodItem: result.data,
          servingSizeOptions,
          fromCache: false,
          rawProduct: result.rawProduct,
        });
        setScanState('found');
        setShowResultModal(true);
      } else {
        // Not found or error
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        if (result.errorCode === 'NOT_FOUND') {
          AccessibilityInfo.announceForAccessibility('Product not found');
          setScanState('not_found');
          setShowNotFoundModal(true);
        } else {
          AccessibilityInfo.announceForAccessibility(`Error: ${result.error}`);
          setErrorInfo({
            message: result.error || 'Failed to look up product',
            code: result.errorCode,
          });
          setScanState('error');
          setShowErrorModal(true);
        }
      }
    } catch (error: any) {
      console.error('Barcode processing error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setErrorInfo({
        message: error.message || 'An unexpected error occurred',
      });
      setScanState('error');
      setShowErrorModal(true);
    } finally {
      isProcessing.current = false;
    }
  }, []);

  // ============================================================================
  // SCAN HANDLER
  // ============================================================================

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      // Debounce scans
      const now = Date.now();
      if (now - lastScanTime.current < SCAN_DEBOUNCE_MS) return;
      if (scanState !== 'scanning') return;

      lastScanTime.current = now;

      // Haptic feedback for scan detection
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Process the barcode
      processBarcode(result.data);
    },
    [scanState, processBarcode]
  );

  // ============================================================================
  // SAVE HANDLER
  // ============================================================================

  const handleSaveProduct = useCallback(
    async (foodItem: Omit<FoodItem, 'id' | 'createdAt'>, quantity: number) => {
      try {
        const userId = user?.id || 1;

        // Create or get food item in database (cache for future)
        let dbFoodItem: FoodItem;

        if (!scannedProduct?.fromCache) {
          // Save to database for future lookups
          dbFoodItem = await databaseService.createFoodItem(foodItem);
          
          // Also add to offline common foods list for quick access
          try {
            await addScannedFoodToOfflineList({
              name: foodItem.name,
              barcode: foodItem.barcode,
              calories: foodItem.calories,
              protein: foodItem.protein,
              carbs: foodItem.carbs,
              fats: foodItem.fats,
              servingSize: foodItem.servingSize,
              servingUnit: foodItem.servingUnit,
              category: 'Scanned Items',
            });
            console.log('Added scanned product to offline list:', foodItem.name);
          } catch (offlineError) {
            console.warn('Failed to add to offline list:', offlineError);
            // Continue even if offline save fails
          }
        } else {
          // Already in database
          const existing = await databaseService.getFoodItemByBarcode(foodItem.barcode || '');
          dbFoodItem = existing || (await databaseService.createFoodItem(foodItem));
        }

        // Create food log
        await databaseService.logFood({
          userId,
          foodItemId: dbFoodItem.id,
          quantity,
          mealType: getMealTypeFromTime(),
          loggedAt: new Date().toISOString(),
        });

        // Success feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Food logged successfully!');

        // Close modal and reset
        setShowResultModal(false);
        resetScanner();
      } catch (error: any) {
        console.error('Save error:', error);
        toast.error('Failed to save. Please try again.');
      }
    },
    [user, scannedProduct, toast]
  );

  // ============================================================================
  // SCANNER HELPERS
  // ============================================================================

  const resetScanner = useCallback(() => {
    setScanState('scanning');
    setScannedBarcode('');
    setScannedProduct(null);
    setErrorInfo({ message: '' });
    lastScanTime.current = 0;
  }, []);

  const handleRetry = useCallback(() => {
    setShowErrorModal(false);
    setShowNotFoundModal(false);
    resetScanner();
  }, [resetScanner]);

  const handleManualEntry = useCallback(() => {
    setShowNotFoundModal(false);
    // Navigate to manual food entry with barcode pre-filled
    // For now, show manual barcode entry modal
    setShowManualEntryModal(true);
  }, []);

  const handleManualBarcodeSubmit = useCallback(
    (barcode: string) => {
      setShowManualEntryModal(false);
      resetScanner();
      processBarcode(barcode);
    },
    [processBarcode, resetScanner]
  );

  const handleEditProduct = useCallback(() => {
    // Navigate to LogFoodScreen with product data pre-filled
    // For now, just close the modal
    setShowResultModal(false);
    toast.info('Edit feature coming soon');
  }, [toast]);

  // ============================================================================
  // PERMISSION HANDLING
  // ============================================================================

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 items-center justify-center px-6">
        <Animated.View entering={FadeIn} className="items-center">
          <View className="w-24 h-24 rounded-full bg-gray-800 items-center justify-center mb-6">
            <Ionicons name="camera-outline" size={48} color={colors.gray[400]} />
          </View>

          <Text className="text-white text-xl font-bold mb-2 text-center">
            Camera Permission Required
          </Text>

          <Text className="text-gray-400 text-center mb-8">
            We need access to your camera to scan barcodes. Your camera is only used for scanning and photos are not stored.
          </Text>

          <Button variant="primary" onPress={requestPermission} fullWidth>
            Grant Camera Access
          </Button>

          <Pressable
            onPress={() => setShowManualEntryModal(true)}
            className="mt-4 py-3"
          >
            <Text className="text-primary-400 font-medium">
              Enter barcode manually instead
            </Text>
          </Pressable>
        </Animated.View>

        <ManualEntryModal
          visible={showManualEntryModal}
          onClose={() => setShowManualEntryModal(false)}
          onSubmit={handleManualBarcodeSubmit}
        />
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View className="flex-1 bg-black">
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanState === 'scanning' ? handleBarcodeScanned : undefined}
      />

      {/* Scanning Overlay */}
      <ScanningOverlay isActive={scanState === 'scanning'} />

      {/* Top Controls */}
      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0">
        <View className="flex-row items-center justify-between px-4 py-2">
          {/* Back Button */}
          <Pressable
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          {/* Title */}
          <Text className="text-white font-semibold text-lg">Scan Barcode</Text>

          {/* Flash Toggle */}
          <Pressable
            onPress={() => setFlashEnabled(!flashEnabled)}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              flashEnabled ? 'bg-yellow-400' : 'bg-black/50'
            }`}
            accessibilityRole="button"
            accessibilityLabel={flashEnabled ? 'Turn off flash' : 'Turn on flash'}
            accessibilityState={{ checked: flashEnabled }}
          >
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-outline'}
              size={22}
              color={flashEnabled ? 'black' : 'white'}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom Instructions */}
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0">
        <View className="items-center px-6 pb-6">
          {/* Processing Indicator */}
          {scanState === 'processing' && (
            <Animated.View
              entering={FadeIn}
              className="flex-row items-center bg-black/70 rounded-full px-6 py-3 mb-4"
            >
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white ml-3 font-medium">Looking up product...</Text>
            </Animated.View>
          )}

          {/* AI Suggestion Banner - shows after 5 seconds of no barcode detected */}
          {showAISuggestion && scanState === 'scanning' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} className="w-full mb-4">
              <Pressable
                onPress={handleSwitchToAI}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 mx-2"
                style={{
                  backgroundColor: '#7C3AED',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-3">
                    <Ionicons name="sparkles" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">No barcode? Use AI instead</Text>
                    <Text className="text-white/80 text-sm">Tap to analyze food with AI vision</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="white" />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Instructions */}
          {scanState === 'scanning' && !showAISuggestion && (
            <Animated.View entering={FadeIn} className="items-center">
              <View className="bg-black/70 rounded-xl px-6 py-4 mb-4">
                <Text className="text-white text-center font-medium mb-1">
                  Point camera at barcode
                </Text>
                <Text className="text-gray-300 text-sm text-center">
                  Position the barcode within the frame
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <View className="flex-row items-center gap-3">
            {/* Manual Entry Button */}
            <Pressable
              onPress={() => setShowManualEntryModal(true)}
              className="bg-white/20 rounded-full px-5 py-3 flex-row items-center"
              accessibilityRole="button"
              accessibilityLabel="Enter barcode manually"
            >
              <Ionicons name="keypad-outline" size={18} color="white" />
              <Text className="text-white font-medium ml-2">Manual</Text>
            </Pressable>

            {/* AI Scan Button */}
            <Pressable
              onPress={handleSwitchToAI}
              className="bg-primary-500 rounded-full px-5 py-3 flex-row items-center"
              accessibilityRole="button"
              accessibilityLabel="Use AI to scan food"
            >
              <Ionicons name="sparkles" size={18} color="white" />
              <Text className="text-white font-medium ml-2">AI Scan</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Modals */}
      <ResultModal
        visible={showResultModal}
        product={scannedProduct}
        onClose={() => {
          setShowResultModal(false);
          resetScanner();
        }}
        onSave={handleSaveProduct}
        onEdit={handleEditProduct}
      />

      <NotFoundModal
        visible={showNotFoundModal}
        barcode={scannedBarcode}
        onClose={() => {
          setShowNotFoundModal(false);
          resetScanner();
        }}
        onManualEntry={handleManualEntry}
        onTryAgain={handleRetry}
      />

      <ErrorModal
        visible={showErrorModal}
        errorMessage={errorInfo.message}
        errorCode={errorInfo.code}
        onClose={() => {
          setShowErrorModal(false);
          resetScanner();
        }}
        onRetry={handleRetry}
      />

      <ManualEntryModal
        visible={showManualEntryModal}
        initialBarcode={scannedBarcode}
        onClose={() => setShowManualEntryModal(false)}
        onSubmit={handleManualBarcodeSubmit}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary[500],
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});

export default BarcodeScannerScreen;
