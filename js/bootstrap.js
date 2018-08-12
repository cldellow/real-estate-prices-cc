// Tag DOM with extra classes for targeting.
function rewrite(el) {
  if(el.nodeType == 1) { // Element

    var txt = innerText(el);
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

function innerText(el) {
  if(el.hasInnerText)
    return el.hasInnerText;

  if(el.nodeType == 1) {
    const rv = [];
    for(var i = 0; i < el.childNodes.length; i++) {
      rv.push(innerText(el.childNodes[i]));
    }
    const ret = rv.join(' ').replace(/^ +| +$/g, '');
    el.hasInnerText = ret;
    return ret;
  } else if (el.nodeType == 3) {
    return el.textContent;
  }
  return '';
}

function mergeMapKeys(acc, cur) {
  if(!cur)
    return acc;

  const entries = Object.entries(cur);
  for(var i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];

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

function extract(el) {
  const rv = [];
  for(var i = 0; i < rules.length; i++) {
    const tmp = applyRule(el, rules[i][0], rules[i][1]);
    for(var j = 0; j < tmp.length; j++)
      rv.push(tmp[j]);
  }

  return rv;
}

const _parseStreetAddressFullUSRe = /([^,]+), ([^,]+), ([A-Z][A-Z]) +([0-9]{5})/;

function _parseStreetAddressFullUS(el) {
  const txt = innerText(el);
  const rv = _parseStreetAddressFullUSRe.exec(txt);

  if(rv)
    return {
      address: rv[1],
      city: rv[2],
      state: rv[3],
      postal_code: rv[4],
      country: 'US'
    }
}

function _parseStreetAddressNoCityNoStateUS(el) {
  const txt = innerText(el);
  const rv = /^ *([0-9].+) +([0-9]{5}) *$/.exec(txt);

  if(rv)
    return {
      address: rv[1],
      postal_code: rv[2],
      country: 'US'
    }
}


function parseStreetAddress(el) {
  return _parseStreetAddressFullUS(el) ||
    _parseStreetAddressNoCityNoStateUS(el);
}

function parsePrice(el) {
  const txt = innerText(el);
  const res = [
    /\$([0-9]{1,3}, *[0-9]{3}, *[0-9]{3})/,
    /\$([0-9]{3}, *[0-9]{3})/
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);

    if(rv)
      return {
        price: parseInt(rv[1].replace(/,/g, ''), 10)
      }
  }
}

function parseBeds(el) {
  const txt = innerText(el);
  const res = [
    /^ *([0-9]) *beds? *$/i,
    /^ *([0-9]) *bedbeds *$/i
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);
    if(rv)
      return {
        beds: parseInt(rv[1], 10)
      }
  }
}

function parseBaths(el) {
  const txt = innerText(el);
  const rv = /^ *([0-9]) *baths? *$/i.exec(txt);
  if(rv)
    return {
      baths: parseInt(rv[1], 10)
    }
}

function parseMLS(el) {
  const txt = innerText(el);
  const rv = /^ *MLS *#? *([A-Z0-9]{5,15}) *$/.exec(txt);

  if(rv)
    return {
      external_id: rv[1]
    }
}

function parseSqft(el) {
  const txt = innerText(el);
  const res = [
    /^ *([0-9]{1,2},? *[0-9]{3}) *squ?a?r?e?\.? ?fe?e?o?o?t[. ]*$/i,
    /^ *([0-9]{3}) *squ?a?r?e?\.? ?fe?e?o?o?t[. ]*$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);
    if(rv)
      return {
        sqft: parseInt(rv[1].replace(/[ ,]+/, ''), 10)
      }
  }
}

const rules = [
  ['.property', [
    ['.address', parseStreetAddress],
    ['*', parsePrice],
    ['*', parseBeds],
    ['*', parseBaths],
    ['*', parseMLS]]],
  ['.idxitem', [
    ['*', parseStreetAddress],
    ['*', parsePrice],
    ['*', parseBeds],
    ['*', parseBaths],
    ['*', parseSqft],
    ['*', parseMLS]]],
  ['body', [
    ['*', parseStreetAddress]
  ]]
];

// If we're running in Chrome, load Selector Gadget and apply some rules.
(function() {
  if(typeof document == 'object') {
    s=document.createElement('script');
    s.setAttribute('type','text/javascript');
    s.setAttribute('src','https://dv0akt2986vzh.cloudfront.net/unstable/lib/selectorgadget_edge.js');
    document.body.appendChild(s);

    const start = new Date();
    rewrite(document.body)
    console.log('rewrite: ' + (new Date() - start) + 'ms');

    const extractStart = new Date();
    const listings = extract(document);
    console.log('extract: ' + (new Date() - extractStart) + 'ms');

    const rv = [];
    for(var i = 0; i < listings.length; i++) {
      rv.push(JSON.stringify(listings[i]));
    }

    console.log(rv.join('\n'));
  }
})();


if(typeof module !== 'undefined') {
  var exports = module.exports = {
    rules: rules,
    applyRule: applyRule,
    mergeMapKeys: mergeMapKeys,
    tryListing: tryListing,
    rewrite: rewrite,
    extract: extract

  };
}
