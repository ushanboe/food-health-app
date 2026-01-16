export interface ParsedIngredient {
  name: string;
  quantity: string;
  unit: string;
  original: string;
}

export interface ParsedRecipe {
  title: string;
  servings: number;
  ingredients: ParsedIngredient[];
  source: string;
  instructions?: string;
}

// Fetch and parse recipe from URL using AI
export async function parseRecipeFromUrl(
  url: string,
  aiProvider: 'demo' | 'gemini' | 'openai',
  apiKey?: string
): Promise<ParsedRecipe> {
  // Demo mode - return mock parsed recipe
  if (aiProvider === 'demo') {
    return {
      title: 'Imported Recipe',
      servings: 4,
      ingredients: [
        { name: 'flour', quantity: '2', unit: 'cups', original: '2 cups all-purpose flour' },
        { name: 'sugar', quantity: '1', unit: 'cup', original: '1 cup granulated sugar' },
        { name: 'eggs', quantity: '2', unit: 'large', original: '2 large eggs' },
        { name: 'butter', quantity: '0.5', unit: 'cup', original: '1/2 cup butter, softened' },
        { name: 'milk', quantity: '1', unit: 'cup', original: '1 cup whole milk' },
        { name: 'vanilla extract', quantity: '1', unit: 'tsp', original: '1 tsp vanilla extract' },
      ],
      source: url
    };
  }

  // Fetch webpage content
  let textContent = '';
  try {
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      // Strip HTML tags and clean up
      textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000); // Limit for AI context
    }
  } catch (error) {
    console.error('Failed to fetch URL:', error);
    throw new Error('Could not fetch recipe page. Check the URL and try again.');
  }

  if (!textContent) {
    throw new Error('Could not extract content from the page.');
  }

  const prompt = `Extract recipe information from this webpage content. Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{"title": "Recipe Name", "servings": 4, "ingredients": [{"name": "ingredient", "quantity": "1", "unit": "cup", "original": "1 cup ingredient"}]}

Content:
${textContent}`;

  let result: ParsedRecipe;

  if (aiProvider === 'gemini' && apiKey) {
    // Use Gemini API via fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = { ...parsed, source: url };
    } else {
      throw new Error('Failed to parse AI response');
    }
  } else if (aiProvider === 'openai' && apiKey) {
    // Use OpenAI API via fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = { ...parsed, source: url };
    } else {
      throw new Error('Failed to parse AI response');
    }
  } else {
    throw new Error('Invalid AI provider or missing API key');
  }

  return result;
}

// Search Open Food Facts for ingredient nutrition
export async function searchIngredient(query: string): Promise<any[]> {
  try {
    // Use a longer timeout and handle abort gracefully
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // Increased to 15 seconds

    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15`,
      { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'FitFork/1.0 (https://fitfork.app)'
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Open Food Facts API returned non-OK status:', response.status);
      return [];
    }

    const data = await response.json();

    // Filter and map results
    return (data.products || [])
      .filter((p: any) => p.product_name) // Must have a name
      .slice(0, 10)
      .map((product: any) => ({
        id: product.code || product._id || Math.random().toString(),
        name: product.product_name,
        brand: product.brands || '',
        image: product.image_small_url || product.image_url || '',
        nutrition: {
          calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy-kcal'] || 0),
          protein: Math.round((product.nutriments?.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((product.nutriments?.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((product.nutriments?.fat_100g || 0) * 10) / 10,
          fiber: Math.round((product.nutriments?.fiber_100g || 0) * 10) / 10,
          sugar: Math.round((product.nutriments?.sugars_100g || 0) * 10) / 10,
          sodium: Math.round((product.nutriments?.sodium_100g || 0) * 1000) / 1000,
        },
        servingSize: product.serving_size || '100g',
      }));
  } catch (error: any) {
    // Handle abort errors gracefully - don't log as error
    if (error?.name === 'AbortError') {
      console.warn('Ingredient search timed out for:', query);
      return [];
    }
    console.error('Error searching ingredients:', error);
    return [];
  }
}
