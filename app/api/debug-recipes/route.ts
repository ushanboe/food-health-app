import { NextResponse } from 'next/server';

export async function GET() {
  const script = `
// Run this in your browser console on the FitFork app
(function() {
  const stored = localStorage.getItem('food-health-storage');
  if (!stored) {
    console.log('No recipes found in localStorage');
    return;
  }
  
  const data = JSON.parse(stored);
  const recipes = data.state?.recipes || [];
  
  console.log('=== RECIPE NUTRITION STATUS ===');
  console.log('Total recipes:', recipes.length);
  
  const withoutNutrition = recipes.filter(r => {
    const total = r.ingredients?.reduce((sum, ing) => sum + (ing.calories || 0), 0) || 0;
    return total === 0;
  });
  
  console.log('Recipes WITHOUT nutrition:', withoutNutrition.length);
  
  if (withoutNutrition.length > 0) {
    console.log('Recipes missing nutrition:');
    withoutNutrition.forEach(r => console.log('  -', r.name));
  }
  
  const withNutrition = recipes.filter(r => {
    const total = r.ingredients?.reduce((sum, ing) => sum + (ing.calories || 0), 0) || 0;
    return total > 0;
  });
  
  console.log('Recipes WITH nutrition:', withNutrition.length);
  withNutrition.forEach(r => {
    const cals = r.ingredients?.reduce((sum, ing) => sum + (ing.calories || 0), 0) || 0;
    const protein = r.ingredients?.reduce((sum, ing) => sum + (ing.protein || 0), 0) || 0;
    console.log('  -', r.name, '| Cals:', Math.round(cals), '| Protein:', Math.round(protein) + 'g');
  });
})();
`;
  return new NextResponse(script, { headers: { 'Content-Type': 'text/plain' } });
}
