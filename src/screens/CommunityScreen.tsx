import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/theme';
import { databaseService } from '../services/database';
import { useAppStore } from '../store/appStore';
import { FeedItem } from '../types';
import { FeedCard } from '../components/community/FeedCard';
import { MainTabNavigationProp } from '../navigation/types';

const CommunityScreen = () => {
  const navigation = useNavigation<MainTabNavigationProp<'Community'>>();
  const user = useAppStore((state) => state.user);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    try {
      const data = await databaseService.getFeed(user.id);
      setFeed(data);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleInteraction = async (item: FeedItem, type: 'like' | 'fist_bump') => {
    if (!user) return;
    
    // Optimistic update
    const prevFeed = [...feed];
    setFeed(feed.map(i => {
      if (i.id === item.id) {
        // Toggle logic
        if (i.userInteraction === type) {
          // Removing interaction
          return {
            ...i,
            userInteraction: null,
            [type === 'like' ? 'likes' : 'fistBumps']: i[type === 'like' ? 'likes' : 'fistBumps'] - 1
          };
        } else {
          // Adding/Changing interaction
          const newLikes = type === 'like' ? i.likes + 1 : (i.userInteraction === 'like' ? i.likes - 1 : i.likes);
          const newBumps = type === 'fist_bump' ? i.fistBumps + 1 : (i.userInteraction === 'fist_bump' ? i.fistBumps - 1 : i.fistBumps);
          return {
            ...i,
            userInteraction: type,
            likes: newLikes,
            fistBumps: newBumps
          };
        }
      }
      return i;
    }));

    try {
      if (item.userInteraction === type) {
        await databaseService.removeInteraction(item.id, user.id);
      } else {
        await databaseService.addInteraction(item.id, user.id, type);
      }
    } catch (error) {
      // Revert on error
      setFeed(prevFeed);
      console.error('Interaction failed:', error);
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => (
    <FeedCard
      item={item}
      onLike={() => handleInteraction(item, 'like')}
      onFistBump={() => handleInteraction(item, 'fist_bump')}
      onUserPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed(); }} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No updates yet.</Text>
              <Text style={styles.subText}>Follow others to see their progress!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default CommunityScreen;
