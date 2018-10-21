import { extractPriceFromString } from './rules.mjs';

describe('extractPrice', () => {
  it('should extract price when single value', () => {
    expect(extractPriceFromString('$100,000')).toBe(100000);
  });

  it('should extract price when single value', () => {
    expect(extractPriceFromString('$ 100,000')).toBe(100000);
  });


  it('should extract price when single value', () => {
    expect(extractPriceFromString('$12,345,678')).toBe(12345678);
  });

  it('should extract price when same value', () => {
    expect(extractPriceFromString('$123,456 is the price. $123,456 is the price.')).toBe(123456);
  });

  it('should not extract price when different values', () => {
    expect(extractPriceFromString('$123,456 is the price. $234,567 is not the price.')).toBe(undefined);
  });

  it('should support $400K', () => {
    expect(extractPriceFromString('$400K')).toBe(400000);
  });

  it('should support $ 400K', () => {
    expect(extractPriceFromString('$ 400K')).toBe(400000);
  });

  it('should ignore prices below 50k', () => {
    // These are usually things like land transfer tax, or a price drop.
    expect(extractPriceFromString('$ 40K')).toBe(undefined);
  });

  it('should not thing a rental price is a price', () => {
    expect(extractPriceFromString('$689 3705 foo st')).toBe(undefined);
  });



});
