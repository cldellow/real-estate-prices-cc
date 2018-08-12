import { extractPriceFromString } from './rules.mjs';

describe('extractPrice', () => {
  it('should extract price when single value', () => {
    expect(extractPriceFromString('$100,000')).toBe(100000);
  });

  it('should extract price when single value', () => {
    expect(extractPriceFromString('$12,345,678')).toBe(12345678);
  });

  it('should extract price when same value', () => {
    expect(extractPriceFromString('$12,345 is the price. $12,345 is the price.')).toBe(12345);
  });

  it('should not extract price when different values', () => {
    expect(extractPriceFromString('$12,345 is the price. $23,456 is not the price.')).toBe(undefined);
  });



});
