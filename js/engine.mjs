import * as ruleExports from './rules.mjs';
import { innerText } from './innertext.mjs';

/*
 * Overview of process:
 *
 * 1. Rewrite the HTML to be more amenable to automated extraction
 *    a. Wrap naked text in SPAN: <div>foo<span>bar</span></div> -> <div><span>foo</span><span>bar</span></div>
 *    b. Tag elements with names based on contents: <span>foo</span> -> <span class="q-foo">foo</span>
 * 2. Apply rules to generate candidate listings
 * 3. Reject listings where the rules found conflicting values for attributes, e.g. a house with 2 listing prices
 * 4. Reject listings that are subsets of other listings, e.g. {address=foo} is a subset of {address=foo, country=CA}
 * 5. Reject listings that don't have enough information
 * 6. Tada, these are hopefully the correct listings.
 */

// Tag DOM with extra classes for targeting.
export function rewrite(el) {
  if(el.nodeType == 1) { // Element

    var txt = innerText(el);
    if (/[0-9]{5}/.exec(txt)) {
      var p = el;
      while(p) {
        p.possibleZip = true;
        p = p.parentElement;
      }
    }

    if (/[A-Z][0-9][A-Z] *[0-9][A-Z][0-9]/.exec(txt)) {
      var p = el;
      while(p) {
        p.possiblePostalCode = true;
        p = p.parentElement;
      }
    }

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

function tryListing(candidate, el) {
  // Return merged candidate iff it has no conflicting values.
  const entries = Object.entries(candidate);
  if(entries.length == 0)
    return;

  //console.log(candidate, el);
  const rv = {};

  var ok = false;
  for(var i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];

    if(v.length == 1) {
      rv[k] = v[0];
      ok = true;
    } else if(k == 'price' && v.length == 2 && candidate['sold_price'] &&
      candidate['sold_price'].length == 1 &&
      v.filter(price => candidate['sold_price'].indexOf(price) == -1).length == 1) {
      // special case: if we have 2 prices, but one is the sale price, the other is likely the listing price
      rv[k] = v.filter(price => candidate['sold_price'].indexOf(price) == -1)[0];
      ok = true;
    } else
      return;
  }

  if(ok)
    return rv;
}

export function isSubset(needle, haystack) {
  if(needle == haystack)
    return false;

  const entries = Object.entries(needle);
  for(var i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];

    if(k[0] != '_' && haystack[k] != v)
      return false;
  }

  return true;
}

export function removeSubsets(xs) {
  const rv = [];

  const dead = {};
  for(var i = 0; i < xs.length; i++) {
    let ok = true;
    for(var j = 0; j < xs.length; j++)  {
      ok = ok && ((i == j || j in dead) || !isSubset(xs[i], xs[j]));
    }

    if(ok) {
      rv.push(xs[i]);
    } else {
      dead[i] = true;
    }
  }

  return rv;
}

export function peekholeFixes(xs) {
  for(var i = 0; i < xs.length; i++) {
    const x = xs[i];
    if(x['city'] && x['address'] && x['address'].endsWith(x['city'])) {
      x['address'] = x['address'].substring(0, x['address'].length - x['city'].length).trim();
    }
  }
  return xs;
}

export function removeIncomplete(xs) {
  return xs.filter(item => {
    const el = item['_el'];
    var domOk = true;
    if(el) {
      // How many descendants does our element have? How many does the root have?
      const ourEls = el.querySelectorAll('*').length;
      const docEls = el.ownerDocument.querySelectorAll('*').length;
      //console.log('DOM %: ' + (ourEls / docEls));
      if(ourEls / docEls >= 0.75)
        domOk = false;
    }
    const priceOk = item['price'];
    const countryOk = item['country'];
    const cityOk = !item['city'] || (item['city'].length < 40 && !/[0-9]/.exec(item['city']));
    const addressOk = item['address'] && item['address'].length < 60 && / /.exec(item['address']);

    return domOk && priceOk && countryOk && addressOk && cityOk;
  });
}

function dedupe(xs) {
  const rv = [];
  const m = {};
  for(var i = 0; i < xs.length; i++) {
    if(!(xs[i] in m)) {
      m[xs[i]] = 1;
      rv.push(xs[i]);
    }
  }
  rv.sort();
  return rv;
}

var counter = 0;
function applyRule(el, selector, rules) {
  const els = el.querySelectorAll(selector);

  const rv = [];
  // Generate candidate listings
  for(var i = 0; i < els.length; i++) {
    var collateIndex = rules.length;
    counter++;
    const listings = [];
    const el = els[i];

    // Apply the rules to extract values from the page
    for(var j = 0; j < rules.length; j++) {
      const [ruleSelector, f, consume] = rules[j];

      if(ruleSelector == ruleExports.COLLATE) {
        collateIndex = j + 1;
        break;
      } else if(ruleSelector == ruleExports.STOP_IF_NO_PRICE) {
        var prices = [];
        var soldPrices = [];
        for(var k = 0; k < listings.length; k++) {
          if(listings[k]) {
            if(listings[k]['price'])
              prices.push(listings[k]['price']);

            if(listings[k]['sold_price'])
              soldPrices.push(listings[k]['sold_price']);
          }
        }

        prices = dedupe(prices);
        soldPrices = dedupe(soldPrices);
        if(prices.length == 1 ||
          (soldPrices.length == 1 && prices.filter(price => soldPrices.indexOf(price) >= 0).length == 1)) {
        } else {
          break;
        }
      } else {
        const nodes = el.querySelectorAll(ruleSelector);
        for(var k = 0; k < nodes.length; k++) {
          if(nodes[k].consumed_run != counter) {
            const nodeRv = f(nodes[k]);
            if(nodeRv && consume) {
              nodes[k].consumed_run = counter;
            }
            listings.push(nodeRv);
          }
        }
      }
    }

    // Merge the partial listings into a single listing
    var candidate = listings.reduce(mergeMapKeys, {})

    // Reject listings with duplicate keys
    var listing = tryListing(candidate, el);

    if(listing) {
      for(var j = collateIndex; j < rules.length; j++) {
        const [ruleSelector, f, consume] = rules[j];
        const nodes = el.querySelectorAll(ruleSelector);
        for(var k = 0; k < nodes.length; k++) {
          if(nodes[k].consumed_run != counter) {
            const nodeRv = f(nodes[k], listing);
            if(nodeRv && consume) {
              nodes[k].consumed_run = counter;
            }
            listings.push(nodeRv);
          }
        }
      }
    }

    // Merge the partial listings into a single listing
    candidate = listings.reduce(mergeMapKeys, {})

    // Reject listings with duplicate keys
    listing = tryListing(candidate, el);

    if(listing) {
      listing['_el'] = el;
      rv.push(listing);
    }
  }

  return rv;
}

export function extract(el) {
  const rv = [];
  for(var i = 0; i < ruleExports.rules.length; i++) {
    const tmp = applyRule(el, ruleExports.rules[i][0], ruleExports.rules[i][1]);
    for(var j = 0; j < tmp.length; j++)
      rv.push(tmp[j]);
  }

  const newRv = removeIncomplete(peekholeFixes(removeSubsets(rv)));
  for(var i = 0; i < newRv.length; i++) {
    const el = newRv[i];
    if(el['_el']) {
      el['_el'].style.border = '3px dashed green';
    }

    delete el['_el'];
  }

  return newRv;
}

// Shim to export rewrite/extract to browser clients
if(typeof window != 'undefined' && typeof _ready != 'undefined') {
  window['rewrite'] = rewrite;
  window['extract'] = extract;
  _ready();
}
