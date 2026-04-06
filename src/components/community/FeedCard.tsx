import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { FeedItem } from '../../types';
import { MuscleBadge } from '../common';

interface FeedCardProps {
  item: FeedItem;
  onLike: () => void;
  onFistBump: () => void;
  onUserPress: () => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({ item, onLike, onFistBump, onUserPress }) => {
  const isRankUp = item.type === 'rank_up';
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onUserPress} style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>
        
        {isRankUp && (
          <View style={styles.badgeContainer}>
            <MuscleBadge 
              muscleGroup={item.content.data.muscleGroup} 
              level={item.content.data.newRank} 
              size={40} 
              fontSize={8} 
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.content.title}</Text>
        <Text style={styles.message}>{item.content.message}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionButton, item.userInteraction === 'like' && styles.activeAction]} 
          onPress={onLike}
        >
          <Ionicons 
            name={item.userInteraction === 'like' ? 'heart' : 'heart-outline'} 
            size={20} 
            color={item.userInteraction === 'like' ? colors.error[500] : colors.gray[500]} 
          />
          <Text style={[styles.actionText, item.userInteraction === 'like' && { color: colors.error[500] }]}>
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, item.userInteraction === 'fist_bump' && styles.activeAction]} 
          onPress={onFistBump}
        >
          <Ionicons 
            name="hand-left-outline" // Using hand icon for fist bump
            size={20} 
            color={item.userInteraction === 'fist_bump' ? colors.primary[500] : colors.gray[500]} 
          />
          <Text style={[styles.actionText, item.userInteraction === 'fist_bump' && { color: colors.primary[500] }]}>
            {item.fistBumps}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  badgeContainer: {
    // Optional styling
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeAction: {
    // Optional styling for active state container
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
  },
});
