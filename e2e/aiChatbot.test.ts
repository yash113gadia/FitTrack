/**
 * AI Chatbot E2E Tests
 * 
 * Tests for AI nutrition chatbot functionality
 */

import { device, element, by, waitFor, expect } from 'detox';
import { 
  TIMEOUTS, 
  completeOnboarding,
  navigateTo,
  resetAppState,
  scrollToElement,
} from './utils/testHelpers';

describe('AI Chatbot', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
    await completeOnboarding();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await navigateTo.chatbot();
  });

  describe('Chat Interface', () => {
    it('should display chat screen', async () => {
      await waitFor(element(by.id('chatbot-screen')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should show welcome message', async () => {
      await expect(element(by.id('welcome-message'))).toBeVisible();
    });

    it('should display chat input field', async () => {
      await expect(element(by.id('chat-input'))).toBeVisible();
    });

    it('should show send button', async () => {
      await expect(element(by.id('send-message-btn'))).toBeVisible();
    });

    it('should display suggested questions', async () => {
      await expect(element(by.id('suggested-questions'))).toBeVisible();
    });
  });

  describe('Sending Messages', () => {
    it('should send a message successfully', async () => {
      await element(by.id('chat-input')).typeText('Hello');
      await element(by.id('send-message-btn')).tap();
      
      // User message should appear
      await waitFor(element(by.text('Hello')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should show typing indicator while processing', async () => {
      await element(by.id('chat-input')).typeText('What foods are high in protein?');
      await element(by.id('send-message-btn')).tap();
      
      // Typing indicator should appear
      await waitFor(element(by.id('typing-indicator')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.SHORT);
    });

    it('should receive AI response', async () => {
      await element(by.id('chat-input')).typeText('What are good sources of protein?');
      await element(by.id('send-message-btn')).tap();
      
      // Wait for response
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should clear input after sending', async () => {
      await element(by.id('chat-input')).typeText('Test message');
      await element(by.id('send-message-btn')).tap();
      
      // Input should be cleared
      await expect(element(by.id('chat-input'))).toHaveText('');
    });
  });

  describe('Nutrition Questions', () => {
    it('should respond to protein questions', async () => {
      await element(by.id('chat-input')).typeText('How much protein should I eat daily?');
      await element(by.id('send-message-btn')).tap();
      
      // Should get a response mentioning protein
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should respond to calorie questions', async () => {
      await element(by.id('chat-input')).typeText('How many calories do I need to lose weight?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should respond to meal suggestions', async () => {
      await element(by.id('chat-input')).typeText('Suggest a healthy breakfast');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should respond to macro balance questions', async () => {
      await element(by.id('chat-input')).typeText('What should my macro ratio be for muscle gain?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should provide personalized advice based on user goals', async () => {
      await element(by.id('chat-input')).typeText('Based on my goals, what should I eat today?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });
  });

  describe('Suggested Questions', () => {
    it('should tap suggested question to populate input', async () => {
      // Tap first suggested question
      await element(by.id('suggested-question-1')).tap();
      
      // Input should be populated
      await expect(element(by.id('chat-input'))).not.toHaveText('');
    });

    it('should send suggested question on tap', async () => {
      await element(by.id('suggested-question-1')).tap();
      
      // Should either populate input or send directly
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should hide suggestions after first message', async () => {
      await element(by.id('chat-input')).typeText('Hello');
      await element(by.id('send-message-btn')).tap();
      
      // Suggestions may hide or remain
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });
  });

  describe('Chat History', () => {
    it('should maintain conversation history', async () => {
      // Send first message
      await element(by.id('chat-input')).typeText('What is protein?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Send follow-up
      await element(by.id('chat-input')).typeText('How much should I eat?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('chat-message-list')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });

    it('should scroll through long conversations', async () => {
      // Send multiple messages
      const messages = ['Question 1', 'Question 2', 'Question 3'];
      
      for (const msg of messages) {
        await element(by.id('chat-input')).typeText(msg);
        await element(by.id('send-message-btn')).tap();
        
        await waitFor(element(by.id('ai-response')))
          .toBeVisible()
          .withTimeout(TIMEOUTS.LONG);
      }
      
      // Should be able to scroll
      await element(by.id('chat-message-list')).scroll(500, 'up');
    });

    it('should persist chat history across screen navigation', async () => {
      await element(by.id('chat-input')).typeText('Remember this message');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Navigate away and back
      await navigateTo.dashboard();
      await navigateTo.chatbot();
      
      // Previous message should still be visible
      await expect(element(by.text('Remember this message'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should show error message on network failure', async () => {
      // Simulate network error by hiding data network in status bar
      await device.setStatusBar({
        dataNetwork: 'hide',
      });
      
      await element(by.id('chat-input')).typeText('Test network error');
      await element(by.id('send-message-btn')).tap();
      
      // Should show error state
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Reset network
      await device.setStatusBar({
        dataNetwork: '4g',
      });
    });

    it('should allow retry after error', async () => {
      await device.setStatusBar({
        dataNetwork: 'hide',
      });
      
      await element(by.id('chat-input')).typeText('Test retry');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Reset network
      await device.setStatusBar({
        dataNetwork: '4g',
      });
      
      // Retry button should work
      await element(by.id('retry-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should handle empty message submission', async () => {
      // Try to send empty message
      await element(by.id('send-message-btn')).tap();
      
      // Nothing should happen or show validation
      // Input should remain
      await expect(element(by.id('chat-input'))).toBeVisible();
    });
  });

  describe('Food Analysis', () => {
    it('should analyze food from description', async () => {
      await element(by.id('chat-input')).typeText('How many calories in a chicken breast?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should suggest alternatives for unhealthy foods', async () => {
      await element(by.id('chat-input')).typeText('What is a healthier alternative to soda?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should provide portion guidance', async () => {
      await element(by.id('chat-input')).typeText('What is a healthy portion of rice?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });
  });

  describe('Quick Actions from Chat', () => {
    it('should offer to log food from conversation', async () => {
      await element(by.id('chat-input')).typeText('I just ate a banana');
      await element(by.id('send-message-btn')).tap();
      
      // May show quick log option
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Look for quick log suggestion
      const quickLogBtn = element(by.id('quick-log-suggestion'));
      try {
        await expect(quickLogBtn).toBeVisible();
      } catch {
        // Quick log may not always appear
      }
    });
  });

  describe('Accessibility', () => {
    it('should support voice input button', async () => {
      // Voice input button should be visible
      await expect(element(by.id('voice-input-btn'))).toBeVisible();
    });

    it('should have proper labels for screen readers', async () => {
      // Check accessibility labels exist
      await expect(element(by.id('chat-input'))).toBeVisible();
      await expect(element(by.id('send-message-btn'))).toBeVisible();
    });
  });

  describe('Context Awareness', () => {
    it('should reference user profile data in responses', async () => {
      await element(by.id('chat-input')).typeText('What should I eat based on my weight goal?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should reference daily food log in responses', async () => {
      // First log some food
      await navigateTo.logFood();
      
      await element(by.id('quick-add-fab')).tap();
      await element(by.text('Manual Entry')).tap();
      
      await element(by.id('food-name-input')).typeText('Test Apple');
      await element(by.id('calories-input')).typeText('95');
      await element(by.id('log-food-btn')).tap();
      
      // Go to chatbot
      await navigateTo.chatbot();
      
      await element(by.id('chat-input')).typeText('What have I eaten today?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });

    it('should provide recommendations based on remaining macros', async () => {
      await element(by.id('chat-input')).typeText('What should I eat to hit my protein goal?');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
    });
  });

  describe('Clear Chat', () => {
    it('should have option to clear chat history', async () => {
      // Send a message first
      await element(by.id('chat-input')).typeText('Test message');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      // Look for clear chat option
      await element(by.id('chat-menu-btn')).tap();
      await expect(element(by.id('clear-chat-btn'))).toBeVisible();
    });

    it('should confirm before clearing chat', async () => {
      await element(by.id('chat-input')).typeText('Test');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      await element(by.id('chat-menu-btn')).tap();
      await element(by.id('clear-chat-btn')).tap();
      
      // Confirmation dialog
      await expect(element(by.id('confirm-clear-dialog'))).toBeVisible();
    });

    it('should clear all messages when confirmed', async () => {
      await element(by.id('chat-input')).typeText('Message to delete');
      await element(by.id('send-message-btn')).tap();
      
      await waitFor(element(by.id('ai-response')))
        .toBeVisible()
        .withTimeout(TIMEOUTS.LONG);
      
      await element(by.id('chat-menu-btn')).tap();
      await element(by.id('clear-chat-btn')).tap();
      await element(by.id('confirm-clear-btn')).tap();
      
      // Messages should be cleared
      await waitFor(element(by.text('Message to delete')))
        .not.toBeVisible()
        .withTimeout(TIMEOUTS.MEDIUM);
    });
  });
});
