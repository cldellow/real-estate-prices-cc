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
function clearInnerText(el) {
  // When we alter the DOM, we need to invalidate caches of computed inner text values.
  var p = el;
  while(p) {
    p.hasInnerText = null;
    p = p.parentNode;
  }
}

export function rewrite(el) {
  if(el.nodeType == 1) { // Element
    var txt = innerText(el);

    // Some sites spam crap in hidden elements? Ignore that.
    if(el.nodeName == 'TEXTAREA' || el.classList.contains('hidden') || el.classList.contains('agent-info') || /^ *zestimate *\$ *[0-9]{2,3},?[0-9]{3}.{1,50}$/i.exec(txt)) {
      while(el.childNodes.length)
        el.childNodes[0].remove();

      clearInnerText(el);
      return;
    }


    if (/[0-9]{5}/.exec(txt)) {
      var p = el;
      while(p) {
        p.possibleZip = true;
        p = p.parentElement;
      }
    }

    if (/[A-Z][0-9][A-Z] *[0-9][A-Z][0-9]/i.exec(txt)) {
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
      // Remove empty text nodes
      if(el.childNodes[i].nodeType == 3 && el.childNodes[i].textContent.trim().length == 0) {
        el.childNodes[i].remove();
        i--;
      }
      clearInnerText(el);
    }

    for(var i = 0; i < el.childNodes.length; i++) {
      // Candidate rule: if adjacent children are both headers, wrap them in a div.
      if(i + 1 < el.childNodes.length &&
         el.childNodes[i].nodeType == 1 && 
         el.childNodes[i + 1].nodeType == 1 &&
         el.childNodes[i].nodeName.match(/h[1-6]/i) &&
         el.childNodes[i + 1].nodeName.match(/h[1-6]/i) &&
         !el.childNodes[i].tainted) {
        const div = el.ownerDocument.createElement('div');
        const fst = el.childNodes[i];
        const snd = el.childNodes[i + 1];
        el.insertBefore(div, fst);
        fst.tainted = true; // prevent recursing into this and immediately doing it again
        fst.remove();
        snd.remove();
        div.appendChild(fst);
        div.appendChild(snd);
        i--;
        clearInnerText(el);
        continue;
      }


      // If this is a naked text node intermingled with other content, wrap it in a span to make
      // targeting easier.
      if(el.childNodes[i].nodeType == 3 && el.childNodes.length > 1 && el.childNodes[i].textContent.trim().length > 0) {
        const wrapped = el.ownerDocument.createElement('span');
        const textNode = el.ownerDocument.createTextNode(el.childNodes[i].textContent);
        wrapped.appendChild(textNode);
        el.insertBefore(wrapped, el.childNodes[i]);
        el.childNodes[i + 1].remove();
        clearInnerText(el);
      }

      rewrite(el.childNodes[i]);
    }

  }
}

const normalize = x => x.toLowerCase().replace(/[^a-z0-9]/g, '');

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

    if(acc[k].findIndex(el => {
      if(el.replace && v.replace)
        return normalize(el) == normalize(v)
      return el == v;
    }) == -1)
      acc[k].push(v);
  }

  return acc;
}

function tryListing(candidate, el) {
  // Return merged candidate iff it has no conflicting values.
  const entries = Object.entries(candidate);
  if(entries.length == 0)
    return;

  const ourEls = el.querySelectorAll('*').length;
  const docEls = el.ownerDocument.querySelectorAll('*').length;
  const domPct = ourEls / docEls;

  console.log(candidate, el, domPct);
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
    } else if(k == 'address' && v.length == 2 && candidate['city'] && candidate['city'].length == 1 &&
        ((normalize(v[0]) + normalize(candidate['city'][0]) == normalize(v[1])) ||
          (normalize(v[1]) + normalize(candidate['city'][0]) == normalize(v[0])))) {
      if(v[0].length > v[1].length)
        rv[k] = v[1];
      else
        rv[k] = v[0];
      ok = true;
    } else if(k == 'address' && v.length == 2 && candidate['city'] && candidate['city'].length == 1 &&
      candidate['state'] && candidate['state'].length == 1 &&
        ((normalize(v[0]) + normalize(candidate['city'][0]) + normalize(candidate['state'][0]) == normalize(v[1])) ||
          (normalize(v[1]) + normalize(candidate['city'][0]) + normalize(candidate['state'][0]) == normalize(v[0])))) {
      if(v[0].length > v[1].length)
        rv[k] = v[1];
      else
        rv[k] = v[0];
      ok = true;
    } else if(k == 'city' && v.length == 2 && candidate['address'] && candidate['address'].length == 1 &&
      candidate['state'] && candidate['state'].length == 1 && candidate['city'].indexOf(candidate['state'][0]) >= 0 &&
      candidate['address'][0].endsWith(candidate['city'].find(x => x != candidate['state'][0]))
    ) {
      // We have something like:
      // Address = 8 JARDEM Rhinebeck
      // City = Rhinebeck, NY
      // State = NY
      //
      // Drop the state from the city listing.
      rv[k] = v.find(x => x != candidate['state'][0]);
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

export function isEqual(a, b) {
  if(a == b)
    return false;

  const keysa = Object.keys(a).filter(key => key[0] != '_');
  const keysb = Object.keys(b).filter(key => key[0] != '_');

  keysa.sort();
  keysb.sort();

  if(keysa.length != keysb.length)
    return false;

  for(var i = 0; i < keysa.length; i++) {
    if(keysa[i] != keysb[i])
      return false;

    if(a[keysa[i]] != b[keysa[i]])
      return false;
  }

  return true;
}

export function isDescendant(child, parent) {
  var p = child;
  while(p) {
    if(p == parent)
      return true;

    p = p.parentElement;
  }

  return false;
}

export function removeEquals(xs) {
  const rv = [];
  const dead = {};
  for(var i = 0; i < xs.length; i++) {
    if(dead[i])
      continue;

    var candidate = xs[i];
    for(var j = 0; j < xs.length; j++) {
      if(dead[j])
        continue;

      if(isEqual(xs[i], xs[j])) {
        // Whichever has more specificity should become the candidate. The other becomes dead.
        if(xs[i]['_el'] && xs[j]['_el'] && isDescendant(xs[i]['_el'], xs[j]['_el'])) {
          dead[j] = true;
        } else {
          dead[i] = true;
          dead[j] = true;
          candidate = xs[j];
        }
      }
    }

    rv.push(candidate);
  }
  return rv;
}


export function removeSubsets(_xs) {
  // Given a bunch of listings, remove duplicates. x is a duplicate of y
  // if all of x's keys are present in y with the same values.
  //
  // Further, if x and y are equal, prefer to remove the entry that is higher in the DOM.
  // (the `_el` key indicates the containing DOM element)
  //
  // Handle equality first, so that we can give preference to DOM specificity.
  const xs = removeEquals(_xs);

  const rv = [];
  const dead = {};

  for(var i = 0; i < xs.length; i++) {
    if(dead[i])
      continue;

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

export function removeConflictingElements(xs) {
  // If elements A and B contribute a listing, and A is a parent of B, reject B.
  const rv = [];
  for(var i = 0; i < xs.length; i++) {
    var ok = true;
    for(var j = 0; j < xs.length; j++) {
      if(i != j && xs[i]['_el'] && xs[j]['_el'] && isDescendant(xs[i]['_el'], xs[j]['_el'])) {
        ok = false;
        break;
      }
    }

    if(ok)
      rv.push(xs[i]);
  }
  return rv;
}

export function removeTooBroad(xs) {
  // Remove matches that consumed basically the entire page. These
  // have a high likelihood of being garbage that are stitched together
  // from unrelated facts.
  return xs.filter(item => {
    var domOk = true;
    const el = item['_el'];
    if(el) {
      // How many descendants does our element have? How many does the root have?
      const ourEls = el.querySelectorAll('*').length;
      const docEls = el.ownerDocument.querySelectorAll('*').length;
      //console.log('DOM %: ' + (ourEls / docEls));
      if(ourEls / docEls >= 0.70)
        domOk = false;
    }

    return domOk;
  });
}

export function removeIncomplete(xs) {
  return xs.filter(item => {
    if(!item['price'] && item['sold_price'])
      item['price'] = item['sold_price'];
    const priceOk = item['price'];
    const countryOk = item['country'];
    const cityOk = !item['city'] || (item['city'].length < 40 && !/[0-9]/.exec(item['city']));
    const addressOk = item['address'] && item['address'].length < 60 && / /.exec(item['address']);

    return priceOk && countryOk && addressOk && cityOk;
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

function consumeNode(node, counter) {
  var p = node;
  while(p) {
    p.consumed_run = counter;
    p = p.parentNode;
  }
}

function isConsumed(node, counter) {
  return node.consumed_run == counter;
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
          (prices.length == 0 && soldPrices.length == 1) ||
          (soldPrices.length == 1 && prices.filter(price => soldPrices.indexOf(price) >= 0).length == 1)) {
        } else {
          break;
        }
      } else {
        const nodes = el.querySelectorAll(ruleSelector);
        for(var k = 0; k < nodes.length; k++) {
          if(!isConsumed(nodes[k], counter)) {
            const nodeRv = f(nodes[k]);
            if(nodeRv && consume) {
              consumeNode(nodes[k], counter);
            }
            listings.push(nodeRv);
          } else {
            //console.log('skipping node', nodes[k]);
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
          if(!isConsumed(nodes[k], counter)) {
            const nodeRv = f(nodes[k], listing);
            if(nodeRv && consume) {
              consumeNode(nodes[k], counter);
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

  const newRv = removeIncomplete(removeConflictingElements(peekholeFixes(removeSubsets(removeTooBroad(rv)))));
  for(var i = 0; i < newRv.length; i++) {
    const el = newRv[i];
    if(el['_el']) {
      el['_el'].style.border = '3px dashed green';
      el['_el'].style.backgroundColor = '#beb';
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
