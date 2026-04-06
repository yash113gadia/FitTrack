import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { colors } from '../constants/theme';
import { databaseService } from '../services/database';
import { useAppStore } from '../store/appStore';
import { UserProfile } from '../types';
import { TrophyCase } from '../components/community/TrophyCase';

const UserProfileScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const currentUser = useAppStore((state) => state.user);
  const { userId } = route.params;
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.white : colors.text.primary;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [user, following] = await Promise.all([
          databaseService.getUser(userId),
          currentUser ? databaseService.isFollowing(currentUser.id, userId) : Promise.resolve(false)
        ]);
        setProfile(user);
        setIsFollowing(following);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return;
    try {
      if (isFollowing) {
        await databaseService.unfollowUser(currentUser.id, profile.id);
      } else {
        await databaseService.followUser(currentUser.id, profile.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow toggle failed:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          
          {currentUser && currentUser.id !== profile.id && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TrophyCase muscleLevels={profile.muscleLevels} />
        
        {/* Can add more profile details here */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  followButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: colors.gray[200],
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  followingButtonText: {
    color: colors.text.primary,
  },
});

export default UserProfileScreen;
