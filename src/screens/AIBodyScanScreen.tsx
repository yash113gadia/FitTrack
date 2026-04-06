import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

import { geminiService } from '../services/geminiAPI';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notifications';
import { useAppActions } from '../store/appStore';
import { colors } from '../constants/theme';
import { useColorScheme } from 'nativewind';

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type ScanStep = 
  | 'paywall' 
  | 'restricted'
  | 'front-instructions' 
  | 'front-capture' 
  | 'front-review' 
  | 'back-instructions' 
  | 'back-capture' 
  | 'back-review' 
  | 'complete';

const AIBodyScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const isPremium = useAppStore((state) => state.isPremium);
  const setPremium = useAppStore((state) => state.setPremium);
  const user = useAppStore((state) => state.user);
  const { updateUser } = useAppActions();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.white : colors.text.primary;
  
  const [step, setStep] = useState<ScanStep>('paywall'); // Default to paywall, will update in useEffect
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [daysUntilNextScan, setDaysUntilNextScan] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Check status (Premium & Time Restriction)
  useEffect(() => {
    if (!isPremium) {
      setStep('paywall');
      return;
    }

    if (user?.lastScanDate) {
      const lastDate = new Date(user.lastScanDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays < 30) {
        setDaysUntilNextScan(30 - diffDays);
        setStep('restricted');
        return;
      }
    }

    // If premium and no restriction
    if (step === 'paywall' || step === 'restricted') {
      setStep('front-instructions');
    }
  }, [isPremium, user?.lastScanDate]);

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        
        if (step === 'front-capture' && photo) {
          setFrontImage(photo.uri);
          setStep('front-review');
        } else if (step === 'back-capture' && photo) {
          setBackImage(photo.uri);
          setStep('back-review');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleRetake = () => {
    if (step === 'front-review') {
      setFrontImage(null);
      setStep('front-capture');
    } else if (step === 'back-review') {
      setBackImage(null);
      setStep('back-capture');
    }
  };

  const handleConfirm = () => {
    if (step === 'front-review') {
      setStep('back-instructions');
    } else if (step === 'back-review') {
      setStep('complete');
    }
  };

  const handleSubscribe = () => {
    // In a real app, this would trigger the IAP flow
    Alert.alert(
      'Subscribe to Premium',
      'Unlock AI Body Scan and more for $9.99/mo',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Subscribe (Demo)', 
          onPress: () => {
            setPremium(true);
            Alert.alert('Success', 'You are now a Premium member!');
          } 
        }
      ]
    );
  };

  const handleGeneratePlan = async () => {
    if (!frontImage || !backImage || !user) return;

    setIsGenerating(true);
    try {
      const result = await geminiService.generateWorkoutPlan(
        frontImage, 
        backImage, 
        user.muscleLevels
      );
      
      if (result.success && result.data) {
        await databaseService.saveWorkoutPlan(user.id, result.data);
        
        // Update last scan date
        const today = new Date().toISOString();
        await updateUser({ lastScanDate: today });

        // Schedule notification for 30 days later
        const secondsIn30Days = 30 * 24 * 60 * 60;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time for your Body Scan!",
            body: "It's been one month! Your body has changed. Scan now to update your Whole Fit plan.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsIn30Days,
            repeats: false,
          },
        });
        
        // Privacy: Clear images immediately after processing
        setFrontImage(null);
        setBackImage(null);

        navigation.navigate('MyPlan'); 
      } else {
        Alert.alert('Generation Failed', result.error || 'Could not generate plan. Please try again.');
      }
    } catch (error) {
      console.error('Plan generation error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderRestricted = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[900], colors.primary[700]]}
        style={styles.paywallContainer}
      >
        <View style={styles.paywallContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={80} color="#fff" />
          </View>
          <Text style={styles.paywallTitle}>Next Scan Locked</Text>
          <Text style={styles.paywallSubtitle}>
            Body changes take time! Your next AI Body Scan will be available in:
          </Text>
          
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#fff', marginVertical: 20 }}>
            {daysUntilNextScan} <Text style={{ fontSize: 20, fontWeight: 'normal' }}>days</Text>
          </Text>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPaywall = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[900], colors.primary[600]]}
        style={styles.paywallContainer}
      >
        <View style={styles.paywallContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="scan-outline" size={80} color="#fff" />
          </View>
          <Text style={styles.paywallTitle}>AI Body Scan</Text>
          <Text style={styles.paywallSubtitle}>
            Get a personalized fitness plan tailored to your exact body composition.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success[400]} />
              <Text style={styles.featureText}>Precise Body Fat % Analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success[400]} />
              <Text style={styles.featureText}>Muscle Imbalance Detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success[400]} />
              <Text style={styles.featureText}>Tailored Workout Plans</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={handleSubscribe}
          >
            <Text style={styles.subscribeButtonText}>Unlock Premium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderInstructions = (type: 'Front' | 'Back') => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={iconColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <Ionicons 
          name={type === 'Front' ? 'body-outline' : 'body'} 
          size={100} 
          color={colors.primary[500]} 
        />
        <Text style={styles.title}>{type} Body Scan</Text>
        <Text style={styles.description}>
          Please stand in a well-lit area. Wear form-fitting clothes for the best results.
          {type === 'Front' ? ' Face the camera directly.' : ' Turn your back to the camera.'}
        </Text>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setStep(type === 'Front' ? 'front-capture' : 'back-capture')}
        >
          <Text style={styles.primaryButtonText}>I'm Ready</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCamera = (type: 'Front' | 'Back') => {
    if (!permission) {
      return <View style={styles.container} />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={{ textAlign: 'center', marginTop: 50 }}>No access to camera</Text>
          <Button onPress={requestPermission} style={{ marginTop: 20 }}>Grant Permission</Button>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView 
          ref={cameraRef} 
          style={styles.camera} 
          facing={cameraType}
          flash={flashMode}
        >
          <View style={styles.cameraControls}>
            <View style={styles.cameraTopBar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>{type} Scan</Text>
              <TouchableOpacity onPress={() => setFlashMode(
                flashMode === 'off' ? 'on' : 'off'
              )}>
                <Ionicons 
                  name={flashMode === 'on' ? "flash" : "flash-off"} 
                  size={30} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraOverlay}>
              <View style={styles.guideFrame} />
              <Text style={styles.guideText}>Align your body within the frame</Text>
            </View>

            <View style={styles.cameraBottomBar}>
              <TouchableOpacity 
                onPress={() => setCameraType(
                  cameraType === 'back' ? 'front' : 'back'
                )}
              >
                <Ionicons name="camera-reverse" size={30} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isCapturing}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
              
              <View style={{ width: 30 }} /> 
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  const renderReview = (imageUri: string | null, type: 'Front' | 'Back') => (
    <View style={styles.container}>
      <Text style={styles.reviewTitle}>Review {type} Photo</Text>
      <Text style={styles.reviewSubtitle}>Make sure your body is clearly visible.</Text>
      
      <View style={styles.imageContainer}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        )}
      </View>

      <View style={styles.reviewControls}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>
            {type === 'Front' ? 'Next: Back Scan' : 'Finish'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={60} color="#fff" />
        </View>
        <Text style={styles.title}>Scans Captured!</Text>
        <Text style={styles.description}>
          We have securely saved your front and back body scans. 
          Ready to generate your personalized plan?
        </Text>
        
        <TouchableOpacity
          style={[styles.primaryButton, isGenerating && styles.disabledButton]}
          onPress={handleGeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Generate My Plan</Text>
          )}
        </TouchableOpacity>
        
        {!isGenerating && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // Reset for next time or just go back
              setStep('front-instructions');
              setFrontImage(null);
              setBackImage(null);
            }}
          >
            <Text style={styles.secondaryButtonText}>Start Over</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  switch (step) {
    case 'paywall': return renderPaywall();
    case 'restricted': return renderRestricted();
    case 'front-instructions': return renderInstructions('Front');
    case 'front-capture': return renderCamera('Front');
    case 'front-review': return renderReview(frontImage, 'Front');
    case 'back-instructions': return renderInstructions('Back');
    case 'back-capture': return renderCamera('Back');
    case 'back-review': return renderReview(backImage, 'Back');
    case 'complete': return renderComplete();
    default: return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area approx
    paddingBottom: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // Paywall
  paywallContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  paywallContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 50,
  },
  paywallTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  paywallSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonText: {
    color: colors.primary[600],
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  // Instructions & Complete
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  secondaryButton: {
    padding: 16,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Camera
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 50, // Safe area
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: width * 0.8,
    height: height * 0.6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cameraBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  // Review
  reviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 60,
    textAlign: 'center',
  },
  reviewSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  reviewControls: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AIBodyScanScreen;
