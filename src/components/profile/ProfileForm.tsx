import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Image, Modal, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../../constants/theme';
import { UserProfile } from '../../types';
import { Ionicons } from '@expo/vector-icons';

// DiceBear 3D Cartoon Avatars - Free and copyright-free
// Using "adventurer" style for cute 3D cartoon characters
const DICEBEAR_AVATARS = [
  { id: 'avatar_1', seed: 'Felix', style: 'adventurer' },
  { id: 'avatar_2', seed: 'Aneka', style: 'adventurer' },
  { id: 'avatar_3', seed: 'Max', style: 'adventurer' },
  { id: 'avatar_4', seed: 'Luna', style: 'adventurer' },
  { id: 'avatar_5', seed: 'Leo', style: 'adventurer' },
  { id: 'avatar_6', seed: 'Mia', style: 'adventurer' },
  { id: 'avatar_7', seed: 'Oliver', style: 'lorelei' },
  { id: 'avatar_8', seed: 'Sophie', style: 'lorelei' },
  { id: 'avatar_9', seed: 'FitRunner', style: 'big-smile' },
  { id: 'avatar_10', seed: 'GymPro', style: 'big-smile' },
  { id: 'avatar_11', seed: 'HealthyLife', style: 'big-smile' },
  { id: 'avatar_12', seed: 'ActiveStar', style: 'big-smile' },
  { id: 'avatar_13', seed: 'Charlie', style: 'adventurer' },
  { id: 'avatar_14', seed: 'Emma', style: 'adventurer' },
  { id: 'avatar_15', seed: 'Jack', style: 'lorelei' },
  { id: 'avatar_16', seed: 'Lily', style: 'lorelei' },
];

// Generate DiceBear avatar URL
const getAvatarUrl = (seed: string, style: string, size: number = 100) => {
  return `https://api.dicebear.com/9.x/${style}/png?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

// Get avatar URL by ID
const getAvatarUrlById = (avatarId: string, size: number = 100) => {
  const avatar = DICEBEAR_AVATARS.find(a => a.id === avatarId);
  if (avatar) {
    return getAvatarUrl(avatar.seed, avatar.style, size);
  }
  return null;
};

interface ProfileFormProps {
  profile: Partial<UserProfile>;
  onChange: (field: keyof UserProfile, value: any) => void;
  isMetric: boolean;
  onToggleMetric: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onChange,
  isMetric,
  onToggleMetric,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange('profilePhoto', result.assets[0].uri);
      onChange('profilePhotoType', 'custom');
      setShowAvatarModal(false);
    }
  };

  const selectAvatar = (avatarId: string) => {
    onChange('profilePhoto', avatarId);
    onChange('profilePhotoType', 'avatar');
    setShowAvatarModal(false);
  };

  // Get the avatar URL for display
  const getProfileImageUrl = () => {
    if (profile.profilePhotoType === 'custom' && profile.profilePhoto) {
      return profile.profilePhoto;
    }
    if (profile.profilePhotoType === 'avatar' && profile.profilePhoto) {
      return getAvatarUrlById(profile.profilePhoto, 200);
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-[24px] shadow-sm mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Personal Details</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isEditing ? colors.primary[500] : colors.gray[100],
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "pencil"} 
            size={16} 
            color={isEditing ? '#FFFFFF' : colors.gray[600]} 
          />
          <Text style={{
            marginLeft: 4,
            fontSize: 14,
            fontWeight: '500',
            color: isEditing ? '#FFFFFF' : colors.gray[600],
          }}>
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Photo */}
      <View className="items-center mb-6">
        <TouchableOpacity
          onPress={() => isEditing && setShowAvatarModal(true)}
          disabled={!isEditing}
          style={{ opacity: isEditing ? 1 : 0.7 }}
        >
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.gray[200],
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: colors.primary[500],
          }}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={{ width: 100, height: 100 }}
              />
            ) : (
              <Ionicons name="person" size={50} color={colors.gray[400]} />
            )}
          </View>
          {isEditing && (
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: colors.primary[500],
              width: 32,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {isEditing ? 'Tap to change photo' : 'Profile Photo'}
        </Text>
      </View>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '80%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.gray[900] }}>
                Choose Profile Photo
              </Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {/* Upload Photo Option */}
            <TouchableOpacity
              onPress={pickImage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary[50],
                padding: 16,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary[500],
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="image" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[900] }}>
                  Upload from Gallery
                </Text>
                <Text style={{ fontSize: 14, color: colors.gray[500] }}>
                  Choose a photo from your device
                </Text>
              </View>
            </TouchableOpacity>

            {/* DiceBear 3D Cartoon Avatars */}
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700], marginBottom: 12 }}>
              Or choose an avatar
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}>
                {DICEBEAR_AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    onPress={() => selectAvatar(avatar.id)}
                    style={{
                      width: '23%',
                      aspectRatio: 1,
                      marginBottom: 12,
                      borderRadius: 16,
                      backgroundColor: colors.gray[100],
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: profile.profilePhoto === avatar.id ? 3 : 0,
                      borderColor: colors.primary[500],
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: getAvatarUrl(avatar.seed, avatar.style, 80) }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Mode - Clean summary of details */}
      {!isEditing && (
        <View>
          {/* User Info Row */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.name || 'No name set'}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {profile.gender || 'Not specified'} • {profile.age || '--'} years old
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row mb-4" style={{ gap: 12 }}>
            <View className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl items-center">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {profile.weight || '--'}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {isMetric ? 'kg' : 'lbs'}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl items-center">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {profile.height || '--'}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {isMetric ? 'cm' : 'ft'}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl items-center">
              <Text className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {profile.goal === 'lose' ? '🔥' : profile.goal === 'gain' ? '💪' : '⚖️'}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {profile.goal === 'lose' ? 'Lose' : profile.goal === 'gain' ? 'Gain' : 'Maintain'}
              </Text>
            </View>
          </View>

          {/* Activity Level Badge */}
          <View className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-xl flex-row items-center">
            <Ionicons name="fitness" size={20} color={colors.primary[500]} />
            <View className="ml-3">
              <Text className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {profile.activityLevel === 'sedentary' && 'Sedentary'}
                {profile.activityLevel === 'light' && 'Lightly Active'}
                {profile.activityLevel === 'moderate' && 'Moderately Active'}
                {profile.activityLevel === 'active' && 'Very Active'}
                {profile.activityLevel === 'very_active' && 'Extremely Active'}
                {!profile.activityLevel && 'Not set'}
              </Text>
              <Text className="text-xs text-primary-600 dark:text-primary-400">
                Activity Level
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Edit Mode - All editable fields */}
      {isEditing && (
        <View>
          {/* Name */}
          <View className="mb-4">
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</Text>
            <View 
              className="bg-gray-50 dark:bg-gray-700 px-4 rounded-lg"
              style={{ height: 52, justifyContent: 'center' }}
            >
              <TextInput
                className="text-gray-900 dark:text-white text-base"
                value={profile.name}
                onChangeText={(text) => onChange('name', text)}
                placeholder="Your Name"
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </View>

          {/* Gender */}
          <View className="mb-4">
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Gender</Text>
            <View className="flex-row" style={{ gap: 16 }}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => onChange('gender', g)}
                  className={`flex-1 p-3 rounded-lg items-center border ${
                    profile.gender === g 
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <Text className={`capitalize font-medium ${
                    profile.gender === g ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            {/* Age */}
            <View className="w-[30%]">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Age</Text>
              <View 
                className="bg-gray-50 dark:bg-gray-700 px-4 rounded-lg"
                style={{ height: 52, justifyContent: 'center' }}
              >
                <TextInput
                  className="text-gray-900 dark:text-white text-base"
                  value={profile.age?.toString()}
                  onChangeText={(text) => onChange('age', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="25"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>

            {/* Weight */}
            <View className="w-[32%]">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Weight ({isMetric ? 'kg' : 'lbs'})</Text>
              <View 
                className="bg-gray-50 dark:bg-gray-700 px-4 rounded-lg"
                style={{ height: 52, justifyContent: 'center' }}
              >
                <TextInput
                  className="text-gray-900 dark:text-white text-base"
                  value={profile.weight?.toString()}
                  onChangeText={(text) => onChange('weight', parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>

            {/* Height */}
            <View className="w-[32%]">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Height ({isMetric ? 'cm' : 'ft'})</Text>
              <View 
                className="bg-gray-50 dark:bg-gray-700 px-4 rounded-lg"
                style={{ height: 52, justifyContent: 'center' }}
              >
                <TextInput
                  className="text-gray-900 dark:text-white text-base"
                  value={profile.height?.toString()}
                  onChangeText={(text) => onChange('height', parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>
          </View>

          {/* Unit Toggle */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-gray-600 dark:text-gray-400">Use Metric Units</Text>
            <Switch
              value={isMetric}
              onValueChange={onToggleMetric}
              trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
            />
          </View>

          {/* Activity Level */}
          <View className="mb-4">
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Activity Level</Text>
            <View style={{ gap: 8 }}>
              {[
                { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                { value: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
                { value: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
                { value: 'active', label: 'Very Active', desc: '6-7 days/week' },
                { value: 'very_active', label: 'Extremely Active', desc: 'Physical job or athlete' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onChange('activityLevel', option.value)}
                  className={`p-3 rounded-lg border ${
                    profile.activityLevel === option.value
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <Text className={`font-medium ${
                    profile.activityLevel === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                  }`}>
                    {option.label}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal */}
          <View className="mb-2">
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Goal</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              {[
                { value: 'lose', label: 'Lose Weight' },
                { value: 'maintain', label: 'Maintain' },
                { value: 'gain', label: 'Gain Muscle' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onChange('goal', option.value)}
                  className={`flex-1 p-3 rounded-lg items-center border ${
                    profile.goal === option.value
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <Text className={`text-xs font-bold text-center ${
                    profile.goal === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
