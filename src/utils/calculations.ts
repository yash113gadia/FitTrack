export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female') => {
  // Mifflin-St Jeor Equation
  const base = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === 'male' ? base + 5 : base - 161;
};

export const calculateTDEE = (bmr: number, activityLevel: string) => {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return bmr * (multipliers[activityLevel] || 1.2);
};

export const calculateMacros = (
  tdee: number, 
  weight: number, 
  goal: 'lose' | 'maintain' | 'gain'
) => {
  let targetCalories = tdee;
  if (goal === 'lose') targetCalories -= 500;
  if (goal === 'gain') targetCalories += 500;

  // Ensure min calories
  targetCalories = Math.max(targetCalories, 1200);

  // Protein: 2g per kg (approx 0.9g per lb) - good for muscle retention/growth
  const protein = Math.round(weight * 2.0);
  
  // Fats: 0.9g per kg
  const fats = Math.round(weight * 0.9);

  // Carbs: Remaining calories
  // Protein = 4 cal/g, Fat = 9 cal/g, Carbs = 4 cal/g
  const proteinCals = protein * 4;
  const fatCals = fats * 9;
  const remainingCals = targetCalories - proteinCals - fatCals;
  const carbs = Math.max(0, Math.round(remainingCals / 4));

  return {
    calories: Math.round(targetCalories),
    protein,
    fats,
    carbs
  };
};
