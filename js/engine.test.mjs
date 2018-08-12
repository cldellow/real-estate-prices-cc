import { isSubset, removeSubsets } from './engine.mjs';

describe('isSubset', () => {
  it('should exclude reference equal items', () => {
    const x = {'foo': 'bar'};
    expect(isSubset(x, x)).toBe(false);
  });

  it('should exclude equal items', () => {
    const x = {'foo': 'bar'};
    const y = {'foo': 'bar'};
    expect(isSubset(x, y)).toBe(true);
  });

  it('should include subsets', () => {
    const x = {'foo': 'bar'};
    const y = {'foo': 'bar', 'baz': 'quux'};
    expect(isSubset(x, y)).toBe(true);
  });

  it('should exclude non-subsets', () => {
    const x = {'foo': 'bar', 'baz': 'quux'};
    const y = {'foo': 'bar'};
    expect(isSubset(x, y)).toBe(false);
  });
});

describe('removeSubsets', () => {
  it('should handle trivial case', () => {
    const xs = [{'foo': 'bar'}, {'foo': 'bar'}];
    const rv = removeSubsets(xs);
    expect(rv).toEqual([{'foo': 'bar'}]);
  });

  it('should handle subset', () => {
    const xs = [{'foo': 'bar'}, {'foo': 'bar', 'bar': 'baz'}];
    const rv = removeSubsets(xs);
    expect(rv).toEqual([{'foo': 'bar', 'bar': 'baz'}]);
  });

  it('should ignore attrs starting with underscore', () => {
    const xs = [{'foo': 'bar', '_el': 'xxx'}, {'foo': 'bar', '_el': 'yyy'}];
    const rv = removeSubsets(xs);
    expect(rv.length).toEqual(1);
  });


  it('should handle subset regardless of order', () => {
    const xs = [{'foo': 'bar', 'bar': 'baz'}, {'foo': 'bar'}];
    const rv = removeSubsets(xs);
    expect(rv).toEqual([{'foo': 'bar', 'bar': 'baz'}]);
  });
});
