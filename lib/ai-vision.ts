// AI Vision Integration for Food Identification
// Supports multiple providers: Gemini (free), OpenAI (paid)

export interface FoodIdentification {
  name: string;
  confidence: number;
  category: string;
  ingredients?: string[];
  portionEstimate?: string;
  description?: string;
}

export interface AnalysisResult {
  foods: FoodIdentification[];
  overallDescription: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

export type AIProvider = "gemini" | "openai" | "demo";

export interface AISettings {
  provider: AIProvider;
  geminiApiKey?: string;
  openaiApiKey?: string;
}

// Healthier alternatives database
export const HEALTHIER_ALTERNATIVES: Record<string, string[]> = {
  "Pizza": ["Cauliflower crust pizza", "Whole wheat pizza", "Grilled vegetable flatbread"],
  "Hamburger": ["Turkey burger", "Veggie burger", "Grilled chicken sandwich"],
  "White Rice": ["Brown rice", "Quinoa", "Cauliflower rice"],
  "Spaghetti with Marinara": ["Whole wheat pasta", "Zucchini noodles", "Spaghetti squash"],
  "Coffee with Milk": ["Black coffee", "Green tea", "Oat milk latte"],
  "Turkey Sandwich": ["Lettuce wrap sandwich", "Whole grain bread sandwich"],
  "Scrambled Eggs": ["Egg white scramble", "Tofu scramble"],
  "French Fries": ["Baked sweet potato fries", "Air-fried zucchini sticks"],
  "Ice Cream": ["Frozen yogurt", "Banana nice cream", "Greek yogurt with berries"],
  "Soda": ["Sparkling water", "Unsweetened iced tea", "Infused water"],
};

// Mock food database for demo mode
const MOCK_FOODS: FoodIdentification[] = [
  {
    name: "Apple",
    confidence: 0.95,
    category: "Fruit",
    ingredients: ["Apple"],
    portionEstimate: "1 medium (182g)",
    description: "Fresh red apple, a healthy snack rich in fiber and vitamins.",
  },
  {
    name: "Pizza",
    confidence: 0.92,
    category: "Fast Food",
    ingredients: ["Dough", "Tomato sauce", "Mozzarella cheese", "Pepperoni"],
    portionEstimate: "1 slice (107g)",
    description: "Pepperoni pizza slice with cheese and tomato sauce.",
  },
  {
    name: "Garden Salad",
    confidence: 0.89,
    category: "Vegetable",
    ingredients: ["Lettuce", "Tomatoes", "Cucumber", "Carrots", "Dressing"],
    portionEstimate: "1 bowl (200g)",
    description: "Fresh mixed garden salad with various vegetables.",
  },
  {
    name: "Grilled Chicken Breast",
    confidence: 0.91,
    category: "Protein",
    ingredients: ["Chicken breast", "Seasoning"],
    portionEstimate: "1 breast (174g)",
    description: "Lean grilled chicken breast, high in protein.",
  },
];

function getMealType(): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 17 && hour < 21) return "dinner";
  return "snack";
}

// Demo mode - random mock data
async function analyzeWithDemo(imageBase64: string): Promise<AnalysisResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const food = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
  return {
    foods: [food],
    overallDescription: `Detected ${food.name.toLowerCase()} in the image. ${food.description}`,
    mealType: getMealType(),
  };
}

// Google Gemini Vision API
async function analyzeWithGemini(imageBase64: string, apiKey: string): Promise<AnalysisResult> {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this food image and identify all food items. For each food item provide:
1. name: The name of the food
2. confidence: Your confidence level from 0 to 1
3. category: One of (Fruit, Vegetable, Protein, Grain, Dairy, Fast Food, Beverage, Dessert, Mixed)
4. ingredients: List of main ingredients
5. portionEstimate: Estimated portion size with weight
6. description: Brief description of the food

Also provide:
- overallDescription: A summary of what you see
- mealType: One of (breakfast, lunch, dinner, snack) based on the foods

Respond ONLY with valid JSON in this exact format:
{
  "foods": [{"name": "string", "confidence": 0.0, "category": "string", "ingredients": ["string"], "portionEstimate": "string", "description": "string"}],
  "overallDescription": "string",
  "mealType": "string"
}`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("No response from Gemini");
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  try {
    return JSON.parse(jsonStr.trim());
  } catch {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Failed to parse AI response");
  }
}

// OpenAI GPT-4 Vision API
async function analyzeWithOpenAI(imageBase64: string, apiKey: string): Promise<AnalysisResult> {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and identify all food items. For each food item provide:
1. name: The name of the food
2. confidence: Your confidence level from 0 to 1
3. category: One of (Fruit, Vegetable, Protein, Grain, Dairy, Fast Food, Beverage, Dessert, Mixed)
4. ingredients: List of main ingredients
5. portionEstimate: Estimated portion size with weight
6. description: Brief description of the food

Also provide:
- overallDescription: A summary of what you see
- mealType: One of (breakfast, lunch, dinner, snack) based on the foods

Respond ONLY with valid JSON in this exact format:
{
  "foods": [{"name": "string", "confidence": 0.0, "category": "string", "ingredients": ["string"], "portionEstimate": "string", "description": "string"}],
  "overallDescription": "string",
  "mealType": "string"
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Extract JSON from response
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonStr.trim());
  } catch {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("Failed to parse AI response");
  }
}

// Main analysis function - routes to appropriate provider
export async function analyzeFood(
  imageBase64: string,
  settings: AISettings
): Promise<AnalysisResult> {
  const { provider, geminiApiKey, openaiApiKey } = settings;

  try {
    switch (provider) {
      case "gemini":
        if (!geminiApiKey) {
          console.warn("No Gemini API key, falling back to demo");
          return analyzeWithDemo(imageBase64);
        }
        return await analyzeWithGemini(imageBase64, geminiApiKey);

      case "openai":
        if (!openaiApiKey) {
          console.warn("No OpenAI API key, falling back to demo");
          return analyzeWithDemo(imageBase64);
        }
        return await analyzeWithOpenAI(imageBase64, openaiApiKey);

      case "demo":
      default:
        return analyzeWithDemo(imageBase64);
    }
  } catch (error) {
    console.error(`${provider} analysis failed:`, error);
    // Fall back to demo mode on error
    return analyzeWithDemo(imageBase64);
  }
}

// Get healthier alternatives for a food
export function getHealthierAlternatives(foodName: string): string[] {
  // Check exact match first
  if (HEALTHIER_ALTERNATIVES[foodName]) {
    return HEALTHIER_ALTERNATIVES[foodName];
  }
  // Check partial match
  for (const [key, alternatives] of Object.entries(HEALTHIER_ALTERNATIVES)) {
    if (foodName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(foodName.toLowerCase())) {
      return alternatives;
    }
  }
  return [];
}
