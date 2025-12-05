/**
 * Gemini Vision API Service
 *
 * AI-powered food recognition using Google's Gemini Vision model.
 * Analyzes food images to estimate macronutrients and identify foods.
 *
 * @example
 * const result = await geminiService.estimateFoodMacros(imageUri);
 * if (result.success) {
 *   console.log(result.data); // AIFoodEstimate
 * }
 */

import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import {
  cacheDirectory,
  copyAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { AIFoodEstimate } from '../types';
import config from '../config';
import { sanitizeForAI } from '../utils/security';

// ============================================================================
// CONFIGURATION
// ============================================================================

// API Key from centralized config (loaded from environment variables)
const GEMINI_API_KEY = config.gemini.apiKey;

// Model configuration
const MODEL_NAME = config.gemini.model;
const MAX_TOKENS = config.gemini.maxTokens;
const TEMPERATURE = config.gemini.temperature;

// Rate limiting
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;

// ============================================================================
// TYPES
// ============================================================================

export interface GeminiAPIResult {
  success: boolean;
  data?: AIFoodEstimate;
  multipleItems?: AIFoodEstimate[];
  error?: string;
  errorCode?: 'API_ERROR' | 'PARSE_ERROR' | 'RATE_LIMITED' | 'INVALID_IMAGE' | 'NO_FOOD_DETECTED' | 'NETWORK_ERROR';
  rawResponse?: string;
}

export interface ImageInput {
  uri: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface EstimationContext {
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  portionHint?: string; // e.g., "small plate", "large bowl"
  cuisineHint?: string; // e.g., "Italian", "Japanese"
  additionalInfo?: string;
}

// ============================================================================
// PROMPTS
// ============================================================================

const FOOD_ANALYSIS_PROMPT = `You are an expert nutritionist and food recognition AI. Analyze this food image and provide detailed nutritional estimates.

TASK:
1. Identify all food items visible in the image
2. Estimate the portion size for each item
3. Calculate estimated macronutrients based on typical serving sizes

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object (no markdown, no explanation outside JSON).
Use this exact structure:

{
  "foods": [
    {
      "name": "Food name (be specific, e.g., 'Grilled Chicken Breast' not just 'Chicken')",
      "servingSize": 150,
      "servingUnit": "g",
      "calories": 250,
      "protein": 30,
      "fats": 8,
      "carbs": 2,
      "confidence": 85,
      "reasoning": "Brief explanation of estimate"
    }
  ],
  "totalMeal": {
    "calories": 500,
    "protein": 45,
    "fats": 15,
    "carbs": 40
  },
  "overallConfidence": 80,
  "notes": "Any relevant observations about the meal"
}

GUIDELINES:
- Confidence should be 0-100 (higher = more certain)
- If you can't identify a food clearly, set confidence below 50
- Round all nutritional values to whole numbers except for small quantities
- Consider cooking methods (fried adds fat, grilled reduces it)
- Account for visible sauces, oils, and toppings
- If image is unclear or doesn't contain food, return: {"error": "NO_FOOD_DETECTED", "message": "explanation"}

IMPORTANT: Respond with ONLY the JSON object, no other text.`;

const FOOD_ANALYSIS_WITH_CONTEXT_PROMPT = (context: EstimationContext) => `You are an expert nutritionist and food recognition AI. Analyze this food image and provide detailed nutritional estimates.

CONTEXT PROVIDED:
${context.mealType ? `- Meal Type: ${context.mealType}` : ''}
${context.portionHint ? `- Portion Hint: ${context.portionHint}` : ''}
${context.cuisineHint ? `- Cuisine: ${context.cuisineHint}` : ''}
${context.additionalInfo ? `- Additional Info: ${context.additionalInfo}` : ''}

TASK:
1. Identify all food items visible in the image
2. Estimate the portion size for each item (use context hints if provided)
3. Calculate estimated macronutrients based on typical serving sizes

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object (no markdown, no explanation outside JSON).
Use this exact structure:

{
  "foods": [
    {
      "name": "Food name (be specific, e.g., 'Grilled Chicken Breast' not just 'Chicken')",
      "servingSize": 150,
      "servingUnit": "g",
      "calories": 250,
      "protein": 30,
      "fats": 8,
      "carbs": 2,
      "confidence": 85,
      "reasoning": "Brief explanation of estimate"
    }
  ],
  "totalMeal": {
    "calories": 500,
    "protein": 45,
    "fats": 15,
    "carbs": 40
  },
  "overallConfidence": 80,
  "notes": "Any relevant observations about the meal"
}

GUIDELINES:
- Confidence should be 0-100 (higher = more certain)
- If you can't identify a food clearly, set confidence below 50
- Round all nutritional values to whole numbers except for small quantities
- Consider cooking methods (fried adds fat, grilled reduces it)
- Account for visible sauces, oils, and toppings
- If image is unclear or doesn't contain food, return: {"error": "NO_FOOD_DETECTED", "message": "explanation"}

IMPORTANT: Respond with ONLY the JSON object, no other text.`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class GeminiAPIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private lastRequestTime: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
    });
    this.isInitialized = GEMINI_API_KEY !== 'YOUR_API_KEY';
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized;
  }

  /**
   * Rate limiting: wait if needed before making a request
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Convert image URI to base64
   */
  private async imageToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
    try {
      // Handle different URI types
      let fileUri = uri;

      // If it's a content:// or ph:// URI, we need to copy it first
      if (uri.startsWith('content://') || uri.startsWith('ph://')) {
        const filename = `temp_${Date.now()}.jpg`;
        const destUri = `${cacheDirectory}${filename}`;
        await copyAsync({ from: uri, to: destUri });
        fileUri = destUri;
      }

      // Read file as base64
      const base64 = await readAsStringAsync(fileUri, {
        encoding: EncodingType.Base64,
      });

      // Determine MIME type from extension
      const extension = fileUri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';

      return { base64, mimeType };
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Parse AI response to structured data
   */
  private parseResponse(responseText: string): {
    success: boolean;
    data?: AIFoodEstimate;
    multipleItems?: AIFoodEstimate[];
    error?: string;
    errorCode?: GeminiAPIResult['errorCode'];
  } {
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      const parsed = JSON.parse(cleanedResponse);

      // Check for error response
      if (parsed.error === 'NO_FOOD_DETECTED') {
        return {
          success: false,
          error: parsed.message || 'No food detected in image',
          errorCode: 'NO_FOOD_DETECTED',
        };
      }

      // Validate required fields
      if (!parsed.foods || !Array.isArray(parsed.foods) || parsed.foods.length === 0) {
        return {
          success: false,
          error: 'Invalid response format: no foods array',
          errorCode: 'PARSE_ERROR',
        };
      }

      // Convert to AIFoodEstimate format
      const items: AIFoodEstimate[] = parsed.foods.map((food: any) => ({
        foodName: food.name || 'Unknown Food',
        estimatedMacros: {
          calories: Math.round(food.calories || 0),
          protein: Math.round(food.protein || 0),
          fats: Math.round(food.fats || 0),
          carbs: Math.round(food.carbs || 0),
        },
        servingSize: food.servingSize || 100,
        servingUnit: food.servingUnit || 'g',
        confidence: Math.min(100, Math.max(0, food.confidence || 50)),
        reasoning: food.reasoning,
      }));

      // If multiple items, return all and set first as primary
      if (items.length > 1) {
        // Create a combined item for the full meal
        const combinedItem: AIFoodEstimate = {
          foodName: items.map((i) => i.foodName).join(' + '),
          estimatedMacros: {
            calories: parsed.totalMeal?.calories || items.reduce((sum, i) => sum + i.estimatedMacros.calories, 0),
            protein: parsed.totalMeal?.protein || items.reduce((sum, i) => sum + i.estimatedMacros.protein, 0),
            fats: parsed.totalMeal?.fats || items.reduce((sum, i) => sum + i.estimatedMacros.fats, 0),
            carbs: parsed.totalMeal?.carbs || items.reduce((sum, i) => sum + i.estimatedMacros.carbs, 0),
          },
          servingSize: 1,
          servingUnit: 'meal',
          confidence: parsed.overallConfidence || Math.round(items.reduce((sum, i) => sum + i.confidence, 0) / items.length),
          alternatives: items,
          reasoning: parsed.notes,
        };

        return {
          success: true,
          data: combinedItem,
          multipleItems: items,
        };
      }

      return {
        success: true,
        data: items[0],
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        success: false,
        error: 'Failed to parse AI response',
        errorCode: 'PARSE_ERROR',
      };
    }
  }

  /**
   * Estimate food macros from a single image
   */
  async estimateFoodMacros(
    imageUri: string,
    context?: EstimationContext
  ): Promise<GeminiAPIResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Gemini API not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY.',
        errorCode: 'API_ERROR',
      };
    }

    await this.waitForRateLimit();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Convert image to base64
        const { base64, mimeType } = await this.imageToBase64(imageUri);

        // Prepare image part
        const imagePart: Part = {
          inlineData: {
            data: base64,
            mimeType,
          },
        };

        // Select prompt based on context
        const prompt = context
          ? FOOD_ANALYSIS_WITH_CONTEXT_PROMPT(context)
          : FOOD_ANALYSIS_PROMPT;

        // Call Gemini API
        const result = await this.model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Parse and return
        const parsed = this.parseResponse(text);

        return {
          ...parsed,
          rawResponse: text,
        };
      } catch (error: any) {
        lastError = error;

        // Check for rate limiting
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
            continue;
          }
          return {
            success: false,
            error: 'Rate limited. Please try again later.',
            errorCode: 'RATE_LIMITED',
          };
        }

        // Check for invalid image
        if (error.message?.includes('image') || error.message?.includes('INVALID')) {
          return {
            success: false,
            error: 'Invalid or unsupported image format.',
            errorCode: 'INVALID_IMAGE',
          };
        }

        // Network/other errors - retry
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to analyze image',
      errorCode: 'API_ERROR',
    };
  }

  /**
   * Estimate food macros from multiple images
   */
  async estimateFoodMacrosMultipleImages(
    imageUris: string[],
    context?: EstimationContext
  ): Promise<GeminiAPIResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Gemini API not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY.',
        errorCode: 'API_ERROR',
      };
    }

    if (imageUris.length === 0) {
      return {
        success: false,
        error: 'No images provided',
        errorCode: 'INVALID_IMAGE',
      };
    }

    // For single image, use the simpler method
    if (imageUris.length === 1) {
      return this.estimateFoodMacros(imageUris[0], context);
    }

    await this.waitForRateLimit();

    try {
      // Convert all images to base64
      const imageParts: Part[] = [];
      for (const uri of imageUris.slice(0, 3)) { // Max 3 images
        const { base64, mimeType } = await this.imageToBase64(uri);
        imageParts.push({
          inlineData: {
            data: base64,
            mimeType,
          },
        });
      }

      // Enhanced prompt for multiple images
      const multiImagePrompt = `${context ? FOOD_ANALYSIS_WITH_CONTEXT_PROMPT(context) : FOOD_ANALYSIS_PROMPT}

NOTE: Multiple images of the same meal are provided. Use all images to get a more accurate estimate.
Different angles may reveal additional ingredients or help estimate portions better.`;

      // Call Gemini API with all images
      const result = await this.model.generateContent([multiImagePrompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      const parsed = this.parseResponse(text);

      return {
        ...parsed,
        rawResponse: text,
      };
    } catch (error: any) {
      console.error('Multi-image analysis error:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze images',
        errorCode: 'API_ERROR',
      };
    }
  }

  /**
   * Get suggestions for improving estimation accuracy
   */
  async getImprovementSuggestions(
    imageUri: string,
    currentEstimate: AIFoodEstimate
  ): Promise<string[]> {
    if (!this.isInitialized) {
      return ['Configure API key to enable suggestions'];
    }

    try {
      const { base64, mimeType } = await this.imageToBase64(imageUri);

      const prompt = `Given this food image and the current estimation:
- Food: ${currentEstimate.foodName}
- Calories: ${currentEstimate.estimatedMacros.calories}
- Confidence: ${currentEstimate.confidence}%

What would help improve the accuracy of this estimate?
Respond with a JSON array of 2-3 brief suggestions (max 50 chars each):
["suggestion 1", "suggestion 2", "suggestion 3"]`;

      const imagePart: Part = {
        inlineData: { data: base64, mimeType },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Parse suggestions
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleaned);

      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Quick food identification (name only, faster)
   */
  async quickIdentify(imageUri: string): Promise<{ name: string; confidence: number } | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const { base64, mimeType } = await this.imageToBase64(imageUri);

      const prompt = `Identify the main food in this image.
Respond with ONLY a JSON object: {"name": "food name", "confidence": 0-100}`;

      const imagePart: Part = {
        inlineData: { data: base64, mimeType },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Quick identify error:', error);
      return null;
    }
  }
  
  /**
   * Estimate nutrition from text description only (no image)
   */
  async estimateFromText(
    foodName: string,
    servingSize: number,
    servingUnit: string
  ): Promise<{ calories: number; protein: number; carbs: number; fats: number } | null> {
    if (!this.isInitialized) {
      throw new Error('Gemini API not configured');
    }

    await this.waitForRateLimit();

    try {
      const prompt = `Estimate the nutritional values for ${servingSize}${servingUnit} of ${foodName}.
      
Return ONLY a valid JSON object with this exact format (no markdown, no additional text):
{
  "calories": <number>,
  "protein": <number>,
  "carbs": <number>,
  "fats": <number>
}

Be precise and realistic. Round to whole numbers.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          calories: Math.round(data.calories),
          protein: Math.round(data.protein),
          carbs: Math.round(data.carbs),
          fats: Math.round(data.fats),
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Text estimation error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiAPIService();

// Also export the old function for backwards compatibility
export const analyzeFoodImage = async (base64Image: string) => {
  // This is a wrapper for the old API
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  try {
    const prompt = 'Analyze this image and estimate the calories and macronutrients.';
    const image = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing food:', error);
    return null;
  }
};
