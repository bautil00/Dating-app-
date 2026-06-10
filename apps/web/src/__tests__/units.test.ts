import { describe, expect, it } from 'vitest';
import {
  convertDistanceInput,
  convertHeightInput,
  convertWeightInput,
  distanceInputToKm,
  heightInputToInches,
  weightInputToPounds,
} from '../lib/units';

describe('unit conversions', () => {
  it('converts display measurements to canonical profile values', () => {
    expect(heightInputToInches('180', 'cm')).toBeCloseTo(70.87, 2);
    expect(heightInputToInches('68', 'in')).toBe(68);
    expect(weightInputToPounds('70', 'kg')).toBe(154);
    expect(weightInputToPounds('150', 'lb')).toBe(150);
    expect(distanceInputToKm('10', 'mi')).toBe(16);
    expect(distanceInputToKm('25', 'km')).toBe(25);
  });

  it('converts visible input values when a unit selector changes', () => {
    expect(convertHeightInput('68', 'in', 'cm')).toBe('172.7');
    expect(convertWeightInput('154', 'lb', 'kg')).toBe('69.9');
    expect(convertDistanceInput('16', 'km', 'mi')).toBe('9.9');
  });
});
