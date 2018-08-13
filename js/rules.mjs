import { innerText } from './innertext.mjs';

export const STOP_IF_NO_PRICE = 'rule:stop-if-no-price';
export const COLLATE = 'rule:collate';

const _parseStreetAddressUSFullRe = /([0-9][^,]+), +([^,]+), +([A-Z][A-Z]) +([0-9]{5})/;

function _parseStreetAddressUSFull(txt) {
  const debug = false;

  if(debug && /^ *[0-9].*[0-9]{5}/.exec(txt)) {
    console.log('_parseStreetAddressUSFull: ' + txt);
  }
  const rv = _parseStreetAddressUSFullRe.exec(txt);

  if(rv) {
    //console.log(rv);
    return {
      address: rv[1].trim(),
      city: rv[2].trim(),
      state: rv[3].trim(),
      postal_code: rv[4].trim(),
      country: 'US'
    }
  }
}
function _parseStreetAddressNoStateNoCountryNoPostal(txt) {
  const rv = /^ *([1-9][0-9A-Za-z .']+), *([A-Z][a-z .']*) *$/.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      city: rv[2].trim()
    }
  }
}

function _parseStreetAddressUSNoCityNoState(txt) {
  const rv = /^ *([0-9][^,]+) +([0-9]{5}) *$/.exec(txt);

  if(rv) {
    //console.log(rv);
    return {
      address: rv[1].trim(),
      postal_code: rv[2].trim(),
      country: 'US'
    }
  }
}

function _parseStreetAddressCanadaCityNoProvince(txt) {
  const rv = /^ *([0-9].+) +([A-Z][0-9][A-Z] *[0-9][A-Z][0-9]).*$/.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      postal_code: rv[2].trim(),
      country: 'CA'
    }
  }
}

function validAddress(rv) {
  if(!rv)
    return;

  const address = rv['address'];

  if(!address)
    return;

  if(address[0] == '0')
    return;

  if(/\( *\)/.exec(address))
    return;

  if(/sq\.ft\./.exec(address))
    return;

  // If a series of 3 words repeats in the address, there's probably an issue.
  const tokens = address.replace(/ +/g, ' ').split(' ');
  for(var i = 0; i < tokens.length - 3; i++) {
    for(var j = i + 3; j <= tokens.length - 3; j++) {
      if(tokens[i] == tokens[j] && tokens[i + 1] == tokens[j + 1] && tokens[i + 2] == tokens[j + 2])
        return null;
    }
  }
  return rv;
}

function parseStreetAddress(el) {
  if(el.parsedStreetAddress !== undefined)
    return el.parsedStreetAddress;

  const priceRe = /\$[1-9][0-9]{1,2},[0-9]{3},[0-9]{3}|\$[1-9][0-9]{1,2},[0-9]{3}/g;
  const plainText = innerText(el).replace(priceRe, '');
  const commaForBR = innerText(el, {'BR': ', '}, 'br').replace(priceRe, '');
  const commaForBRAndHeaders = innerText(el, {'BR': ', ', 'H1': ', ', 'H2': ', ', 'H3': ', ', 'H4': ', ', 'H5': ', ', 'H6': ', '}, 'br+headers').replace(priceRe, '');

  const fs = [];
  if(el.possibleZip) {
    fs.push(_parseStreetAddressUSFull);
    fs.push(_parseStreetAddressUSNoCityNoState);
  }

  if(el.possiblePostalCode) {
    fs.push(_parseStreetAddressCanadaCityNoProvince);
  }

  fs.push(_parseStreetAddressNoStateNoCountryNoPostal);

  for(var i = 0; i < fs.length; i++) {
    const rv = fs[i](commaForBRAndHeaders);
    if(validAddress(rv)) {
      el.parsedStreetAddress = rv;
      return rv;
    }
  }


  for(var i = 0; i < fs.length; i++) {
    const rv = fs[i](commaForBR);
    if(validAddress(rv)) {
      el.parsedStreetAddress = rv;
      return rv;
    }
  }

  for(var i = 0; i < fs.length; i++) {
    const rv = fs[i](plainText);
    if(validAddress(rv)) {
      el.parsedStreetAddress = rv;
      return rv;
    }
  }

  el.parsedStreetAddress = null;
  return null;
}

function parseBeds(el) {
  const txt = innerText(el);
  const res = [
    /^ *([0-9]{1,2}) *bed\(?s?\)? *$/i,
    /^ *([0-9]{1,2}) *bedbeds *$/i,
    /\bbedrooms: *([0-9]{1,2})\b/i,
    /\bbeds: *([0-9]{1,2})\b/i,
    /^ *([0-9]{1,2}) *beds? *. *[0-9]{1,2} *baths? *$/i,
    /^ *([0-9]{1,2}) *bedrooms? *. *[0-9]{1,2} *bathrooms? */i,
    /^ *([0-9]{1,2}) *bedrooms? *. *[0-9]{1,2} *baths? */i,
    /^ *([0-9]{1,2}) *bd *$/i,
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
  const res = [
    /^ *([0-9]{1,2}) *baths? *$/i,
    /\bbathrooms: *([0-9]{1,2})\b/i,
    /\bbaths: *([0-9]{1,2})\b/i,
    /^ *[0-9]{1,2} *beds? *. *([0-9]{1,2}) *baths? *$/i,
    /^ *[0-9]{1,2} *bedrooms? *. *([0-9]{1,2}) *bathrooms? */i,
    /^ *[0-9]{1,2} *bedrooms? *. *([0-9]{1,2}) *baths? */i,
    /^ *([0-9]{1,2}) total bath\(?s?\)? *$/i,
    /^ *([0-9]{1,2}) *ba *$/i,
    /^ *([0-9]{1,2})\.[0-9] *ba *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);
    if(rv)
      return {
        baths: parseInt(rv[1], 10)
      }
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

function extractPrice(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = extractPriceFromString(txt);
    if(rv) {
      return {
        [field]: rv
      }
    }
  }
}

export function extractPriceFromString(str) {
  // Extract 0 or 1 prices form a string.
  // eg: "$150,000" => 150000
  //     "$0 to $100,000" => null
  //     "The price is $100,000. That price again is $100,000." => 100000
  const res = [
    /\$([0-9]{1,3}, *[0-9]{3}, *[0-9]{3})/g,
    /\$([0-9]{2,3}, *[0-9]{3})/g
  ];

  const rvs = {};

  var its = 0;
  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    var rv = re.exec(str);
    while(rv) {
      its++;
      // Store the offset so that when $123,456,789 parses as $123, $123,456, $123,456,789, we can take the longest match
      const candidate = parseInt(rv[1].replace(/,/g, ''), 10);
      if(rv.index in rvs) {
        if(candidate > rvs[rv.index])
          rvs[rv.index] = candidate;
      } else {
        rvs[rv.index] = candidate;
      }
      rv = re.exec(str);
    }
  }

  const values = Object.values(rvs);
  values.sort();

  if(values.length && values[0] == values[values.length - 1])
    return values[0];
}

function extractTextNoComma(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = /^[ :]*([^,]+) *$/.exec(txt);

    if(rv)
      return {
        [field]: rv[1]
      }
  }
}

function extractZip(el) {
  const txt = innerText(el);
  const rv = /^[ :]*([0-9]{5}) *$/.exec(txt);

  if(rv)
    return {
      postal_code: rv[1]
    }
}

function extractSquareFeet(el) {
  const txt = innerText(el);
  const res = [
    /^[ :]*([0-9]{3}) *$/,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *$/
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv)
      return {
        sqft: parseInt(rv[1].replace(/[ ,]+/g, ''), 10)
      }
  }
}


function extractMLS(el) {
  const txt = innerText(el);
  const rv = /^[ :]*([A-Z]{0,2}[0-9]{5,}) *$/.exec(txt);

  if(rv)
    return {
      external_id: rv[1]
    }
}

function extractDigit(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = /^[ :]*([0-9]) *$/.exec(txt);
    if(rv)
      return {[field]: parseInt(rv[1], 10)}
  }
}

function extractDate(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = /^[ :]*([0-9]{1,4})[/-]([0-9]{1,2})[/-]([0-9]{1,4}) *$/.exec(txt);
    if(rv) {
      const a = parseInt(rv[1], 10);
      const b = parseInt(rv[2], 10);
      const c = parseInt(rv[3], 10);

      if(a >= 1850 && a <= 2050 && b >= 1 && b <= 12 && c >= 1 && c <= 31)
        return {[field]: `${a}-${b}-${c}`};

      if(c >= 1850 && c <= 2050 && a >= 1 && a <= 12 && b >= 1 && b <= 31)
        return {[field]: `${c}-${a}-${b}`};
    }
  }
}

function extractYear(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = /^[ :]*([0-9]{4}) *$/.exec(txt);
    if(rv) {
      const year = parseInt(rv[1], 10);
      if(year >= 1850 && year <= 2050)
        return {[field]: year};
    }
  }
}

function expandAddress(el, listing) {
  if(listing['state'] || listing['postal_code'] || !listing['address'] || !listing['city'])
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const addressSlug = listing['address'].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const citySlug = listing['city'].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const re = RegExp(addressSlug + '-' + citySlug + '-([a-z]{2})-([0-9]{5})/');

  const rv = re.exec(href);
  if(rv) {
    return {
      postal_code: rv[2],
      state: rv[1].toUpperCase(),
      country: 'US'
    }
  }
}

export const rules = [
  ['*', [
    ['.list-price, .q-list-price + div', extractPrice('price'), true],
    ['.close-price, .q-close-price + div', extractPrice('sold_price'), true],
    ['*', extractPrice('price')],
    [STOP_IF_NO_PRICE, STOP_IF_NO_PRICE],
    ['*', parseSqft],
    ['*', parseBeds],
    ['*', parseBaths],
    ['*', parseMLS],
    ['*', parseStreetAddress],
    ['.q-city + span', extractTextNoComma('city')],
    ['.q-zip + span', extractZip],
    ['.q-mls + span, .q-mls-num + dd', extractMLS],
    ['.q-list-date + div', extractDate('listing_date')],
    ['.q-year-built + div, .q-year-built + dd, .q-built + span', extractYear('year_built')],
    ['.q-sq-feet + span, .q-square-feet + div', extractSquareFeet],
    ['.q-bedrooms + span, .q-bedrooms + dd', extractDigit('beds')],
    ['.q-bathrooms + span, .q-bathrooms + dd', extractDigit('baths')],
    [COLLATE, COLLATE],
    ['a', expandAddress]
  ]]
];

