import { JSDOM } from 'jsdom';
import { isSubset, isEqual, removeSubsets } from './engine.mjs';

describe('isEqual', () => {
  it('should ignore same item', () => {
    // This is sort of weird, but useful to define it like this for our purposes.
    const x = {'foo': 'bar'};
    expect(isEqual(x, x)).toBe(false);
  });

  it('should handle equal items', () => {
    const x = {'foo': 'bar'};
    const y = {'foo': 'bar'};
    expect(isEqual(x, y)).toBe(true);

  });

  it('should handle unequal items', () => {
    const x = {'foo': 'bar'};
    const y = {'bar': 'foo'};
    expect(isEqual(x, y)).toBe(false);
  });

  it('should ignore keys that start with underscore', () => {
    const x = {'foo': 'bar'};
    const y = {'foo': 'bar', '_bar': 'foo'};
    expect(isEqual(x, y)).toBe(true);
  });


});

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

  it('should prefer to keep the more deeply nested equal items', () => {
    const dom = new JSDOM('<body><div id="upper">some jazz <div id="lower">some other jazz</div></div></body>');
    const doc = dom.window.document;

    const upper = doc.getElementById('upper');
    const lower = doc.getElementById('lower');

    const xs = [{'foo': 'bar', '_el': upper}, {'foo': 'bar', '_el': lower}];
    var rv = removeSubsets(xs);
    expect(rv.length).toEqual(1);
    expect(rv[0]['_el']).toEqual(lower);

    xs.reverse();
    rv = removeSubsets(xs);
    expect(rv.length).toEqual(1);
    expect(rv[0]['_el']).toEqual(lower);


  });

});
