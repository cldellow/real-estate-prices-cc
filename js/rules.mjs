import { innerText } from './innertext.mjs';

export const STOP_IF_NO_PRICE = 'rule:stop-if-no-price';
export const COLLATE = 'rule:collate';

const _parseStreetAddressUSFullRe = /([0-9][^,]+), +([^,]+?),? +([A-Z][A-Z]) *,? +([0-9]{5})/;
const _parseStreetAddressUSFullAptRe = /([0-9][^,]+, *# ?[0-9]+ *), +([^,]+), +([A-Z][A-Z]),? +([0-9]{5})/;

function _parseStreetAddressUSFull(txt) {
  const debug = !false;

  if(debug && /^ *[0-9].*[0-9]{5}/.exec(txt)) {
    console.log('_parseStreetAddressUSFull: ' + txt);
  }
  var rv = _parseStreetAddressUSFullAptRe.exec(txt);
  if(!rv)
    rv = _parseStreetAddressUSFullRe.exec(txt);

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

function _parseStreetAddressStateZip(txt) {
  const rv = /^ *([1-9][0-9A-Za-z .']+), *([A-Z][A-Z]) *,* *([0-9]{5}) *$/.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      state: rv[2].trim(),
      postal_code: rv[3].trim(),
      country: 'US'
    }
  }

  const rv2 = /^ *([1-9][0-9A-Za-z .']+), *([A-Z][A-Z]) *,* *([0-9]{5}) *- *[0-9]{4} *$/.exec(txt);
  if(rv2) {
    return {
      address: rv2[1].trim(),
      state: rv2[2].trim(),
      postal_code: rv2[3].trim(),
      country: 'US'
    }
  }
}

const USStates = [
  ['Alabama', 'AL'],
  ['Alaska', 'AK'],
  ['Arizona', 'AZ'],
  ['Arkansas', 'AR'],
  ['California', 'CA'],
  ['Colorado', 'CO'],
  ['Connecticut', 'CT'],
  ['District of Columbia', 'DC'],
  ['Delaware', 'DE'],
  ['Florida', 'FL'],
  ['Georgia', 'GA'],
  ['Hawaii', 'HI'],
  ['Idaho', 'ID'],
  ['Illinois', 'IL'],
  ['Indiana', 'IN'],
  ['Iowa', 'IA'],
  ['Kansas', 'KS'],
  ['Kentucky', 'KY'],
  ['Louisiana', 'LA'],
  ['Maine', 'ME'],
  ['Maryland', 'MD'],
  ['Massachusetts', 'MA'],
  ['Michigan', 'MI'],
  ['Minnesota', 'MN'],
  ['Mississippi', 'MS'],
  ['Missouri', 'MO'],
  ['Montana', 'MT'],
  ['Nebraska', 'NE'],
  ['Nevada', 'NV'],
  ['New Hampshire', 'NH'],
  ['New Jersey', 'NJ'],
  ['New Mexico', 'NM'],
  ['New York', 'NY'],
  ['North Carolina', 'NC'],
  ['North Dakota', 'ND'],
  ['Ohio', 'OH'],
  ['Oklahoma', 'OK'],
  ['Oregon', 'OR'],
  ['Pennsylvania', 'PA'],
  ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'],
  ['South Dakota', 'SD'],
  ['Tennessee', 'TN'],
  ['Texas', 'TX'],
  ['Utah', 'UT'],
  ['Vermont', 'VT'],
  ['Virginia', 'VA'],
  ['Washington', 'WA'],
  ['West Virginia', 'WV'],
  ['Wisconsin', 'WI'],
  ['Wyoming', 'WY']
];

const _usStateToAbbrev = {};
for(var i = 0; i < USStates.length; i++) {
  const [name, abbrev] = USStates[i];
  _usStateToAbbrev[abbrev] = abbrev;
  _usStateToAbbrev[name] = abbrev;
  _usStateToAbbrev[name.toUpperCase()] = abbrev;
}

const _usStateAlternation = (function() {
  const rv = [];
  for(var i = 0; i < USStates.length; i++) {
    const [name, abbrev] = USStates[i];
    rv.push(name);
    rv.push(name.toUpperCase());
    rv.push(abbrev);
  }


  return rv.join('|');
})();

const _onlyUSStateRe = new RegExp('^ *(' + _usStateAlternation + ') *$');
function parseState(el) {
  const txt = innerText(el);
  const rv = _onlyUSStateRe.exec(txt);

  if(rv) {
    return {
      state: _usStateToAbbrev[rv[1]],
      country: 'US'
    }
  }
}

function parseAddressNoStateNoZip(el) {
  const txt = innerText(el);
  const rv = /^ *([1-9][0-9]* *[0-9A-Z][^ ]+ *[0-9A-Z].+) *$/.exec(txt);

  if(rv) {
    return {
      address: rv[1]
    }
  }
}

const _parseStreetAddressUSCityStateNoPostalRE = new RegExp(
  '^ *([0-9][^,]+), *([^,]+), *(' + _usStateAlternation + ')'
);


function _parseStreetAddressUSCityStateNoPostal(txt) {
  const rv = _parseStreetAddressUSCityStateNoPostalRE.exec(txt);

  if(rv) {
    return {
      address: rv[1],
      city: rv[2],
      state: _usStateToAbbrev[rv[3]],
      country: 'US'
    }
  }
}

function _parseStreetAddressNoStateNoCountryNoPostal(txt) {
  if(/[0-9] *car /i.exec(txt))
    return;


  const rv = /^ *([1-9][0-9A-Za-z .']+), *([A-Z][A-Za-z .']*) *$/.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      city: rv[2].trim()
    }
  }
}

function parseCityState(el) {
  const txt = innerText(el);
  if(/[0-9] *car /i.exec(txt))
    return;

  const rv = /^ *([A-Z][A-Za-z .']*), *([A-Z][A-Z]) *$/.exec(txt);

  if(rv) {
    return {
      city: rv[1].trim(),
      state: rv[2].trim()
    }
  }
}

function parseAcres(el) {
  const txt = innerText(el);
  const res = [
    /^ *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *acres? *$/i,
    /^ *lot size:? *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *acres? *$/i,
    /^ *lot acreage is:? *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv) {
      return {
        lot_size: parseFloat(rv[1].trim())
      }
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

function _parseStreetAddressCanadaCityProvince(txt) {
  const rv = /^ *([0-9].+)[, ]+(.+)[, ]+(NL|PE|NS|NB|QC|ON|MB|SK|AB|BC|YT|NT|NU|Newfoundland|Newfoundland and Labrador|PEI|Prince Edward Island|Nova Scotia|Quebec|Ontario|Manitoba|Saskatchewan|Alberta|British Columbia|Yukon|Northwest Territories|Nunavut|Que|Ont|Man|Alta|Alb|Sask)[, ]+([A-Z][0-9][A-Z] *[0-9][A-Z][0-9]).*$/.exec(txt);

  if(rv) {
    var state = rv[2];

    if(state.startsWith('Newfoundland'))
      state = 'NL';
    else if(state.startsWith('British'))
      state = 'BC'
    else if(state.startsWith('P'))
      state = 'PE';
    else if(state.startsWith('Nova'))
      state = 'NS';
    else if(state.startsWith('Q'))
      state = 'QC';
    else if(state.startsWith('On'))
      state = 'ON';
    else if(state.startsWith('Man'))
      state = 'MB';
    else if(state.startsWith('Sask'))
      state = 'SK';
    else if(state.startsWith('Al'))
      state = 'AB';
    else if(state.startsWith('Y'))
      state = 'YT';
    else if(state.startsWith('Northwest'))
      state = 'NT';
    else if(state.startsWith('Nu'))
      state = 'NU';

    return {
      address: rv[1].trim(),
      state: state.trim(),
      postal_code: rv[3].trim(),
      country: 'CA'
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

  // If we have what looks a lot like a bland promotional statement, we probably
  // parsed badly.
  if(address.indexOf(' is a ') >= 0)
    return;

  if(/\( *\)/.exec(address))
    return;

  if(/sq\.ft\./.exec(address))
    return;

  // If a series of 3 words repeats in the address, there's probably an issue.
  const tokens = address.toLowerCase().replace(/ +/g, ' ').split(' ');
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
  // This should maybe just be for all block elements? Meh.
  const commaForBRAndHeaders = innerText(el, {'BR': ', ', 'H1': ', ', 'H2': ', ', 'H3': ', ', 'H4': ', ', 'H5': ', ', 'H6': ', ', 'TR': ',', 'P': ','}, 'br+headers').replace(priceRe, '');

  const fs = [];
  if(el.possibleZip) {
    fs.push(_parseStreetAddressUSFull);
    fs.push(_parseStreetAddressUSNoCityNoState);
    fs.push(_parseStreetAddressStateZip);
  }

  if(el.possiblePostalCode) {
    fs.push(_parseStreetAddressCanadaCityProvince);
    fs.push(_parseStreetAddressCanadaCityNoProvince);
  }

  fs.push(_parseStreetAddressUSCityStateNoPostal);
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
    /^ *([0-9]{1,2}) *bd[ ,]*$/i,
    /^ *beds *([0-9]{1,2}) *$/i,
    /^ *bedrooms? *([0-9]{1,2}) *$/i,
    /^ *([0-9]{1,2}) * bedrooms? *$/i,
    /^ *([0-9]{1,2}) *br *\/ * [0-9]{1,2} *ba /i,
    /^ *([0-9]{1,2}) Bed, [0-9.]+ Bath \([0-9] Full Bath\), [0-9]{1,2},[0-9]{3} sqft */i,
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
    /^ *[0-9]{1,2} *beds? *. *([0-9]{1,2}) *baths? *,/i,
    /^ *[0-9]{1,2} *bedrooms? *. *([0-9]{1,2}) *bathrooms? */i,
    /^ *[0-9]{1,2} *bedrooms? *. *([0-9]{1,2}) *baths? */i,
    /^ *([0-9]{1,2}) total bath\(?s?\)? *$/i,
    /^ *([0-9]{1,2}) *ba *$/i,
    /^ *([0-9]{1,2}) *full *ba *$/i,
    /^ *([0-9]{1,2})\.[0-9] *ba *$/i,
    /^ *baths *([0-9]{1,2}) *$/i,
    /^ *bathrooms? *([0-9]{1,2}) *$/i,
    /^ *baths *([0-9]{1,2}) *full *$/i,
    /^ *[0-9]{1,2} *br *\/ *([0-9]{1,2}) *ba /i,
    /^ *([0-9]{1,2}) * bathrooms? *$/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*,\s*([0-9])\s*bath *s?\s*,\s*[0-9,]+\s*sq\s*ft/i,
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

function parseHalfBaths(el) {
  const txt = innerText(el);
  const res = [
    /^ *([0-9]{1,2}) *half bath\(?s?\)? *$/i,
    /& *([0-9]{1,2}) *half bath\(?s?\)? *$/i,
    /^ *Bathrooms: *[0-9]* *\(? *full *\)? *([0-9]{1,2}) *\(? *half *\)? *$/i,
    /^ *Full: *[0-9]+ *\/ *Half: *([0-9]{1,2}) *$/i
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);
    if(rv)
      return {
        half_baths: parseInt(rv[1], 10)
      }
  }
}

function parseMLSAndMLSId(el) {
  if(el.nodeType == 1 && el.nodeName.toUpperCase() == 'A') {
    const href = el.getAttribute('href');
    const re = /mls=([0-9]+)&mlsid=([0-9]+)/.exec(href);
    if(re) {
      return {
        _mls_mlsid: re[1] + '-' + re[2]
      }
    }
  }
}

function parseMLS(el) {
  const txt = innerText(el);
  const rv = /^ *MLS *#?:? *([A-Z0-9]{5,15}) *$/.exec(txt);

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
    /^ *square feet *([0-9]{1,2},[0-9]{3}) *$/i,
    /^ *square feet *([0-9]{3}) *$/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*,\s*[0-9]\s*bath *s?\s*,\s*([0-9]{1,2},[0-9]{3})+\s*sq\s*ft/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*,\s*[0-9]\s*bath *s?\s*,\s*([0-9]{3})+\s*sq\s*ft/i,
    /^ *[0-9]{1,2} Bed, [0-9.]+ Bath \([0-9] Full Bath\), ([0-9]{1,2},[0-9]{3}) sqft */i,
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

function parsePostalCode(el) {
  const txt = innerText(el);
  const rv = /^[ :]*([A-Z][0-9][A-Z] *[0-9][A-Z][0-9]) *$/.exec(txt);

  if(rv) {
    return {
      postal_code: rv[1].replace(/ /g, ''),
      country: 'CA'
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

function parseSoldPrice(el) {
  const txt = innerText(el);
  const res = [
    /^SOLD: *(\$ *[0-9,]*) *$/
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);
    if(rv) {
      const price = extractPriceFromString(rv);
      if(price)
        return {sold_price: price};
    }
  }
}

export function extractPriceFromString(str) {
  // Extract 0 or 1 prices form a string.
  // eg: "$150,000" => 150000
  //     "$0 to $100,000" => null
  //     "The price is $100,000. That price again is $100,000." => 100000
  const res = [
    /\$ *([1-9][0-9]{1,2}) *[kK]/g,
    /\$ *([0-9]{1,3}, *[0-9]{3}, *[0-9]{3})/g,
    /\$ *([0-9]{2,3}, *[0-9]{3})/g
  ];

  const rvs = {};

  var its = 0;
  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    var rv = re.exec(str);
    while(rv) {
      its++;
      // Store the offset so that when $123,456,789 parses as $123, $123,456, $123,456,789, we can take the longest match
      var candidate = parseInt(rv[1].replace(/,/g, ''), 10);
      if(candidate < 1000)
        candidate *= 1000;
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

  if(values.length && values[0] == values[values.length - 1] && values[0] > 50000)
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
      postal_code: rv[1],
      country: 'US'
    }
}

function sqft2acres(sqft) {
  return sqft * 0.000022956841138040226540538088;
}

function extractLotSizeFromSquareFeet(el) {
  const txt = innerText(el);
  const res = [
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *$/,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *sq\.?u?a?r?e? *f?e?e?t *$/,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *\/ *builder *$/i,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *\/ *appraisal district *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv)
      return {
        lot_size: sqft2acres(parseInt(rv[1].replace(/[ ,]+/g, ''), 10))
      }
  }
}

function extractSquareFeet(el) {
  const txt = innerText(el);
  const res = [
    /^[ :]*([0-9]{3}) *$/,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *$/,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *\/ *builder *$/i,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *\/ *appraisal district *$/i,
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
  const rv = /^[ :]*#? *([A-Z]{0,2}[0-9]{5,}) *$/.exec(txt);

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

function extractIntegerFromFloat(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = /^[ :]*([0-9]+)\.[0-9] *$/.exec(txt);
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

      if(c >= 10 && c <= 30 && a >= 1 && a <= 12 && b >= 1 && b <= 31)
        return {[field]: `${2000 + c}-${a}-${b}`};


    }
  }
}

function parseYearBuilt(el) {
  const txt = innerText(el);

  const res = [
    /^ *([0-9]{4}) *year built *$/i,
    /^ *built in:? *([0-9]{4}) *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv) {
      const year = parseInt(rv[1], 10);
      if(year >= 1850 && year <= 2050)
        return {year_built: year};
    }
  }
}

function extractYear(field) {
  return function(el) {
    const txt = innerText(el);
    const res = [
      /^[ :]*([0-9]{4}) *$/,
      /^[ :]*([0-9]{4}) *\/ *seller *$/i,
      /^[ :]*([0-9]{4}) *\/ *builder *$/i,
      /^[ :]*([0-9]{4}) *\/ *appraisal *district *$/i,
    ];

    for(var i = 0; i < res.length; i++) {
      const rv = res[i].exec(txt);
      if(rv) {
        const year = parseInt(rv[1], 10);
        if(year >= 1850 && year <= 2050)
          return {[field]: year};
      }
    }
  }
}

function expandLinkToAddressCityStatePostalCode(el, listing) {
  const { address, city, state, postal_code } = listing;
  if(address || city || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const maybeAddress = innerText(el);
  const addressSlug = maybeAddress.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
  const re = RegExp('/' + addressSlug + '/([a-z-]+)/([a-z][a-z])/([0-9]{5})/', 'i');

  const rv = re.exec(href);
  if(rv) {
    return {
      address: maybeAddress,
      city: rv[1],
      postal_code: rv[3],
      state: rv[2].toUpperCase(),
      country: 'US'
    }
  }
}

function expandAddressCityToStatePostalCode(el, listing) {
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

function expandCityStateToAddressPostalCode(el, listing) {
  const { address, postal_code, city, state} = listing;
  if(address || postal_code || !city || !state)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const title = el.getAttribute('title');


  if(!title)
    return;

  const re = RegExp("([0-9][A-Z0-9a-z .']+), *" + city + ', ' + state + ',* *([0-9]{5})');

  const rv = re.exec(title);
  if(rv) {
    return {
      address: rv[1],
      postal_code: rv[2],
      country: 'US'
    }
  }
}

function expandMLSAndMLSIdToAddressStatePostalCode(el, listing) {
  const { _mls_mlsid, address, state, postal_code} = listing;
  if(!_mls_mlsid || address || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const re = RegExp(_mls_mlsid + "-([0-9].+)-([A-Za-z]{2})-([0-9]{5})");

  const rv = re.exec(href);
  if(rv) {
    return {
      address: rv[1].replace(/-/g, ' '),
      state: rv[2].toUpperCase(),
      postal_code: rv[3],
      country: 'US'
    }
  }
}

function expandExternalIdCityToAddressStatePostalCode(el, listing) {
  const { external_id, address, city, state, postal_code} = listing;
  if(!external_id || !city || address || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const citySlug = city.toLowerCase().replace(/[^a-z]+/g, '-');
  const re = RegExp(external_id + "-([0-9].+)-" + citySlug + "-([A-Za-z]{2})-([0-9]{5})");

  const rv = re.exec(href);
  if(rv) {
    return {
      address: rv[1].replace(/-/g, ' '),
      state: rv[2].toUpperCase(),
      postal_code: rv[3],
      country: 'US'
    }
  }
}

export const rules = [
  ['*', [
    // Blackhole some things that look like prices
    ['.q-maintenance-charge-month + td', extractPrice('_condo_fee'), true],
    ['.q-association-fee + td', extractPrice('_association_fee'), true],
    ['.q-tax-amount + td', extractPrice('_tax_amount'), true],
    ['.q-total-mortgage + td', extractPrice('_mortgage'), true],
    ['.q-bc-assessment-2017 + span', extractPrice('_assessment'), true],

    ['.list-price, .q-list-price + div', extractPrice('price'), true],
    ['.close-price, .q-close-price + div, .q-sold-price + td, .q-sale-price + span, .q-sale-price + strong, .q-sold-price + span', extractPrice('sold_price'), true],
    ['*', parseSoldPrice, true],
    ['*', extractPrice('price')],
    [STOP_IF_NO_PRICE, STOP_IF_NO_PRICE],
    ['.q-lot-size + td, .q-acres + span', extractLotSizeFromSquareFeet, true],
    ['*', parseSqft],
    ['*', parseBeds],
    ['*', parseBaths],
    ['*', parseHalfBaths],
    ['*', parseMLS],
    ['a', parseMLSAndMLSId],
    ['*', parseStreetAddress],
    ['*', parseCityState],
    ['*', parseAcres],
    ['*', parseYearBuilt],
    ['.q-address + span', parseAddressNoStateNoZip],
    ['.q-state + span', parseState],
    ['.q-postal-code + span', parsePostalCode],
    ['.q-city + span', extractTextNoComma('city')],
    ['.q-zip + span, .q-zip-code + span', extractZip],
    ['.q-mls + span, .q-mls-num + dd, .q-mls-id + span', extractMLS],
    ['.q-list-date + div, .q-date-listed + span', extractDate('listing_date')],
    ['.q-sold + span, .q-sale-date + span, .q-sold-date + *', extractDate('sold_date')],
    ['.q-year-built + div, .q-year-built + dd, .q-built + span, .q-year-built + td, .q-year-built + span, .q-built + div', extractYear('year_built')],
    ['.q-sq-feet + span, .q-square-feet + div, .q-living-sqft + dd, .q-bldg-sqft + td, .q-square-footage + td, .q-sq-footage + td, .q-square-feet + span, .q-square-footage + span', extractSquareFeet],
    ['.q-bedrooms + span, .q-bedrooms + dd, .q-bedrooms-number + td, .q-bedrooms + td', extractDigit('beds')],
    ['.q-bathrooms + span, .q-bathrooms + dd, .q-full-bathrooms-number + td, .q-full-bathrooms + td', extractDigit('baths')],
    ['.q-half-bathrooms + td', extractDigit('half_baths')],
    ['.q-bathrooms + span, .q-bathrooms + dd, .q-full-bathrooms-number + td', extractIntegerFromFloat('baths')],
    [COLLATE, COLLATE],
    ['a', expandAddressCityToStatePostalCode],
    ['a', expandCityStateToAddressPostalCode],
    ['a', expandMLSAndMLSIdToAddressStatePostalCode],
    ['a', expandExternalIdCityToAddressStatePostalCode],
    ['a', expandLinkToAddressCityStatePostalCode],
  ]]
];

