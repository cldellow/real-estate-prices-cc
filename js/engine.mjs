import * as rules from './rules.mjs';

// Tag DOM with extra classes for targeting.
export function rewrite(el) {
  if(el.nodeType == 1) { // Element

    var txt = rules.innerText(el);
    if(txt.length <= 40) {
      txt = txt.toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-+|-+$/g, '');
      if(txt) {
        el.className += ' q-' + txt;
      }
    }

    for(var i = 0; i < el.childNodes.length; i++) {
      // If this is a naked text node intermingled with other content, wrap it in a span to make
      // targeting easier.
      if(el.childNodes[i].nodeType == 3 && el.childNodes.length > 1) {
        const wrapped = el.ownerDocument.createElement('span');
        const textNode = el.ownerDocument.createTextNode(el.childNodes[i].textContent);
        wrapped.appendChild(textNode);
        el.insertBefore(wrapped, el.childNodes[i]);
        el.childNodes[i + 1].remove();
      }

      rewrite(el.childNodes[i]);
    }

  }
}

function mergeMapKeys(acc, cur) {
  if(!cur)
    return acc;

  const entries = Object.entries(cur);
  for(var i = 0; i < entries.length; i++) {
    let [k, v] = entries[i];
    if(v.replace)
      v = v.replace(/^ +| +$/g, '');

    if(!acc[k])
      acc[k] = [];

    if(acc[k].indexOf(v) == -1)
      acc[k].push(v);
  }

  return acc;
}

function tryListing(candidate) {
  //console.log(candidate);
  const rv = {};

  const entries = Object.entries(candidate);
  var ok = false;
  for(var i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];

    if(v.length == 1) {
      rv[k] = v[0];
      ok = true;
    }
    else
      return;
  }

  if(ok)
    return rv;
}

function applyRule(el, selector, rules) {
  const els = el.querySelectorAll(selector);

  const rv = [];
  for(var i = 0; i < els.length; i++) {
    const listings = [];
    const el = els[i];

    // Apply the rules to extract values from the page, accumulating distinct values.
    for(var j = 0; j < rules.length; j++) {
      const [ruleSelector, f] = rules[j];
      const nodes = el.querySelectorAll(ruleSelector);
      for(var k = 0; k < nodes.length; k++) {
        listings.push(f(nodes[k]));
      }
    }

    const candidate = listings.reduce(mergeMapKeys, {})
    const listing = tryListing(candidate);

    if(listing) {
      rv.push(listing);
    }
  }

  return rv;
}

export function extract(el) {
  const rv = [];
  for(var i = 0; i < rules.rules.length; i++) {
    const tmp = applyRule(el, rules.rules[i][0], rules.rules[i][1]);
    for(var j = 0; j < tmp.length; j++)
      rv.push(tmp[j]);
  }

  return rv;
}

// Shim to export rewrite/extract to browser clients
if(typeof window != 'undefined') {
  window['rewrite'] = rewrite;
  window['extract'] = extract;
  _ready();
}
