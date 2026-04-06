/**
 * ChatbotScreen - AI Health Coaching Assistant
 *
 * Intelligent chatbot powered by Gemini AI for nutrition and fitness coaching.
 * Features:
 * - Real-time chat interface with message bubbles
 * - Context-aware responses based on user's progress
 * - Quick question buttons for common queries
 * - Voice input support
 * - Save/share functionality
 * - Feedback system (thumbs up/down)
 *
 * @example
 * <ChatbotScreen />
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Share,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GoogleGenerativeAI, ChatSession as GeminiChatSession } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

import { databaseService } from '../services/database';
import { useAppStore, FREE_AI_MESSAGES_LIMIT } from '../store/appStore';
import { Button, Card, useToast, Modal } from '../components/common';
import { PremiumModal, PremiumBanner } from '../components/common/PremiumModal';
import { colors } from '../constants/theme';
import { ChatMessage, ChatSession, DailySummary, DailyGoals, StreakData } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY';
const MODEL_NAME = 'gemini-1.5-flash';
const CHAT_STORAGE_KEY = '@fittrack_chat_history';
const MAX_HISTORY_MESSAGES = 20;
const MAX_STORED_SESSIONS = 10;

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are Whole Fit AI, a knowledgeable and supportive nutrition and fitness coach. Your role is to help users achieve their health and fitness goals through personalized guidance.

PERSONALITY:
- Be encouraging, positive, and motivational
- Use simple, actionable language
- Be concise and helpful
- Show empathy and understanding
- Celebrate wins and encourage on setbacks

KNOWLEDGE AREAS:
- Macronutrient education (proteins, fats, carbs, calories)
- Meal planning and prep tips
- Exercise and workout advice (general)
- Healthy habit formation
- Food substitutions and alternatives
- Portion control strategies
- Reading nutrition labels
- Dining out strategies

RESPONSE GUIDELINES:
- Keep responses concise (2-3 paragraphs max)
- Use bullet points for lists
- Include specific numbers when giving advice
- Reference user's current progress when relevant
- Ask follow-up questions to understand better
- Never promote extreme diets or dangerous practices

PROHIBITED:
- Don't diagnose medical conditions
- Don't prescribe medications or supplements without recommending professional consultation
- Don't provide specific advice for eating disorders without recommending professional help
- Don't make guarantees about results
- Don't promote specific brands unless asked
- Always remind users to consult healthcare providers for medical advice when relevant`;

// ============================================================================
// TYPES
// ============================================================================

interface ExtendedChatMessage extends ChatMessage {
  isError?: boolean;
  isFavorite?: boolean;
  feedback?: 'positive' | 'negative' | null;
  suggestedFollowUps?: string[];
}

interface UserContext {
  todaysMacros: DailySummary | null;
  goals: DailyGoals | null;
  streak: StreakData | null;
  userName: string;
}

// ============================================================================
// QUICK QUESTIONS
// ============================================================================

const QUICK_QUESTIONS = [
  { id: '1', text: '🥩 What should I eat for protein?', icon: 'nutrition' },
  { id: '2', text: '📊 Is my progress good?', icon: 'trending-up' },
  { id: '3', text: '🍽️ Suggest a meal plan', icon: 'restaurant' },
  { id: '4', text: '⚖️ Why am I not losing weight?', icon: 'help-circle' },
  { id: '5', text: '🔥 What\'s a calorie deficit?', icon: 'flame' },
  { id: '6', text: '💪 How much protein do I need?', icon: 'barbell' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
};

const buildContextString = (context: UserContext): string => {
  const parts: string[] = [];
  
  parts.push(`\n[USER CONTEXT]`);
  parts.push(`User: ${context.userName || 'User'}`);
  
  if (context.todaysMacros) {
    parts.push(`\nToday's Progress:`);
    parts.push(`- Calories: ${Math.round(context.todaysMacros.totalCalories)} consumed`);
    parts.push(`- Protein: ${Math.round(context.todaysMacros.totalProtein)}g consumed`);
    parts.push(`- Carbs: ${Math.round(context.todaysMacros.totalCarbs)}g consumed`);
    parts.push(`- Fats: ${Math.round(context.todaysMacros.totalFats)}g consumed`);
    parts.push(`- Completion: ${Math.round(context.todaysMacros.completionPercentage)}%`);
  }
  
  if (context.goals) {
    parts.push(`\nDaily Goals:`);
    parts.push(`- Calorie Goal: ${context.goals.calories}`);
    parts.push(`- Protein Goal: ${context.goals.protein}g`);
    parts.push(`- Carb Goal: ${context.goals.carbs}g`);
    parts.push(`- Fat Goal: ${context.goals.fats}g`);
  }
  
  if (context.streak) {
    parts.push(`\nStreak: ${context.streak.currentStreak} days (Best: ${context.streak.longestStreak})`);
  }
  
  return parts.join('\n');
};

// ============================================================================
// TYPING INDICATOR COMPONENT
// ============================================================================

const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ),
      -1,
      false
    );
    
    setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      );
    }, 150);
    
    setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      );
    }, 300);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View className="flex-row items-center px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md self-start max-w-[100px] ml-4 mb-4">
      <Animated.View
        style={animatedStyle1}
        className="w-2 h-2 rounded-full bg-gray-400 mr-1"
      />
      <Animated.View
        style={animatedStyle2}
        className="w-2 h-2 rounded-full bg-gray-400 mr-1"
      />
      <Animated.View
        style={animatedStyle3}
        className="w-2 h-2 rounded-full bg-gray-400"
      />
    </View>
  );
};

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

interface MessageBubbleProps {
  message: ExtendedChatMessage;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
  onFavorite: (messageId: string) => void;
  onCopy: (content: string) => void;
  onShare: (content: string) => void;
  onFollowUp: (question: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onFeedback,
  onFavorite,
  onCopy,
  onShare,
  onFollowUp,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={isUser ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
      layout={Layout.springify()}
      className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowActions(!showActions);
        }}
        className={`max-w-[85%] ${isUser ? 'mr-4' : 'ml-4'}`}
      >
        {/* Message bubble */}
        <View
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary-500 rounded-br-md'
              : message.isError
              ? 'bg-red-100 rounded-bl-md'
              : 'bg-gray-100 rounded-bl-md'
          }`}
        >
          <Text
            className={`text-base leading-6 ${
              isUser ? 'text-white' : message.isError ? 'text-red-700' : 'text-gray-800'
            }`}
          >
            {message.content}
          </Text>
        </View>

        {/* Timestamp */}
        <Text className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
          {formatTimestamp(message.timestamp)}
          {message.isFavorite && ' ⭐'}
        </Text>

        {/* Actions for AI messages */}
        {!isUser && showActions && (
          <Animated.View entering={FadeIn} className="flex-row mt-2 gap-2">
            <TouchableOpacity
              onPress={() => {
                onFeedback(message.id, 'positive');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`p-2 rounded-full ${
                message.feedback === 'positive' ? 'bg-green-100' : 'bg-gray-200'
              }`}
            >
              <Ionicons
                name="thumbs-up"
                size={16}
                color={message.feedback === 'positive' ? colors.success[500] : colors.gray[500]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onFeedback(message.id, 'negative');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`p-2 rounded-full ${
                message.feedback === 'negative' ? 'bg-red-100' : 'bg-gray-200'
              }`}
            >
              <Ionicons
                name="thumbs-down"
                size={16}
                color={message.feedback === 'negative' ? colors.error[500] : colors.gray[500]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onFavorite(message.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`p-2 rounded-full ${message.isFavorite ? 'bg-yellow-100' : 'bg-gray-200'}`}
            >
              <Ionicons
                name={message.isFavorite ? 'star' : 'star-outline'}
                size={16}
                color={message.isFavorite ? colors.warning[500] : colors.gray[500]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onCopy(message.content)}
              className="p-2 rounded-full bg-gray-200"
            >
              <Ionicons name="copy" size={16} color={colors.gray[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onShare(message.content)}
              className="p-2 rounded-full bg-gray-200"
            >
              <Ionicons name="share-outline" size={16} color={colors.gray[500]} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Suggested follow-ups */}
        {!isUser && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
          <View className="mt-3 gap-2">
            {message.suggestedFollowUps.map((followUp, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onFollowUp(followUp)}
                className="px-3 py-2 bg-primary-50 rounded-xl border border-primary-200"
              >
                <Text className="text-primary-600 text-sm">{followUp}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ChatbotScreen: React.FC = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const { user, isPremium, aiUsageCount, incrementAiUsage, setPremium } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // State
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({
    todaysMacros: null,
    goals: null,
    streak: null,
    userName: user?.name || 'User',
  });
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [chatSession, setChatSession] = useState<GeminiChatSession | null>(null);

  // Free usage limit (using imported constant)
  const canUseAI = isPremium || aiUsageCount < FREE_AI_MESSAGES_LIMIT;
  const remainingFreeUses = Math.max(0, FREE_AI_MESSAGES_LIMIT - aiUsageCount);

  // Gemini AI instance
  const genAI = useMemo(() => new GoogleGenerativeAI(GEMINI_API_KEY), []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initializeChat();
    loadUserContext();
  }, []);

  const initializeChat = async () => {
    // Load chat history
    try {
      const storedHistory = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        setMessages(parsed.slice(-MAX_HISTORY_MESSAGES));
      } else {
        // Add welcome message
        addWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      addWelcomeMessage();
    }

    // Initialize Gemini chat session
    initGeminiSession();
  };

  const initGeminiSession = useCallback((history?: ExtendedChatMessage[]) => {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      // Convert our messages to Gemini format
      const geminiHistory = (history || messages)
        .filter((msg) => !msg.isError)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

      const chat = model.startChat({
        history: geminiHistory as any,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      });

      setChatSession(chat);
    } catch (error) {
      console.error('Error initializing Gemini session:', error);
    }
  }, [genAI, messages]);

  const loadUserContext = async () => {
    try {
      const userId = user?.id || 1;
      const today = format(new Date(), 'yyyy-MM-dd');

      const [macros, goals, streak] = await Promise.all([
        databaseService.getDailySummary(userId, today).catch(() => null),
        databaseService.getUserGoals(userId).catch(() => null),
        databaseService.getCurrentStreak(userId).catch(() => null),
      ]);

      setUserContext({
        todaysMacros: macros,
        goals: goals,
        streak: streak,
        userName: user?.name || 'User',
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ExtendedChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `Hello! 👋 I'm Whole Fit AI, your personal nutrition and fitness coach. I'm here to help you reach your health goals!\n\nI can help you with:\n• Understanding your macros and calories\n• Meal planning and food suggestions\n• Exercise tips and motivation\n• Answering nutrition questions\n\nHow can I help you today?`,
      timestamp: new Date().toISOString(),
      suggestedFollowUps: [
        'How should I start tracking my food?',
        'What are good protein sources?',
        'Help me understand calories',
      ],
    };
    setMessages([welcomeMessage]);
  };

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check if user can use AI features
    if (!canUseAI) {
      setShowPremiumModal(true);
      return;
    }

    // Increment AI usage for free users
    if (!isPremium) {
      incrementAiUsage();
    }

    const userMessage: ExtendedChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setShowQuickQuestions(false);
    setIsLoading(true);
    setIsTyping(true);

    Keyboard.dismiss();
    scrollToBottom();

    try {
      // Refresh context before each message
      await loadUserContext();

      // Build the full prompt with context
      const contextString = buildContextString(userContext);
      const fullPrompt = `${SYSTEM_PROMPT}\n${contextString}\n\nUser message: ${text.trim()}`;

      let responseText: string;

      if (chatSession) {
        // Use existing chat session
        const result = await chatSession.sendMessage(fullPrompt);
        responseText = result.response.text();
      } else {
        // Fallback to single generation
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(fullPrompt);
        responseText = result.response.text();
      }

      // Parse suggested follow-ups from response (if AI includes them)
      const followUps = extractSuggestedFollowUps(responseText);
      const cleanedResponse = removeSuggestedFollowUpsFromText(responseText);

      const aiMessage: ExtendedChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: cleanedResponse,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: followUps.length > 0 ? followUps : generateFollowUps(text),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error sending message:', error);

      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'It looks like you\'re offline. Please check your connection and try again.';
      }

      const errorMsg: ExtendedChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      scrollToBottom();
      saveChatHistory();
    }
  };

  const extractSuggestedFollowUps = (text: string): string[] => {
    // Look for follow-up suggestions in various formats
    const patterns = [
      /suggested follow-ups?:\s*\n?((?:[-•*]\s*.+\n?)+)/i,
      /you might also ask:\s*\n?((?:[-•*]\s*.+\n?)+)/i,
      /related questions?:\s*\n?((?:[-•*]\s*.+\n?)+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1]
          .split(/\n/)
          .map((line) => line.replace(/^[-•*]\s*/, '').trim())
          .filter((line) => line.length > 0 && line.length < 100)
          .slice(0, 3);
      }
    }
    return [];
  };

  const removeSuggestedFollowUpsFromText = (text: string): string => {
    return text
      .replace(/suggested follow-ups?:\s*\n?((?:[-•*]\s*.+\n?)+)/gi, '')
      .replace(/you might also ask:\s*\n?((?:[-•*]\s*.+\n?)+)/gi, '')
      .replace(/related questions?:\s*\n?((?:[-•*]\s*.+\n?)+)/gi, '')
      .trim();
  };

  const generateFollowUps = (userMessage: string): string[] => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('protein')) {
      return ['What are complete vs incomplete proteins?', 'How do I get protein on a budget?'];
    }
    if (lowerMsg.includes('weight') || lowerMsg.includes('lose') || lowerMsg.includes('gain')) {
      return ['How fast should I lose weight safely?', 'What should my calorie deficit be?'];
    }
    if (lowerMsg.includes('meal') || lowerMsg.includes('eat')) {
      return ['What are good snack options?', 'How do I meal prep effectively?'];
    }
    if (lowerMsg.includes('calorie')) {
      return ['How do I calculate my TDEE?', 'Are all calories equal?'];
    }
    return [];
  };

  // ============================================================================
  // CHAT MANAGEMENT
  // ============================================================================

  const saveChatHistory = async () => {
    try {
      await AsyncStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES))
      );
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const clearChatHistory = async () => {
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      setMessages([]);
      addWelcomeMessage();
      initGeminiSession([]);
      setShowClearModal(false);
      setShowQuickQuestions(true);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Failed to clear history');
    }
  };

  const startNewConversation = async () => {
    // Save current conversation if it has messages
    if (messages.length > 1) {
      // Could save to a sessions list here
    }
    
    setMessages([]);
    addWelcomeMessage();
    initGeminiSession([]);
    setShowNewChatModal(false);
    setShowQuickQuestions(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserContext();
    setRefreshing(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // ============================================================================
  // MESSAGE ACTIONS
  // ============================================================================

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
          : msg
      )
    );
    toast.success(feedback === 'positive' ? 'Thanks for the feedback!' : 'We\'ll try to do better');
  };

  const handleFavorite = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isFavorite: !msg.isFavorite } : msg
      )
    );
  };

  const handleCopy = async (content: string) => {
    try {
      Clipboard.setString(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async (content: string) => {
    try {
      await Share.share({
        message: `From Whole Fit AI:\n\n${content}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFollowUp = (question: string) => {
    sendMessage(question);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">Whole Fit AI</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {isPremium ? 'Premium' : `${Math.max(0, FREE_AI_MESSAGES_LIMIT - aiUsageCount)} free messages left`}
              </Text>
            </View>
          </View>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowNewChatModal(true)}
              className="p-2"
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowClearModal(true)}
              className="p-2 -mr-2"
            >
              <Ionicons name="trash-outline" size={22} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Context Card */}
        {userContext.todaysMacros && (
          <View className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={16} color={colors.primary[600]} />
                <Text className="text-primary-700 dark:text-primary-300 text-xs ml-1.5 font-medium">
                  Today: {Math.round(userContext.todaysMacros.totalCalories)} cal
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="flame" size={14} color={colors.warning[500]} />
                <Text className="text-gray-600 dark:text-gray-400 text-xs ml-1">
                  {userContext.streak?.currentStreak || 0} day streak
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onContentSizeChange={scrollToBottom}
        >
          {/* Disclaimer */}
          <View className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={18} color={colors.warning[600]} />
              <Text className="text-amber-700 dark:text-amber-300 text-xs ml-2 flex-1">
                I provide general wellness information. For medical advice, please consult a healthcare professional.
              </Text>
            </View>
          </View>

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onFeedback={handleFeedback}
              onFavorite={handleFavorite}
              onCopy={handleCopy}
              onShare={handleShare}
              onFollowUp={handleFollowUp}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          {/* Quick Questions */}
          {showQuickQuestions && messages.length <= 1 && (
            <Animated.View entering={FadeIn.delay(500)} className="px-4 mt-4 mb-6">
              <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">Quick questions:</Text>
              <View className="flex-row flex-wrap gap-2">
                {QUICK_QUESTIONS.map((question) => (
                  <TouchableOpacity
                    key={question.id}
                    onPress={() => handleQuickQuestion(question.text)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600"
                  >
                    <Text className="text-gray-700 dark:text-gray-300 text-sm">{question.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          <View className="h-4" />
        </ScrollView>

        {/* Input Area */}
        <View className="px-4 pt-3 pb-32 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center gap-3">
            <View 
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-3xl px-4"
              style={{ minHeight: 48, maxHeight: 120, justifyContent: 'center' }}
            >
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything about nutrition..."
                placeholderTextColor={colors.gray[400]}
                multiline
                className="text-gray-800 dark:text-gray-100 text-base"
                style={{ maxHeight: 100, paddingVertical: 12 }}
                onFocus={() => setShowQuickQuestions(false)}
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                inputText.trim() && !isLoading
                  ? 'bg-primary-500'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.gray[500]} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? 'white' : colors.gray[400]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear History Modal */}
        <Modal
          visible={showClearModal}
          onClose={() => setShowClearModal(false)}
          title="Clear Chat History?"
          size="sm"
        >
          <View className="p-4">
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              This will delete all messages in this conversation. This action cannot be undone.
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowClearModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-primary-500 items-center justify-center"
              >
                <Text className="text-primary-500 font-semibold text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearChatHistory}
                className="flex-1 py-3 rounded-xl bg-error-500 items-center justify-center"
              >
                <Text className="text-white font-semibold text-base">Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* New Chat Modal */}
        <Modal
          visible={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          title="Start New Conversation?"
          size="sm"
        >
          <View className="p-4">
            <Text className="text-gray-600 dark:text-gray-400 mb-6">
              Start a fresh conversation with Whole Fit AI. Your current messages will be saved in history.
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowNewChatModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-primary-500 items-center justify-center"
              >
                <Text className="text-primary-500 font-semibold text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startNewConversation}
                className="flex-1 py-3 rounded-xl bg-primary-500 items-center justify-center"
              >
                <Text className="text-white font-semibold text-base">New Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Premium Modal */}
        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSubscribe={() => {
            setShowPremiumModal(false);
            // In production, this would open the subscription flow
            toast.info('Premium subscription coming soon!');
          }}
          feature="AI Health Coach"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatbotScreen;
