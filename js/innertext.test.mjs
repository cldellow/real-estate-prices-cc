import { innerText } from './innertext.mjs';
import { JSDOM } from 'jsdom';

describe('innerText', () => {
  it('should return text from text nodes', () => {
    const dom = new JSDOM('<body/>');

    const doc = dom.window.document;
    const txt = doc.createTextNode('foo');
    expect(innerText(txt)).toBe('foo');
  });

  it('should return text from child nodes', () => {
    const dom = new JSDOM('<body><div id="foo">bar<span>baz<!-- but not comments --></span></div></body>');

    const body = dom.window.document.body;
    expect(innerText(body)).toBe('bar baz');
  });
});
