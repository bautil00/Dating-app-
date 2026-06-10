export type HeightUnit = 'in' | 'cm';
export type WeightUnit = 'lb' | 'kg';
export type DistanceUnit = 'km' | 'mi';

const CM_PER_INCH = 2.54;
const LB_PER_KG = 2.2046226218;
const KM_PER_MILE = 1.609344;

function numberFromInput(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberFromUnknown(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function displayNumber(value: number) {
  return value
    .toFixed(1)
    .replace(/\.0$/, '')
    .replace(/(\.\d*[1-9])0+$/, '$1');
}

function canonicalNumber(value: number) {
  return Number(value.toFixed(2));
}

export function heightFromInches(value: unknown, unit: HeightUnit) {
  const inches = numberFromUnknown(value);
  if (inches === null) return '';
  return displayNumber(unit === 'cm' ? inches * CM_PER_INCH : inches);
}

export function weightFromPounds(value: unknown, unit: WeightUnit) {
  const pounds = numberFromUnknown(value);
  if (pounds === null) return '';
  return displayNumber(unit === 'kg' ? pounds / LB_PER_KG : pounds);
}

export function distanceFromKm(value: unknown, unit: DistanceUnit) {
  const kilometers = numberFromUnknown(value);
  if (kilometers === null) return '';
  return displayNumber(unit === 'mi' ? kilometers / KM_PER_MILE : kilometers);
}

export function heightInputToInches(value: string, unit: HeightUnit) {
  const numeric = numberFromInput(value);
  if (numeric === null) return null;
  return canonicalNumber(unit === 'cm' ? numeric / CM_PER_INCH : numeric);
}

export function weightInputToPounds(value: string, unit: WeightUnit) {
  const numeric = numberFromInput(value);
  if (numeric === null) return null;
  return Math.round(unit === 'kg' ? numeric * LB_PER_KG : numeric);
}

export function distanceInputToKm(value: string, unit: DistanceUnit) {
  const numeric = numberFromInput(value);
  if (numeric === null) return null;
  return Math.round(unit === 'mi' ? numeric * KM_PER_MILE : numeric);
}

export function convertHeightInput(value: string, from: HeightUnit, to: HeightUnit) {
  if (from === to) return value;
  const inches = heightInputToInches(value, from);
  return inches === null ? value : heightFromInches(inches, to);
}

export function convertWeightInput(value: string, from: WeightUnit, to: WeightUnit) {
  if (from === to) return value;
  const numeric = numberFromInput(value);
  if (numeric === null) return value;
  const pounds = from === 'kg' ? numeric * LB_PER_KG : numeric;
  return displayNumber(to === 'kg' ? pounds / LB_PER_KG : pounds);
}

export function convertDistanceInput(value: string, from: DistanceUnit, to: DistanceUnit) {
  if (from === to) return value;
  const numeric = numberFromInput(value);
  if (numeric === null) return value;
  const kilometers = from === 'mi' ? numeric * KM_PER_MILE : numeric;
  return displayNumber(to === 'mi' ? kilometers / KM_PER_MILE : kilometers);
}
