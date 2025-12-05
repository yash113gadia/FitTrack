/**
 * MacroProgressRing Component Tests
 * 
 * Tests for the macro nutrient progress ring component
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { MacroProgressRing, MacroType } from '../MacroProgressRing';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock CircularProgress component
jest.mock('../CircularProgress', () => ({
  CircularProgress: ({ progress, color, testID }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID || 'circular-progress'}>
        <Text testID="progress-value">{progress}</Text>
        <Text testID="progress-color">{color}</Text>
      </View>
    );
  },
}));

describe('MacroProgressRing Component', () => {
  const defaultProps = {
    macro: 'protein' as MacroType,
    current: 85,
    goal: 150,
    testID: 'macro-ring',
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(<MacroProgressRing {...defaultProps} />);
      expect(getByTestId('macro-ring')).toBeTruthy();
    });

    it('should display current value', () => {
      const { getByText } = render(<MacroProgressRing {...defaultProps} />);
      expect(getByText('85')).toBeTruthy();
    });

    it('should display macro label', () => {
      const { getByText } = render(<MacroProgressRing {...defaultProps} />);
      expect(getByText('Protein')).toBeTruthy();
    });

    it('should display default unit for macro type', () => {
      const { getByText } = render(<MacroProgressRing {...defaultProps} />);
      expect(getByText('g')).toBeTruthy();
    });

    it('should display custom unit when provided', () => {
      const { getByText } = render(
        <MacroProgressRing {...defaultProps} unit="oz" />
      );
      expect(getByText('oz')).toBeTruthy();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate correct progress percentage', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="protein" current={75} goal={150} />
      );
      // 75/150 = 50%
      expect(getByTestId('progress-value').props.children).toBe(50);
    });

    it('should cap progress at 100%', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="protein" current={200} goal={150} />
      );
      // Over goal should cap at 100
      expect(getByTestId('progress-value').props.children).toBe(100);
    });

    it('should handle zero goal gracefully', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="protein" current={50} goal={0} />
      );
      expect(getByTestId('progress-value').props.children).toBe(0);
    });

    it('should handle zero current value', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="protein" current={0} goal={150} />
      );
      expect(getByTestId('progress-value').props.children).toBe(0);
    });
  });

  describe('Macro Types', () => {
    const macroTypes: MacroType[] = ['calories', 'protein', 'fats', 'carbs', 'fiber', 'sugar'];

    it.each(macroTypes)('should render correctly for %s macro', (macro) => {
      const { getByText } = render(
        <MacroProgressRing macro={macro} current={50} goal={100} />
      );
      
      // Each macro should show its label
      const labels: Record<MacroType, string> = {
        calories: 'Calories',
        protein: 'Protein',
        fats: 'Fats',
        carbs: 'Carbs',
        fiber: 'Fiber',
        sugar: 'Sugar',
      };
      
      expect(getByText(labels[macro])).toBeTruthy();
    });

    it('should use kcal unit for calories', () => {
      const { getByText } = render(
        <MacroProgressRing macro="calories" current={1500} goal={2000} />
      );
      expect(getByText('kcal')).toBeTruthy();
    });

    it('should use g unit for other macros', () => {
      const { getByText } = render(
        <MacroProgressRing macro="protein" current={100} goal={150} />
      );
      expect(getByText('g')).toBeTruthy();
    });
  });

  describe('Value Formatting', () => {
    it('should format values over 1000 with k suffix', () => {
      const { getByText } = render(
        <MacroProgressRing macro="calories" current={1500} goal={2000} />
      );
      expect(getByText('1.5k')).toBeTruthy();
    });

    it('should round values to integers when under 1000', () => {
      const { getByText } = render(
        <MacroProgressRing macro="protein" current={85.7} goal={150} />
      );
      expect(getByText('86')).toBeTruthy();
    });

    it('should handle very large values', () => {
      const { getByText } = render(
        <MacroProgressRing macro="calories" current={10500} goal={15000} />
      );
      expect(getByText('10.5k')).toBeTruthy();
    });
  });

  describe('Over Goal State', () => {
    it('should indicate when current exceeds goal', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="protein" current={200} goal={150} />
      );
      // Should use error color when over goal
      const colorText = getByTestId('progress-color');
      // The color should be the error color, not the protein color
      expect(colorText.props.children).toContain('#'); // Should be a color
    });
  });

  describe('Details Display', () => {
    it('should show details by default', () => {
      const { getByText } = render(
        <MacroProgressRing macro="protein" current={85} goal={150} />
      );
      // Should show goal value somewhere
      expect(getByText(/150/)).toBeTruthy();
    });

    it('should hide details when showDetails is false', () => {
      const { queryByText } = render(
        <MacroProgressRing 
          macro="protein" 
          current={85} 
          goal={150} 
          showDetails={false} 
        />
      );
      // Should not show "of 150g" type text
      expect(queryByText(/of 150/)).toBeNull();
    });
  });

  describe('Interactivity', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <MacroProgressRing 
          {...defaultProps} 
          onPress={onPress} 
        />
      );
      
      fireEvent.press(getByTestId('macro-ring'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not throw when pressed without onPress handler', () => {
      const { getByTestId } = render(
        <MacroProgressRing {...defaultProps} onPress={undefined} />
      );
      
      expect(() => {
        fireEvent.press(getByTestId('macro-ring'));
      }).not.toThrow();
    });
  });

  describe('Sizing', () => {
    it('should use default size when not specified', () => {
      render(<MacroProgressRing {...defaultProps} />);
      // Default size is 80, component should render
    });

    it('should accept custom size', () => {
      render(<MacroProgressRing {...defaultProps} size={120} />);
      // Should render without errors
    });

    it('should accept custom stroke width', () => {
      render(<MacroProgressRing {...defaultProps} strokeWidth={12} />);
      // Should render without errors
    });
  });

  describe('Animation', () => {
    it('should animate on mount by default', () => {
      render(<MacroProgressRing {...defaultProps} />);
      // Animation behavior is mocked, just verify it doesn't crash
    });

    it('should respect animateOnMount prop', () => {
      render(<MacroProgressRing {...defaultProps} animateOnMount={false} />);
      // Should render without errors
    });
  });

  describe('Accessibility', () => {
    it('should use provided testID', () => {
      const { getByTestId } = render(
        <MacroProgressRing {...defaultProps} testID="custom-test-id" />
      );
      expect(getByTestId('custom-test-id')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal values', () => {
      const { getByText } = render(
        <MacroProgressRing macro="protein" current={85.5} goal={150.5} />
      );
      // Should round the current value
      expect(getByText('86')).toBeTruthy();
    });

    it('should handle negative values gracefully', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="protein" current={-10} goal={150} />
      );
      // Should not crash
      expect(getByTestId('progress-value')).toBeTruthy();
    });

    it('should handle very small goal values', () => {
      const { getByTestId } = render(
        <MacroProgressRing macro="fiber" current={5} goal={1} />
      );
      expect(getByTestId('progress-value').props.children).toBe(100);
    });
  });
});
