import { innerText } from './innertext.mjs';

function _parseStreetAddressUSFull(el) {
  const txt = innerText(el);
  const rv = /([^,]+), ([^,]+), ([A-Z][A-Z]) +([0-9]{5})/.exec(txt);

  if(rv)
    return {
      address: rv[1],
      city: rv[2],
      state: rv[3],
      postal_code: rv[4],
      country: 'US'
    }
}

function _parseStreetAddressUSNoCityNoState(el) {
  const txt = innerText(el);
  const rv = /^ *([0-9][^,]+) +([0-9]{5}) *$/.exec(txt);

  if(rv)
    return {
      address: rv[1],
      postal_code: rv[2],
      country: 'US'
    }
}

function _parseStreetAddressCanadaCityNoProvince(el) {
  const txt = innerText(el);
  const rv = /^ *([0-9].+) +([A-Z][0-9][A-Z] *[0-9][A-Z][0-9]).*$/.exec(txt);

  if(rv) {
    return {
      address: rv[1],
      postal_code: rv[2],
      country: 'CA'
    }
  }
}



function parseStreetAddress(el) {
  return _parseStreetAddressUSFull(el) ||
    _parseStreetAddressUSNoCityNoState(el) ||
    _parseStreetAddressCanadaCityNoProvince(el);
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

function extractPrice(field) {
  return function(el) {
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
          [field]: parseInt(rv[1].replace(/,/g, ''), 10)
        }
    }
  }
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


export const rules = [
  ['.property', [
    ['.address', parseStreetAddress],
    ['*', extractPrice('price')],
    ['*', parseBeds],
    ['*', parseBaths],
    ['*', parseMLS]]],
  ['.idxitem', [
    ['*', parseStreetAddress],
    ['*', extractPrice('price')],
    ['*', parseBeds],
    ['*', parseBaths],
    ['*', parseSqft],
    ['*', parseMLS]]],
  ['body', [
    ['*', parseStreetAddress],
    ['.list-price, .q-list-price + div', extractPrice('price')],
    ['.q-city + span', extractTextNoComma('city')],
    ['.q-zip + span', extractZip],
    ['.q-mls + span', extractMLS],
    ['.q-list-date + div', extractDate('listing_date')],
    ['.q-year-built + div', extractYear('year_built')],
    ['.q-sq-feet + span, .q-square-feet + div', extractSquareFeet],
    ['.q-bedrooms + span', extractDigit('beds')],
    ['.q-bathrooms + span', extractDigit('baths')]]],
  ['.item-expanded', [
    ['*', parseStreetAddress],
    ['*', parseSqft],
    ['*', extractPrice('price')],
    ['.q-mls-num + dd', extractMLS],
    ['.q-bedrooms + dd', extractDigit('beds')],
    ['.q-bathrooms + dd', extractDigit('baths')]

  ]]
];

