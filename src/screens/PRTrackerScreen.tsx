import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { databaseService } from '../services/database';
import { useAppStore } from '../store/appStore';
import { PersonalRecord } from '../types';
import { colors } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '../services/storage';
import { useColorScheme } from 'nativewind';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

// Common exercises to seed the list
const COMMON_EXERCISES = [
  'Barbell Squat',
  'Bench Press',
  'Deadlift',
  'Overhead Press',
  'Pull Up',
  'Dumbbell Row',
];

const PRTrackerScreen = () => {
  const navigation = useNavigation();
  const user = useAppStore((state) => state.user);
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.white : colors.gray[800];

  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [history, setHistory] = useState<PersonalRecord[]>([]);
  const [bestPR, setBestPR] = useState<PersonalRecord | null>(null);
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const scale = useSharedValue(0);

  const fetchExercises = useCallback(async () => {
    if (!user) return;
    try {
      const userExercises = await databaseService.getAllExerciseNames(user.id);
      // Merge with common exercises, unique only
      const allExercises = Array.from(new Set([...COMMON_EXERCISES, ...userExercises])).sort();
      setExercises(allExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  }, [user]);

  const fetchHistory = useCallback(async (exercise: string) => {
    if (!user) return;
    try {
      const records = await databaseService.getPersonalRecords(user.id, exercise);
      setHistory(records);
      const best = await databaseService.getBestPersonalRecord(user.id, exercise);
      setBestPR(best);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    if (selectedExercise) {
      fetchHistory(selectedExercise);
    }
  }, [selectedExercise, fetchHistory]);

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercise(exercise);
    setNewExerciseName(exercise); // Pre-fill modal
  };

  const handleBack = () => {
    setSelectedExercise(null);
    setHistory([]);
    setBestPR(null);
  };

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.5,
      videoMaxDuration: 15,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleAddSet = async () => {
    if (!user) return;
    
    const exerciseToSave = selectedExercise || newExerciseName.trim();
    if (!exerciseToSave || !weight || !reps) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);

    if (isNaN(weightNum) || isNaN(repsNum)) {
      Alert.alert('Invalid Input', 'Weight and Reps must be numbers.');
      return;
    }

    setIsUploading(true);
    try {
      let uploadedVideoUrl: string | undefined;
      let status: 'pending' | 'verified' | 'rejected' = 'verified'; // Default to verified if no video

      // If video attached, upload and set to pending
      if (videoUri) {
        // Compress (mock) and Upload (mock)
        const compressedUri = await storageService.compressVideo(videoUri);
        uploadedVideoUrl = await storageService.uploadVideo(compressedUri);
        status = 'pending';
      }

      // Check for PR before saving (only if verified or pending, but pending ones don't count as best yet)
      const currentBest = await databaseService.getBestPersonalRecord(user.id, exerciseToSave);
      const isPR = !currentBest || weightNum > currentBest.weight;

      await databaseService.addPersonalRecord({
        userId: user.id,
        exerciseName: exerciseToSave,
        weight: weightNum,
        reps: repsNum,
        date: new Date().toISOString().split('T')[0],
        videoUri: uploadedVideoUrl,
        status: status,
      });

      // Refresh data
      await fetchExercises();
      if (selectedExercise === exerciseToSave) {
        await fetchHistory(exerciseToSave);
      }

      setIsModalVisible(false);
      setWeight('');
      setReps('');
      setVideoUri(null);
      if (!selectedExercise) setNewExerciseName('');

      if (status === 'pending') {
        Alert.alert('PR Submitted', 'Your PR is pending verification. Good luck!');
      } else if (isPR) {
        triggerCelebration();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

    } catch (error) {
      console.error('Error adding record:', error);
      Alert.alert('Error', 'Failed to save record.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    
    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
      scale.value = 0;
    }, 3000);
  };

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const renderExerciseItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => handleExerciseSelect(item)}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <View className="flex-row items-center">
        <View className="bg-primary-50 dark:bg-primary-900/30 p-2.5 rounded-full mr-3">
          <Ionicons name="barbell" size={20} color={colors.primary[500]} />
        </View>
        <Text className="text-base font-semibold text-gray-900 dark:text-white">{item}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: PersonalRecord }) => (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-2 flex-row justify-between items-center border border-gray-100 dark:border-gray-700">
      <View>
        <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">{item.date}</Text>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          {item.weight} <Text className="text-sm font-normal text-gray-500">kg</Text>
        </Text>
        {item.status === 'pending' && (
          <Text className="text-xs text-yellow-500 font-medium mt-1">Pending Verification</Text>
        )}
        {item.status === 'rejected' && (
          <Text className="text-xs text-red-500 font-medium mt-1">Verification Rejected</Text>
        )}
        {item.status === 'verified' && item.videoUri && (
          <Text className="text-xs text-green-500 font-medium mt-1">Verified ✓</Text>
        )}
      </View>
      <View className="items-end">
        <View className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg mb-1">
          <Text className="text-gray-700 dark:text-gray-200 font-medium">{item.reps} reps</Text>
        </View>
        {item.videoUri && <Ionicons name="videocam" size={16} color={colors.primary[500]} />}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-row items-center">
        {selectedExercise ? (
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {selectedExercise || 'PR Tracker'}
        </Text>
      </View>

      <View className="flex-1 px-4 pt-4">
        {!selectedExercise ? (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item}
            renderItem={renderExerciseItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text className="text-center text-gray-500 mt-10">No exercises found.</Text>
            }
          />
        ) : (
          <>
            {/* Best Record Card */}
            {bestPR && (
              <View className="bg-primary-500 p-5 rounded-2xl mb-6 shadow-md">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-primary-100 font-medium text-sm">PERSONAL RECORD</Text>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                </View>
                <Text className="text-white text-4xl font-bold mb-1">
                  {bestPR.weight} <Text className="text-xl font-normal text-primary-100">kg</Text>
                </Text>
                <Text className="text-primary-100 text-sm">
                  {bestPR.reps} reps • {bestPR.date}
                </Text>
              </View>
            )}

            <Text className="text-sm font-bold text-gray-500 uppercase mb-3">History</Text>
            <FlatList
              data={history}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHistoryItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <Text className="text-center text-gray-500 mt-10">No history yet.</Text>
              }
            />
          </>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => {
          if (!selectedExercise) setNewExerciseName('');
          setIsModalVisible(true);
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-lg shadow-primary-500/30 elevation-5"
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add Set Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Log Set</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {!selectedExercise && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exercise Name</Text>
                <TextInput
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  placeholder="e.g. Bench Press"
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                />
              </View>
            )}

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reps</Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  placeholder="0"
                  keyboardType="number-pad"
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handlePickVideo}
              className={`flex-row items-center justify-center p-3 rounded-xl mb-6 border border-dashed ${videoUri ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <Ionicons name={videoUri ? "videocam" : "videocam-outline"} size={24} color={videoUri ? colors.primary[500] : colors.gray[400]} />
              <Text className={`ml-2 font-medium ${videoUri ? 'text-primary-600' : 'text-gray-500'}`}>
                {videoUri ? 'Video Attached' : 'Attach Verification Video (Max 15s)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddSet}
              disabled={isUploading}
              className={`bg-primary-500 p-4 rounded-xl items-center ${isUploading ? 'opacity-70' : ''}`}
            >
              <Text className="text-white font-bold text-lg">{isUploading ? 'Uploading...' : 'Save Record'}</Text>
            </TouchableOpacity>
            <View className="h-6" />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Celebration Overlay */}
      {showCelebration && (
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <Animated.View style={[{ alignItems: 'center' }, rStyle]}>
            <View className="bg-white p-6 rounded-3xl shadow-xl items-center border-4 border-yellow-400">
              <Text className="text-6xl mb-2">🎉</Text>
              <Text className="text-2xl font-bold text-yellow-500 mb-1">NEW PR!</Text>
              <Text className="text-gray-600 font-medium">You're getting stronger!</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PRTrackerScreen;
