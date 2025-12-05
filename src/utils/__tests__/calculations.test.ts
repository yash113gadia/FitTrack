/**
 * Calculations Utility Tests
 * 
 * Tests for BMR, TDEE, and macro calculations
 */

import { calculateBMR, calculateTDEE, calculateMacros } from '../calculations';

describe('Calculation Utilities', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR correctly for males', () => {
      // Male, 70kg, 175cm, 30 years
      // Mifflin-St Jeor: (10 * 70) + (6.25 * 175) - (5 * 30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
      const bmr = calculateBMR(70, 175, 30, 'male');
      expect(bmr).toBeCloseTo(1648.75, 1);
    });

    it('should calculate BMR correctly for females', () => {
      // Female, 60kg, 165cm, 25 years
      // Mifflin-St Jeor: (10 * 60) + (6.25 * 165) - (5 * 25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      const bmr = calculateBMR(60, 165, 25, 'female');
      expect(bmr).toBeCloseTo(1345.25, 1);
    });

    it('should handle edge cases with low values', () => {
      const bmr = calculateBMR(40, 150, 18, 'male');
      expect(bmr).toBeGreaterThan(0);
    });

    it('should handle edge cases with high values', () => {
      const bmr = calculateBMR(120, 200, 50, 'male');
      expect(bmr).toBeGreaterThan(0);
      expect(bmr).toBeLessThan(5000);
    });

    it('should produce different results for different genders with same stats', () => {
      const maleBmr = calculateBMR(70, 175, 30, 'male');
      const femaleBmr = calculateBMR(70, 175, 30, 'female');
      
      // Male BMR should be higher due to +5 vs -161
      expect(maleBmr).toBeGreaterThan(femaleBmr);
      expect(maleBmr - femaleBmr).toBeCloseTo(166, 0);
    });

    it('should decrease with age', () => {
      const young = calculateBMR(70, 175, 20, 'male');
      const middle = calculateBMR(70, 175, 40, 'male');
      const older = calculateBMR(70, 175, 60, 'male');

      expect(young).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(older);
    });

    it('should increase with weight', () => {
      const light = calculateBMR(50, 175, 30, 'male');
      const medium = calculateBMR(70, 175, 30, 'male');
      const heavy = calculateBMR(90, 175, 30, 'male');

      expect(light).toBeLessThan(medium);
      expect(medium).toBeLessThan(heavy);
    });

    it('should increase with height', () => {
      const short = calculateBMR(70, 160, 30, 'male');
      const medium = calculateBMR(70, 175, 30, 'male');
      const tall = calculateBMR(70, 190, 30, 'male');

      expect(short).toBeLessThan(medium);
      expect(medium).toBeLessThan(tall);
    });
  });

  describe('calculateTDEE', () => {
    const baseBMR = 1600; // Use a fixed BMR for consistent testing

    it('should apply sedentary multiplier correctly', () => {
      const tdee = calculateTDEE(baseBMR, 'sedentary');
      expect(tdee).toBe(baseBMR * 1.2);
    });

    it('should apply light activity multiplier correctly', () => {
      const tdee = calculateTDEE(baseBMR, 'light');
      expect(tdee).toBe(baseBMR * 1.375);
    });

    it('should apply moderate activity multiplier correctly', () => {
      const tdee = calculateTDEE(baseBMR, 'moderate');
      expect(tdee).toBe(baseBMR * 1.55);
    });

    it('should apply active multiplier correctly', () => {
      const tdee = calculateTDEE(baseBMR, 'active');
      expect(tdee).toBe(baseBMR * 1.725);
    });

    it('should apply very active multiplier correctly', () => {
      const tdee = calculateTDEE(baseBMR, 'very_active');
      expect(tdee).toBe(baseBMR * 1.9);
    });

    it('should default to sedentary for unknown activity levels', () => {
      const tdee = calculateTDEE(baseBMR, 'unknown');
      expect(tdee).toBe(baseBMR * 1.2);
    });

    it('should increase TDEE with higher activity levels', () => {
      const sedentary = calculateTDEE(baseBMR, 'sedentary');
      const moderate = calculateTDEE(baseBMR, 'moderate');
      const veryActive = calculateTDEE(baseBMR, 'very_active');

      expect(sedentary).toBeLessThan(moderate);
      expect(moderate).toBeLessThan(veryActive);
    });
  });

  describe('calculateMacros', () => {
    const baseTDEE = 2000;
    const weight = 70; // kg

    describe('maintenance goal', () => {
      it('should maintain target calories for maintain goal', () => {
        const macros = calculateMacros(baseTDEE, weight, 'maintain');
        expect(macros.calories).toBe(baseTDEE);
      });

      it('should calculate protein at 2g per kg', () => {
        const macros = calculateMacros(baseTDEE, weight, 'maintain');
        expect(macros.protein).toBe(140); // 70kg * 2g/kg
      });

      it('should calculate fats at 0.9g per kg', () => {
        const macros = calculateMacros(baseTDEE, weight, 'maintain');
        expect(macros.fats).toBe(63); // 70kg * 0.9g/kg = 63
      });

      it('should calculate remaining calories as carbs', () => {
        const macros = calculateMacros(baseTDEE, weight, 'maintain');
        
        // Protein: 140g * 4 cal = 560 cal
        // Fat: 63g * 9 cal = 567 cal
        // Remaining: 2000 - 560 - 567 = 873 cal
        // Carbs: 873 / 4 = 218.25 ≈ 218g
        expect(macros.carbs).toBeGreaterThan(0);
        
        // Verify total calories roughly match
        const totalCals = (macros.protein * 4) + (macros.fats * 9) + (macros.carbs * 4);
        expect(totalCals).toBeCloseTo(baseTDEE, -1);
      });
    });

    describe('lose goal', () => {
      it('should create 500 calorie deficit for lose goal', () => {
        const macros = calculateMacros(baseTDEE, weight, 'lose');
        expect(macros.calories).toBe(baseTDEE - 500);
      });

      it('should maintain protein requirements in deficit', () => {
        const macros = calculateMacros(baseTDEE, weight, 'lose');
        expect(macros.protein).toBe(140); // Still 2g/kg
      });

      it('should reduce carbs in deficit', () => {
        const maintainMacros = calculateMacros(baseTDEE, weight, 'maintain');
        const loseMacros = calculateMacros(baseTDEE, weight, 'lose');
        
        expect(loseMacros.carbs).toBeLessThan(maintainMacros.carbs);
      });
    });

    describe('gain goal', () => {
      it('should create 500 calorie surplus for gain goal', () => {
        const macros = calculateMacros(baseTDEE, weight, 'gain');
        expect(macros.calories).toBe(baseTDEE + 500);
      });

      it('should increase carbs in surplus', () => {
        const maintainMacros = calculateMacros(baseTDEE, weight, 'maintain');
        const gainMacros = calculateMacros(baseTDEE, weight, 'gain');
        
        expect(gainMacros.carbs).toBeGreaterThan(maintainMacros.carbs);
      });
    });

    describe('minimum calorie safeguard', () => {
      it('should not go below 1200 calories', () => {
        const veryLowTDEE = 1500;
        const macros = calculateMacros(veryLowTDEE, weight, 'lose');
        
        // 1500 - 500 = 1000, but should be clamped to 1200
        expect(macros.calories).toBe(1200);
      });

      it('should handle extremely low TDEE with minimum calories', () => {
        const extremelyLowTDEE = 1000;
        const macros = calculateMacros(extremelyLowTDEE, weight, 'lose');
        
        expect(macros.calories).toBe(1200);
      });
    });

    describe('carbs calculation edge cases', () => {
      it('should not have negative carbs', () => {
        // Very low calorie scenario where protein + fat > total calories
        const lowCalories = 1200;
        const heavyWeight = 100; // High protein and fat needs
        
        const macros = calculateMacros(lowCalories, heavyWeight, 'maintain');
        expect(macros.carbs).toBeGreaterThanOrEqual(0);
      });
    });

    describe('macro balance', () => {
      it('should produce balanced macros for typical user', () => {
        const macros = calculateMacros(2500, 75, 'maintain');
        
        // Protein should be reasonable (not too high or low)
        expect(macros.protein).toBeGreaterThan(100);
        expect(macros.protein).toBeLessThan(300);
        
        // Fats should be moderate
        expect(macros.fats).toBeGreaterThan(50);
        expect(macros.fats).toBeLessThan(150);
        
        // Carbs should make up the bulk of remaining calories
        expect(macros.carbs).toBeGreaterThan(100);
      });

      it('should return rounded integer values', () => {
        const macros = calculateMacros(2347, 73.5, 'maintain');
        
        expect(Number.isInteger(macros.calories)).toBe(true);
        expect(Number.isInteger(macros.protein)).toBe(true);
        expect(Number.isInteger(macros.fats)).toBe(true);
        expect(Number.isInteger(macros.carbs)).toBe(true);
      });
    });
  });

  describe('Integration: Full calculation chain', () => {
    it('should calculate appropriate macros for sedentary male', () => {
      const bmr = calculateBMR(80, 180, 35, 'male');
      const tdee = calculateTDEE(bmr, 'sedentary');
      const macros = calculateMacros(tdee, 80, 'maintain');

      expect(macros.calories).toBeGreaterThan(1800);
      expect(macros.calories).toBeLessThan(2500);
      expect(macros.protein).toBe(160);
    });

    it('should calculate appropriate macros for active female trying to lose', () => {
      const bmr = calculateBMR(60, 165, 28, 'female');
      const tdee = calculateTDEE(bmr, 'active');
      const macros = calculateMacros(tdee, 60, 'lose');

      expect(macros.calories).toBeGreaterThan(1500);
      expect(macros.calories).toBeLessThan(2500);
      expect(macros.protein).toBe(120);
    });

    it('should calculate appropriate macros for moderate activity male gaining', () => {
      const bmr = calculateBMR(70, 175, 25, 'male');
      const tdee = calculateTDEE(bmr, 'moderate');
      const macros = calculateMacros(tdee, 70, 'gain');

      expect(macros.calories).toBeGreaterThan(2500);
      expect(macros.calories).toBeLessThan(3500);
      expect(macros.protein).toBe(140);
    });
  });
});
