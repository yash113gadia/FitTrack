/**
 * AI Food Scanner Screen
 *
 * Camera interface for AI-powered food recognition using Gemini Vision API.
 * Supports camera capture, gallery selection, image preview, and result editing.
 *
 * Features:
 * - Live camera preview with capture
 * - Photo gallery picker
 * - Multiple image support (up to 3)
 * - Image preview with remove option
 * - AI analysis with loading state
 * - Result display with confidence indicators
 * - Editable estimation form
 * - Alternative suggestions
 * - Save or manual entry fallback
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInDown,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { geminiService, GeminiAPIResult, EstimationContext } from '../services/geminiAPI';
import { databaseService } from '../services/database';
import { useAppStore, FREE_AI_MESSAGES_LIMIT } from '../store/appStore';
import { Button, Card, useToast, Modal, NumericInput } from '../components/common';
import { PremiumModal } from '../components/common/PremiumModal';
import { colors, typography, spacing, shadows, borderRadius } from '../constants/theme';
import { AIFoodEstimate, FoodItem } from '../types';

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  AIFoodScanner: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    returnTo?: string;
    initialImage?: string; // Pre-captured image from barcode scanner
  };
  LogFood: {
    foodItem?: Partial<FoodItem>;
    mealType?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AIFoodScanner'>;
type AIFoodScannerRouteProp = RouteProp<RootStackParamList, 'AIFoodScanner'>;

type ScreenState = 
  | 'camera'
  | 'preview'
  | 'analyzing'
  | 'result'
  | 'editing'
  | 'error';

interface SelectedImage {
  uri: string;
  width: number;
  height: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 1024; // Max dimension for compression
const IMAGE_QUALITY = 0.8;

// Neutral gray shorthand (theme uses 'gray' not 'neutral')
const neutral = colors.gray;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return colors.success[500];
  if (confidence >= 60) return colors.warning[500];
  if (confidence >= 40) return colors.warning[600];
  return colors.error[500];
};

const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 80) return 'High Confidence';
  if (confidence >= 60) return 'Good Confidence';
  if (confidence >= 40) return 'Moderate Confidence';
  return 'Low Confidence';
};

const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_SIZE } }],
      { compress: IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    return uri;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIFoodScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AIFoodScannerRouteProp>();
  const toast = useToast();
  
  const { mealType = 'snack' } = route.params || {};

  // Premium state
  const { isPremium, aiUsageCount, incrementAiUsage } = useAppStore();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Camera state
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');

  // Result state
  const [result, setResult] = useState<GeminiAPIResult | null>(null);
  const [editedEstimate, setEditedEstimate] = useState<AIFoodEstimate | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // UI state
  const [showContextInput, setShowContextInput] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  // Animations
  const scanLinePosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const captureScale = useSharedValue(1);

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  // Show paywall immediately if user has exceeded free limit
  useEffect(() => {
    if (!isPremium && aiUsageCount >= FREE_AI_MESSAGES_LIMIT) {
      setShowPremiumModal(true);
    }
  }, [isPremium, aiUsageCount]);

  useEffect(() => {
    if (screenState === 'analyzing') {
      // Scanning animation
      scanLinePosition.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
      // Pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      scanLinePosition.value = 0;
      pulseScale.value = 1;
    }
  }, [screenState]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scanLinePosition.value,
          [0, 1],
          [0, 200],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(scanLinePosition.value, [0, 0.5, 1], [0.5, 1, 0.5]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  // ============================================================================
  // CAMERA HANDLERS
  // ============================================================================

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || selectedImages.length >= MAX_IMAGES) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate capture button
      captureScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(1)
      );

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo) {
        // Compress image
        const compressedUri = await compressImage(photo.uri);
        
        setSelectedImages((prev) => [
          ...prev,
          { uri: compressedUri, width: photo.width, height: photo.height },
        ]);

        // If single image, go to preview
        if (selectedImages.length === 0) {
          setScreenState('preview');
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture photo');
    }
  }, [selectedImages.length, toast]);

  const handlePickImage = useCallback(async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      toast.info(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - selectedImages.length,
        quality: 0.9,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: SelectedImage[] = [];
        
        for (const asset of result.assets) {
          const compressedUri = await compressImage(asset.uri);
          newImages.push({
            uri: compressedUri,
            width: asset.width,
            height: asset.height,
          });
        }

        setSelectedImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
        setScreenState('preview');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      toast.error('Failed to select images');
    }
  }, [selectedImages.length, toast]);

  const handleRemoveImage = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleFlash = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlashEnabled((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  // ============================================================================
  // ANALYSIS HANDLERS
  // ============================================================================

  const handleAnalyze = useCallback(async () => {
    if (selectedImages.length === 0) {
      toast.error('Please capture or select an image first');
      return;
    }

    // Check premium status - AI scanning counts towards usage
    if (!isPremium && aiUsageCount >= FREE_AI_MESSAGES_LIMIT) {
      setShowPremiumModal(true);
      return;
    }

    Keyboard.dismiss();
    setScreenState('analyzing');
    setResult(null);
    setEditedEstimate(null);
    setSelectedAlternative(null);

    // Increment AI usage for non-premium users
    if (!isPremium) {
      incrementAiUsage();
    }

    try {
      const context: EstimationContext = {
        mealType,
        additionalInfo: additionalContext || undefined,
      };

      let analysisResult: GeminiAPIResult;

      if (selectedImages.length === 1) {
        analysisResult = await geminiService.estimateFoodMacros(
          selectedImages[0].uri,
          context
        );
      } else {
        analysisResult = await geminiService.estimateFoodMacrosMultipleImages(
          selectedImages.map((img) => img.uri),
          context
        );
      }

      setResult(analysisResult);

      if (analysisResult.success && analysisResult.data) {
        setEditedEstimate({ ...analysisResult.data });
        setScreenState('result');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setScreenState('error');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setResult({
        success: false,
        error: 'An unexpected error occurred',
        errorCode: 'API_ERROR',
      });
      setScreenState('error');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedImages, mealType, additionalContext, toast, isPremium, aiUsageCount, incrementAiUsage]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await handleAnalyze();
    setIsRetrying(false);
  }, [handleAnalyze]);

  // ============================================================================
  // RESULT HANDLERS
  // ============================================================================

  const handleSelectAlternative = useCallback((index: number) => {
    if (!result?.multipleItems) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAlternative(index);
    setEditedEstimate({ ...result.multipleItems[index] });
  }, [result]);

  const handleAccept = useCallback(async () => {
    if (!editedEstimate) return;

    try {
      // Create food item from estimate
      const foodItem: Partial<FoodItem> = {
        name: editedEstimate.foodName,
        calories: editedEstimate.estimatedMacros.calories,
        protein: editedEstimate.estimatedMacros.protein,
        fats: editedEstimate.estimatedMacros.fats,
        carbs: editedEstimate.estimatedMacros.carbs,
        servingSize: editedEstimate.servingSize,
        servingUnit: editedEstimate.servingUnit as FoodItem['servingUnit'],
        source: 'ai_estimate',
        confidence: editedEstimate.confidence,
        imageUri: selectedImages[0]?.uri,
      };

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to LogFood with pre-filled data
      navigation.navigate('LogFood', {
        foodItem,
        mealType,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save food item');
    }
  }, [editedEstimate, selectedImages, navigation, mealType, toast]);

  const handleManualEntry = useCallback(() => {
    navigation.navigate('LogFood', { mealType });
  }, [navigation, mealType]);

  const handleBack = useCallback(() => {
    if (screenState === 'preview' || screenState === 'result' || screenState === 'error') {
      if (selectedImages.length > 0) {
        setShowConfirmDiscard(true);
      } else {
        navigation.goBack();
      }
    } else {
      navigation.goBack();
    }
  }, [screenState, selectedImages.length, navigation]);

  const handleDiscard = useCallback(() => {
    setSelectedImages([]);
    setResult(null);
    setEditedEstimate(null);
    setScreenState('camera');
    setShowConfirmDiscard(false);
  }, []);

  // ============================================================================
  // PERMISSION HANDLING
  // ============================================================================

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="camera-outline" size={80} color={colors.gray[500]} />
          <Text className="text-white text-xl font-semibold mt-6 text-center">
            Camera Access Required
          </Text>
          <Text className="text-neutral-400 text-center mt-3 leading-6">
            To scan food with AI, we need access to your camera. Your photos are only
            used for analysis and are not stored on our servers.
          </Text>
          <Button
            onPress={requestPermission}
            variant="primary"
            size="lg"
            className="mt-8 w-full"
          >
            Grant Permission
          </Button>
          <Button
            onPress={handlePickImage}
            variant="outline"
            size="lg"
            className="mt-4 w-full"
          >
            Use Gallery Instead
          </Button>
          <Button
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="md"
            className="mt-4"
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDER: CAMERA VIEW
  // ============================================================================

  const renderCameraView = () => (
    <View className="flex-1">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flashEnabled ? 'on' : 'off'}
      >
        {/* Top Controls */}
        <SafeAreaView className="absolute top-0 left-0 right-0">
          <View className="flex-row justify-between items-center px-4 py-2">
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={toggleFlash}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  flashEnabled ? 'bg-yellow-500' : 'bg-black/50'
                }`}
              >
                <Ionicons
                  name={flashEnabled ? 'flash' : 'flash-off'}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={toggleCamera}
                className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              >
                <Ionicons name="camera-reverse" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Center Guide */}
        <View className="flex-1 items-center justify-center">
          <View
            className="w-72 h-72 border-2 border-white/30 rounded-3xl"
            style={{ borderStyle: 'dashed' }}
          >
            <View className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-xl" />
            <View className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-xl" />
            <View className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-xl" />
            <View className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-xl" />
          </View>
          <Text className="text-white/70 text-sm mt-4">
            Position your food in the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <View className="flex-row justify-center mb-4 gap-2">
              {selectedImages.map((img, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri: img.uri }}
                    className="w-14 h-14 rounded-lg"
                  />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center"
                  >
                    <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View className="flex-row items-center justify-center pb-8 gap-8">
            {/* Gallery Button */}
            <TouchableOpacity
              onPress={handlePickImage}
              className="w-14 h-14 rounded-full bg-black/50 items-center justify-center border-2 border-white/30"
            >
              <Ionicons name="images" size={24} color="white" />
            </TouchableOpacity>

            {/* Capture Button */}
            <Animated.View style={captureButtonStyle}>
              <TouchableOpacity
                onPress={handleCapture}
                disabled={selectedImages.length >= MAX_IMAGES}
                className={`w-20 h-20 rounded-full items-center justify-center ${
                  selectedImages.length >= MAX_IMAGES
                    ? 'bg-neutral-600'
                    : 'bg-white'
                }`}
                style={{
                  borderWidth: 4,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <View
                  className={`w-16 h-16 rounded-full ${
                    selectedImages.length >= MAX_IMAGES
                      ? 'bg-neutral-500'
                      : 'bg-white'
                  }`}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={() => selectedImages.length > 0 && setScreenState('preview')}
              disabled={selectedImages.length === 0}
              className={`w-14 h-14 rounded-full items-center justify-center ${
                selectedImages.length > 0
                  ? 'bg-primary-500'
                  : 'bg-black/50 border-2 border-white/30'
              }`}
            >
              <Ionicons
                name="arrow-forward"
                size={24}
                color={selectedImages.length > 0 ? 'white' : 'rgba(255,255,255,0.5)'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );

  // ============================================================================
  // RENDER: PREVIEW VIEW
  // ============================================================================

  const renderPreviewView = () => (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
          <TouchableOpacity onPress={handleBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Preview</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          <View className="p-4">
            {selectedImages.length === 1 ? (
              <View className="rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: selectedImages[0].uri }}
                  className="w-full aspect-square"
                  resizeMode="cover"
                />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="gap-3"
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {selectedImages.map((img, index) => (
                  <View key={index} className="relative mr-3">
                    <Image
                      source={{ uri: img.uri }}
                      className="w-48 h-48 rounded-xl"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                    >
                      <Ionicons name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedImages.length < MAX_IMAGES && (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="w-48 h-48 rounded-xl bg-neutral-800 border-2 border-dashed border-neutral-600 items-center justify-center"
                  >
                    <Ionicons name="add" size={40} color={colors.gray[500]} />
                    <Text className="text-neutral-500 text-sm mt-2">Add More</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>

          {/* Context Input */}
          <View className="px-4 mb-4">
            <TouchableOpacity
              onPress={() => setShowContextInput(!showContextInput)}
              className="flex-row items-center justify-between py-3"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="information-circle-outline" size={20} color={colors.primary[400]} />
                <Text className="text-white">Add context (optional)</Text>
              </View>
              <Ionicons
                name={showContextInput ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.gray[500]}
              />
            </TouchableOpacity>
            
            {showContextInput && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <RNTextInput
                  value={additionalContext}
                  onChangeText={setAdditionalContext}
                  placeholder="e.g., 'Large portion of pasta with cream sauce'"
                  placeholderTextColor={colors.gray[500]}
                  multiline
                  numberOfLines={3}
                  className="bg-neutral-800 rounded-xl px-4 py-3 text-white"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
                <Text className="text-neutral-500 text-xs mt-2">
                  Adding context helps improve estimation accuracy
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Tips Card */}
          <Card className="mx-4 mb-6 bg-primary-500/10 border border-primary-500/30">
            <View className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="bulb-outline" size={18} color={colors.primary[400]} />
                <Text className="text-primary-400 font-semibold">Tips for better results</Text>
              </View>
              <View className="gap-2">
                <Text className="text-neutral-300 text-sm">• Ensure good lighting</Text>
                <Text className="text-neutral-300 text-sm">• Include all food items in frame</Text>
                <Text className="text-neutral-300 text-sm">• Add multiple angles for complex meals</Text>
                <Text className="text-neutral-300 text-sm">• Include size reference (fork, plate) if possible</Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* Analyze Button */}
        <View className="px-4 pb-4 pt-2 border-t border-neutral-800">
          <Button
            onPress={handleAnalyze}
            variant="primary"
            size="lg"
            icon={<Ionicons name="sparkles" size={20} color="white" />}
            iconPosition="left"
            className="w-full"
          >
            Analyze with AI
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ============================================================================
  // RENDER: ANALYZING VIEW
  // ============================================================================

  const renderAnalyzingView = () => (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="flex-1 items-center justify-center px-8">
        {/* Image with scanning animation */}
        <View className="relative w-64 h-64 rounded-2xl overflow-hidden">
          <Image
            source={{ uri: selectedImages[0]?.uri }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Scanning overlay */}
          <View className="absolute inset-0 bg-black/40" />
          <Animated.View
            style={[
              scanLineStyle,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: colors.primary[500],
                shadowColor: colors.primary[500],
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
              },
            ]}
          />
        </View>

        {/* Loading indicator */}
        <Animated.View style={pulseStyle} className="mt-8">
          <View className="flex-row items-center gap-3">
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text className="text-white text-lg font-medium">Analyzing food...</Text>
          </View>
        </Animated.View>

        <Text className="text-neutral-400 text-center mt-4">
          Our AI is identifying foods and{'\n'}calculating nutritional values
        </Text>

        {/* Progress hints */}
        <View className="mt-8 gap-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
            <Text className="text-neutral-300 text-sm">Image received</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size={16} color={colors.primary[500]} />
            <Text className="text-neutral-300 text-sm">Identifying foods...</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="ellipse-outline" size={16} color={colors.gray[600]} />
            <Text className="text-neutral-500 text-sm">Estimating nutrients</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  // ============================================================================
  // RENDER: RESULT VIEW
  // ============================================================================

  const renderResultView = () => {
    if (!editedEstimate) return null;

    const confidence = selectedAlternative !== null && result?.multipleItems
      ? result.multipleItems[selectedAlternative].confidence
      : editedEstimate.confidence;

    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <TouchableOpacity onPress={handleBack} className="p-2">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">AI Estimation</Text>
            <TouchableOpacity
              onPress={() => setScreenState('editing')}
              className="p-2"
            >
              <Ionicons name="create-outline" size={24} color={colors.primary[400]} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Thumbnail */}
            <View className="items-center mt-4">
              <Image
                source={{ uri: selectedImages[0]?.uri }}
                className="w-24 h-24 rounded-xl"
                resizeMode="cover"
              />
            </View>

            {/* Confidence Badge */}
            <Animated.View entering={FadeIn.delay(200)} className="items-center mt-4">
              <View
                className="flex-row items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: `${getConfidenceColor(confidence)}20` }}
              >
                <Ionicons
                  name={confidence >= 60 ? 'shield-checkmark' : 'alert-circle'}
                  size={18}
                  color={getConfidenceColor(confidence)}
                />
                <Text style={{ color: getConfidenceColor(confidence) }} className="font-semibold">
                  {getConfidenceLabel(confidence)} ({confidence}%)
                </Text>
              </View>
            </Animated.View>

            {/* Food Name */}
            <Animated.View entering={SlideInUp.delay(300)} className="px-4 mt-6">
              <Text className="text-white text-2xl font-bold text-center">
                {editedEstimate.foodName}
              </Text>
              <Text className="text-neutral-400 text-center mt-1">
                {editedEstimate.servingSize} {editedEstimate.servingUnit}
              </Text>
            </Animated.View>

            {/* Macros Card */}
            <Animated.View entering={SlideInUp.delay(400)} className="px-4 mt-6">
              <Card className="bg-neutral-800">
                <View className="p-4">
                  <Text className="text-neutral-400 text-sm mb-4">Estimated Nutrition</Text>
                  
                  <View className="flex-row justify-between">
                    {/* Calories */}
                    <View className="items-center flex-1">
                      <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center mb-2">
                        <Ionicons name="flame" size={24} color={colors.warning[500]} />
                      </View>
                      <Text className="text-white text-xl font-bold">
                        {editedEstimate.estimatedMacros.calories}
                      </Text>
                      <Text className="text-neutral-400 text-xs">Calories</Text>
                    </View>

                    {/* Protein */}
                    <View className="items-center flex-1">
                      <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-2">
                        <Text className="text-red-400 text-lg font-bold">P</Text>
                      </View>
                      <Text className="text-white text-xl font-bold">
                        {editedEstimate.estimatedMacros.protein}g
                      </Text>
                      <Text className="text-neutral-400 text-xs">Protein</Text>
                    </View>

                    {/* Carbs */}
                    <View className="items-center flex-1">
                      <View className="w-16 h-16 rounded-full bg-blue-500/20 items-center justify-center mb-2">
                        <Text className="text-blue-400 text-lg font-bold">C</Text>
                      </View>
                      <Text className="text-white text-xl font-bold">
                        {editedEstimate.estimatedMacros.carbs}g
                      </Text>
                      <Text className="text-neutral-400 text-xs">Carbs</Text>
                    </View>

                    {/* Fats */}
                    <View className="items-center flex-1">
                      <View className="w-16 h-16 rounded-full bg-yellow-500/20 items-center justify-center mb-2">
                        <Text className="text-yellow-400 text-lg font-bold">F</Text>
                      </View>
                      <Text className="text-white text-xl font-bold">
                        {editedEstimate.estimatedMacros.fats}g
                      </Text>
                      <Text className="text-neutral-400 text-xs">Fats</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Reasoning (Expandable) */}
            {editedEstimate.reasoning && (
              <Animated.View entering={SlideInUp.delay(500)} className="px-4 mt-4">
                <TouchableOpacity
                  onPress={() => setShowReasoning(!showReasoning)}
                  className="flex-row items-center justify-between py-3"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="information-circle-outline" size={20} color={colors.gray[400]} />
                    <Text className="text-neutral-300">AI Reasoning</Text>
                  </View>
                  <Ionicons
                    name={showReasoning ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
                
                {showReasoning && (
                  <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <Card className="bg-neutral-800/50">
                      <View className="p-4">
                        <Text className="text-neutral-300 leading-6">
                          {editedEstimate.reasoning}
                        </Text>
                      </View>
                    </Card>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {/* Alternatives */}
            {result?.multipleItems && result.multipleItems.length > 1 && (
              <Animated.View entering={SlideInUp.delay(600)} className="px-4 mt-6">
                <Text className="text-neutral-400 text-sm mb-3">Individual Items</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {result.multipleItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelectAlternative(index)}
                      className={`mr-3 p-3 rounded-xl border ${
                        selectedAlternative === index
                          ? 'bg-primary-500/20 border-primary-500'
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                      style={{ minWidth: 140 }}
                    >
                      <Text
                        className={`font-medium ${
                          selectedAlternative === index ? 'text-primary-400' : 'text-white'
                        }`}
                        numberOfLines={2}
                      >
                        {item.foodName}
                      </Text>
                      <Text className="text-neutral-400 text-xs mt-1">
                        {item.estimatedMacros.calories} cal
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <View
                          className="h-1.5 rounded-full mr-2"
                          style={{
                            width: `${item.confidence}%`,
                            backgroundColor: getConfidenceColor(item.confidence),
                            maxWidth: 80,
                          }}
                        />
                        <Text className="text-neutral-500 text-xs">{item.confidence}%</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Edit hint */}
            <View className="px-4 mt-6 mb-4">
              <Text className="text-neutral-500 text-xs text-center">
                Tap the edit icon to modify any values before saving
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="px-4 pb-4 pt-2 border-t border-neutral-800 gap-3">
            <Button
              onPress={handleAccept}
              variant="primary"
              size="lg"
              icon={<Ionicons name="checkmark" size={20} color="white" />}
              iconPosition="left"
              className="w-full"
            >
              Accept &amp; Log Food
            </Button>
            <View className="flex-row gap-3">
              <Button
                onPress={handleManualEntry}
                variant="outline"
                size="md"
                className="flex-1"
              >
                Manual Entry
              </Button>
              <Button
                onPress={handleRetry}
                variant="ghost"
                size="md"
                loading={isRetrying}
                icon={<Ionicons name="refresh" size={18} color={colors.gray[400]} />}
                iconPosition="left"
              >
                Retry
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  // ============================================================================
  // RENDER: EDITING VIEW
  // ============================================================================

  const renderEditingView = () => {
    if (!editedEstimate) return null;

    const updateField = (field: keyof AIFoodEstimate['estimatedMacros'], value: number) => {
      setEditedEstimate((prev) =>
        prev
          ? {
              ...prev,
              estimatedMacros: {
                ...prev.estimatedMacros,
                [field]: value,
              },
            }
          : null
      );
    };

    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <TouchableOpacity onPress={() => setScreenState('result')} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">Edit Estimation</Text>
            <TouchableOpacity
              onPress={() => setScreenState('result')}
              className="p-2"
            >
              <Text className="text-primary-400 font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            {/* Food Name */}
            <View className="mt-6">
              <Text className="text-neutral-400 text-sm mb-2">Food Name</Text>
              <RNTextInput
                value={editedEstimate.foodName}
                onChangeText={(text) =>
                  setEditedEstimate((prev) => (prev ? { ...prev, foodName: text } : null))
                }
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white text-lg"
                placeholderTextColor={colors.gray[500]}
              />
            </View>

            {/* Serving Size */}
            <View className="mt-6 flex-row gap-4">
              <View className="flex-1">
                <Text className="text-neutral-400 text-sm mb-2">Serving Size</Text>
                <NumericInput
                  value={editedEstimate.servingSize}
                  onChange={(val: number) =>
                    setEditedEstimate((prev) =>
                      prev ? { ...prev, servingSize: val || 0 } : null
                    )
                  }
                  min={0}
                  max={9999}
                />
              </View>
              <View className="flex-1">
                <Text className="text-neutral-400 text-sm mb-2">Unit</Text>
                <RNTextInput
                  value={editedEstimate.servingUnit}
                  onChangeText={(text) =>
                    setEditedEstimate((prev) => (prev ? { ...prev, servingUnit: text } : null))
                  }
                  className="bg-neutral-800 rounded-xl px-4 py-3 text-white"
                  placeholderTextColor={colors.gray[500]}
                />
              </View>
            </View>

            {/* Macros */}
            <View className="mt-6">
              <Text className="text-neutral-400 text-sm mb-4">Nutritional Values</Text>
              
              <View className="gap-4">
                {/* Calories */}
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-orange-500/20 items-center justify-center mr-4">
                    <Ionicons name="flame" size={20} color={colors.warning[500]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-300 mb-1">Calories</Text>
                    <NumericInput
                      value={editedEstimate.estimatedMacros.calories}
                      onChange={(val: number) => updateField('calories', val || 0)}
                      min={0}
                      max={9999}
                    />
                  </View>
                </View>

                {/* Protein */}
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mr-4">
                    <Text className="text-red-400 font-bold">P</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-300 mb-1">Protein (g)</Text>
                    <NumericInput
                      value={editedEstimate.estimatedMacros.protein}
                      onChange={(val: number) => updateField('protein', val || 0)}
                      min={0}
                      max={999}
                    />
                  </View>
                </View>

                {/* Carbs */}
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mr-4">
                    <Text className="text-blue-400 font-bold">C</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-300 mb-1">Carbs (g)</Text>
                    <NumericInput
                      value={editedEstimate.estimatedMacros.carbs}
                      onChange={(val: number) => updateField('carbs', val || 0)}
                      min={0}
                      max={999}
                    />
                  </View>
                </View>

                {/* Fats */}
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-yellow-500/20 items-center justify-center mr-4">
                    <Text className="text-yellow-400 font-bold">F</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-300 mb-1">Fats (g)</Text>
                    <NumericInput
                      value={editedEstimate.estimatedMacros.fats}
                      onChange={(val: number) => updateField('fats', val || 0)}
                      min={0}
                      max={999}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Confidence Note */}
            <View className="mt-6 mb-8 p-4 bg-neutral-800/50 rounded-xl">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="information-circle" size={18} color={colors.gray[400]} />
                <Text className="text-neutral-400 font-medium">About Editing</Text>
              </View>
              <Text className="text-neutral-500 text-sm leading-5">
                You can adjust any values that seem incorrect. The AI's original confidence
                was {editedEstimate.confidence}%. Your edits will be saved with this food item.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  // ============================================================================
  // RENDER: ERROR VIEW
  // ============================================================================

  const renderErrorView = () => {
    const getErrorContent = () => {
      switch (result?.errorCode) {
        case 'NO_FOOD_DETECTED':
          return {
            icon: 'fast-food-outline' as const,
            title: 'No Food Detected',
            message: result?.error || 'We couldn\'t identify any food in this image. Try a clearer photo or add a description.',
          };
        case 'INVALID_IMAGE':
          return {
            icon: 'image-outline' as const,
            title: 'Invalid Image',
            message: 'The image format is not supported or the image is too small/blurry.',
          };
        case 'RATE_LIMITED':
          return {
            icon: 'time-outline' as const,
            title: 'Too Many Requests',
            message: 'Please wait a moment before trying again.',
          };
        case 'NETWORK_ERROR':
          return {
            icon: 'cloud-offline-outline' as const,
            title: 'Connection Error',
            message: 'Please check your internet connection and try again.',
          };
        default:
          return {
            icon: 'alert-circle-outline' as const,
            title: 'Analysis Failed',
            message: result?.error || 'Something went wrong. Please try again.',
          };
      }
    };

    const errorContent = getErrorContent();

    return (
      <SafeAreaView className="flex-1 bg-neutral-900">
        <View className="flex-row items-center px-4 py-3 border-b border-neutral-800">
          <TouchableOpacity onPress={handleBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-error-500/20 items-center justify-center mb-6">
            <Ionicons name={errorContent.icon} size={48} color={colors.error[500]} />
          </View>
          
          <Text className="text-white text-xl font-semibold text-center mb-3">
            {errorContent.title}
          </Text>
          <Text className="text-neutral-400 text-center leading-6 mb-8">
            {errorContent.message}
          </Text>

          {/* Image preview */}
          {selectedImages.length > 0 && (
            <Image
              source={{ uri: selectedImages[0].uri }}
              className="w-32 h-32 rounded-xl mb-8"
              resizeMode="cover"
            />
          )}

          {/* Actions */}
          <View className="w-full gap-3">
            <Button
              onPress={handleRetry}
              variant="primary"
              size="lg"
              loading={isRetrying}
              icon={<Ionicons name="refresh" size={20} color="white" />}
              iconPosition="left"
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              onPress={handleDiscard}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Take New Photo
            </Button>
            <Button
              onPress={handleManualEntry}
              variant="ghost"
              size="md"
            >
              Enter Manually
            </Button>
          </View>

          {/* Fallback suggestion */}
          {result?.errorCode === 'NO_FOOD_DETECTED' && (
            <View className="mt-8 p-4 bg-neutral-800/50 rounded-xl">
              <Text className="text-neutral-400 text-sm text-center">
                💡 Tip: Try describing the food instead. Go back and add context
                like "chicken salad with avocado" before analyzing.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  };

  // ============================================================================
  // RENDER: CONFIRM DISCARD MODAL
  // ============================================================================

  const renderConfirmDiscardModal = () => (
    <Modal
      visible={showConfirmDiscard}
      onClose={() => setShowConfirmDiscard(false)}
      title="Discard Changes?"
      size="sm"
    >
      <View className="p-4">
        <Text className="text-neutral-300 mb-6">
          Are you sure you want to discard your captured images and go back?
        </Text>
        <View className="flex-row gap-3">
          <Button
            onPress={() => setShowConfirmDiscard(false)}
            variant="outline"
            size="md"
            className="flex-1"
          >
            Keep
          </Button>
          <Button
            onPress={() => {
              setShowConfirmDiscard(false);
              navigation.goBack();
            }}
            variant="danger"
            size="md"
            className="flex-1"
          >
            Discard
          </Button>
        </View>
      </View>
    </Modal>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Check if user has exceeded limit and should be blocked
  const isOverLimit = !isPremium && aiUsageCount >= FREE_AI_MESSAGES_LIMIT;

  return (
    <View className="flex-1 bg-neutral-900">
      {screenState === 'camera' && renderCameraView()}
      {screenState === 'preview' && renderPreviewView()}
      {screenState === 'analyzing' && renderAnalyzingView()}
      {screenState === 'result' && renderResultView()}
      {screenState === 'editing' && renderEditingView()}
      {screenState === 'error' && renderErrorView()}
      {renderConfirmDiscardModal()}
      
      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          // If user is over limit and dismisses, go back
          if (isOverLimit) {
            navigation.goBack();
          }
        }}
        onSubscribe={() => {
          setShowPremiumModal(false);
          // In production, this would open the App Store subscription flow
          toast.info('Premium coming soon!');
        }}
        feature="AI Food Scanner"
      />
    </View>
  );
}
