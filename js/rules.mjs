import { innerText } from './innertext.mjs';
import * as logger from './logger.mjs';

export const STOP_IF_NO_PRICE = 'rule:stop-if-no-price';
export const COLLATE = 'rule:collate';

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
  if(abbrev != 'IN' && abbrev != 'OR') // These are too likely to trigger false positives with English
    _usStateToAbbrev[abbrev[0] + abbrev[1].toLowerCase()] = abbrev;
  _usStateToAbbrev[name.toUpperCase()] = abbrev;
}

const _usStateAlternation = (function() {
  const rv = [];
  for(var i = 0; i < USStates.length; i++) {
    const [name, abbrev] = USStates[i];
    rv.push(name);
    rv.push(name.toUpperCase());
    rv.push(abbrev);
    if(abbrev != 'IN' && abbrev != 'OR')
      rv.push(abbrev[0] + abbrev[1].toLowerCase());
  }


  return rv.join('|');
})();


const _parseStreetAddressUSFullRe = new RegExp('([0-9][^,)]+)[-,] *(\s*[a-zA-Z][A-Za-z .\']+?),? *(' + _usStateAlternation + ') *,? *([0-9]{5})\\b');
const _parseStreetAddressUSFullAptRe = /([0-9][^,]+, *# ?[0-9]+ *|[0-9][^,]+, *Unit *#? *[0-9-]+-?[A-Z]? *?|[0-9][^,]+, *[0-9]{1,4}[A-Za-z]?),? +([A-Z][A-Za-z .']+),? +([A-Z][A-Z]),? +([0-9]{5})\b/;

function _parseStreetAddressUSFull(txt) {
  const debug = !false;

  if(debug && /^ *[0-9].*[0-9]{5}/.exec(txt)) {
    logger.log('_parseStreetAddressUSFull: ' + txt);
  }
  var rv = _parseStreetAddressUSFullAptRe.exec(txt);
  if(!rv)
    rv = _parseStreetAddressUSFullRe.exec(txt);

  if(rv) {
    //logger.log(rv);
    return {
      address: rv[1].trim(),
      city: rv[2].trim(),
      state: _usStateToAbbrev[rv[3].trim()],
      postal_code: rv[4].trim(),
      country: 'US'
    }
  }
}

const _parseStreetAddressStateZipRe1 = new RegExp('^ *([1-9][0-9A-Za-z .\'#]+),? *(' + _usStateAlternation + ') *,* *([0-9]{5})\\b *');
const _parseStreetAddressStateZipRe2 = new RegExp('^ *([1-9][0-9A-Za-z .\'#]+), *(' + _usStateAlternation + ') *,* *([0-9]{5}) *- *[0-9]{4} *$');

function _parseStreetAddressStateZip(txt) {
  const rv = _parseStreetAddressStateZipRe1.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      state: _usStateToAbbrev[rv[2].trim()],
      postal_code: rv[3].trim(),
      country: 'US'
    }
  }

  const rv2 = _parseStreetAddressStateZipRe2.exec(txt);
  if(rv2) {
    return {
      address: rv2[1].trim(),
      state: _usStateToAbbrev[rv2[2].trim()],
      postal_code: rv2[3].trim(),
      country: 'US'
    }
  }
}

const CAProvinces = [
  ['British Columbia', 'BC'],
  ['Alberta', 'AB'],
  ['Saskatchewan', 'SK'],
  ['Manitoba', 'MB'],
  ['Ontario', 'ON'],
  ['Quebec', 'QC'],
  ['Nova Scotia', 'NS'],
  ['New Brunswick', 'NB'],
  ['Prince Edward Island', 'PE'],
  ['Newfoundland', 'NL'],
  ['Nunavut', 'NU'],
  ['Yukon', 'YT'],
  ['Northwest Territories', 'NT']
];

const _caProvinceAlternation = (function() {
  const rv = [];
  for(var i = 0; i < CAProvinces.length; i++) {
    const [name, abbrev] = CAProvinces[i];
    rv.push(name);
    rv.push(name.toUpperCase());
    rv.push(abbrev);
  }

  return rv.join('|');
})();

const _caProvinceToAbbrev = {};
for(var i = 0; i < CAProvinces.length; i++) {
  const [name, abbrev] = CAProvinces[i];
  _caProvinceToAbbrev[abbrev] = abbrev;
  _caProvinceToAbbrev[name] = abbrev;
  _caProvinceToAbbrev[name.toUpperCase()] = abbrev;
}


const _usOrCaStateRe = new RegExp('^ *(' + _usStateAlternation + '|' + _caProvinceAlternation + ') *$');
function parseState(el) {
  const txt = innerText(el);
  const rv = _usOrCaStateRe.exec(txt);

  if(rv) {
    return {
      state: _usStateToAbbrev[rv[1]] || _caProvinceToAbbrev[rv[1]],
      country: _usStateToAbbrev[rv[1]] ? 'US' : 'CA'
    }
  }
}

function parseAddressNoStateNoZip(el) {
  const txt = innerText(el);
  const rv = /^ *([1-9][0-9]* *[0-9A-Z][^, ]+ *[0-9A-Z][^,]+) *$/.exec(txt);

  if(rv) {
    return {
      address: rv[1]
    }
  }
}

const _parseStreetAddressUSCityStateNoPostalRE = new RegExp(
  '^ *([0-9][^,]+), *([^,]+), *(' + _usStateAlternation + ')\\b'
);

const _parseStreetAddressUSCityStateNoPostalRE2 = new RegExp(
  '^ *([0-9][^,]+), +([^,]+) +(' + _usStateAlternation + ')\s*$'
);


function _parseStreetAddressUSCityStateNoPostal(txt) {
  const rv = _parseStreetAddressUSCityStateNoPostalRE2.exec(txt) || _parseStreetAddressUSCityStateNoPostalRE.exec(txt);

  if(rv) {
    return {
      address: rv[1],
      city: rv[2],
      state: _usStateToAbbrev[rv[3]],
      country: 'US'
    }
  }
}

const _parseStreetAddressCanadaCityStateNoPostalRE = new RegExp(
  '^ *([0-9][^,]+), *([^,]+),? *\\b(' + _caProvinceAlternation + ')\\b'
);


function _parseStreetAddressCanadaCityStateNoPostal(txt) {
  const rv = _parseStreetAddressCanadaCityStateNoPostalRE.exec(txt);

  if(rv) {
    return {
      address: rv[1],
      city: rv[2],
      state: _caProvinceToAbbrev[rv[3].toUpperCase()],
      country: 'CA'
    }
  }
}


function _parseStreetAddressNoStateNoCountryNoPostal(txt) {
  if(/[0-9] *car\b|bathrooms|bedrooms/i.exec(txt))
    return;


  const rv = /^ *([1-9][0-9A-Za-z .'#]+), *([A-Z][A-Za-z .']{2,}) *$/.exec(txt);

  if(rv) {
    // "<div><span>3.1</span> Bathrooms</div>" -> "3.1, Bathrooms" -> not an address.
    if(/^[0-9.]+$|[0-9] full|[0-9] half ba/.exec(rv[1].trim()))
      return;

    if(!/ /.exec(rv[1].trim())) // addresses generally aren't 1 word
      return;

    if(rv[2].trim().split(/ /).length >= 5) // cities generally don't have 5 or more words
      return;

    if(/^Explore /.exec(rv[2].trim()))
      return;

    return {
      address: rv[1].trim(),
      city: rv[2].trim()
    }
  }
}

const _parseStreetAddressStateNoPostalMaybeCityRe = new RegExp(
  '^ *([1-9][0-9A-Za-z .\'#]+), *(' + _usStateAlternation + ') *$'
);

function _parseStreetAddressStateNoPostalMaybeCity(txt) {
  if(/[0-9] *car /i.exec(txt))
    return;


  const rv = _parseStreetAddressStateNoPostalMaybeCityRe.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      state: _usStateToAbbrev[rv[2].trim()],
      country: 'US'
    }
  }
}


function parseCityState(el) {
  const txt = innerText(el);
  if(/[0-9] *car /i.exec(txt))
    return;

  const rv = /^ *([A-Z][A-Za-z .']*), *([A-Z][A-Z]) *$/.exec(txt);

  if(rv) {
    if(rv[1].trim().split(/ /).length >= 5) // cities generally don't have more than 5 words
      return;

    if(/^Explore /.exec(rv[1].trim()))
      return;

    const m = {
      city: rv[1].trim(),
      state: rv[2].trim()
    };

    if(_usStateToAbbrev[rv[2].trim()])
      m['country'] = 'US';

    if(_caProvinceToAbbrev[rv[2].trim()])
      m['country'] = 'CA';

    return m;
  }
}

function parseAcres(el) {
  const txt = innerText(el);
  const res = [
    /^ *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *acres? *$/i,
    /^ *lot size:? *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *acres? *$/i,
    /^ *lot acreage is:? *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *$/i,
    /^ *[0-9,]{3,6} sq ft; lot: ([0-9.]+) acres *$/i,
    /^\s*[0-9,]{3,6}\s*sqft\s*lot\s*([0-9][0-9. ]+)\s*acr?e?s?\s*$/i,
    /^ *([0-9.]+) ac *lot *size *$/i,
    /^\s*[1-9].+ is a \$[0-9,]+, [0-9] bedroom, [0-9][0-9.]* bath home on a ([0-9.]{1,4}) acre lot located in [A-Z][^,]+, [A-Z][A-Z]\.\s*$/,
    /^ *([0-9.]+) acre\(s\) *$/i,
    /^\s*[1-9][^,]+ is a \$[0-9,]+, [0-9,]{3,6} square foot, [0-9]{1,2} bedroom, [0-9]{1,2}[0-9.]* bath home on a ([0-9.]{1,4}) acre lot located in [A-Z][^,]+, [A-Z][A-Z]\.\s*$/,
    /^ *lot:? *(\.[0-9]+|[0-9]+\.[0-9]+|[0-9]+) *acres? *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv) {
      return {
        lot_size: parseFloat(rv[1].replace(/ /g, ''))
      }
    }
  }

  const sqftRes = [
    /^\s*[0-9,]{3,6}\s*sqft\s*lot\s*([0-9][0-9,]+)\s*sq *ft\s*$/i,
  ];

  for(var i = 0; i < sqftRes.length; i++) {
    const rv = sqftRes[i].exec(txt);

    if(rv) {
      return {
        lot_size: sqft2acres(parseFloat(rv[1].replace(/[ ,]/g, '')))
      }
    }
  }

}

function _parseStreetAddressUSCityNoState(txt) {
  const rv = /^ *([0-9][^,]+), ([A-Z][a-zA-Z ]+),? +([0-9]{5}) *$/.exec(txt);

  const cityLooksLikeState = rv && rv[2].trim().length == 2 && rv[2].trim().toUpperCase() == rv[2].trim();

  if(rv && !cityLooksLikeState) {
    //logger.log(rv);
    return {
      address: rv[1].trim(),
      city: rv[2].trim(),
      postal_code: rv[3].trim(),
      country: 'US'
    }
  }
}


function _parseStreetAddressUSNoCityNoState(txt) {
  const rv = /^ *([0-9][^,]+) +([0-9]{5}) *$/.exec(txt);

  if(rv) {
    //logger.log(rv);
    return {
      address: rv[1].trim(),
      postal_code: rv[2].trim(),
      country: 'US'
    }
  }
}

function _parseStreetAddressCanadaCityProvince(txt) {
  const res = [
    /^ *(#?[0-9].+), *([^,]+)[, ]+(NL|PE|NS|NB|QC|ON|MB|SK|AB|BC|YT|NT|NU|Newfoundland|Newfoundland and Labrador|PEI|Prince Edward Island|Nova Scotia|Quebec|Ontario|Manitoba|Saskatchewan|Alberta|British Columbia|Yukon|Northwest Territories|Nunavut|Que|Ont|Man|Alta|Alb|Sask)\b[, ]+([A-Za-z][0-9][A-Za-z] *[0-9][A-Za-z][0-9]).*$/,
    /^ *(#?[0-9].+)[, ]+?([^,]+)[, ]+(NL|PE|NS|NB|QC|ON|MB|SK|AB|BC|YT|NT|NU|Newfoundland|Newfoundland and Labrador|PEI|Prince Edward Island|Nova Scotia|Quebec|Ontario|Manitoba|Saskatchewan|Alberta|British Columbia|Yukon|Northwest Territories|Nunavut|Que|Ont|Man|Alta|Alb|Sask)\b[, ]+([A-Za-z][0-9][A-Za-z] *[0-9][A-Za-z][0-9]).*$/,
  ];

  if(/T3P/i.exec(txt)) {
    logger.log('!!! ' + txt);
  }
  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv) {
      var state = rv[3];

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
        city: rv[2].trim(),
        state: state.trim(),
        postal_code: rv[4].trim().replace(/ /g, ''),
        country: 'CA'
      }
    }
  }
}


function _parseStreetAddressCanadaCityNoProvince(txt) {
  const rv = /^ *([0-9].+?),? +([A-Za-z][0-9][A-Za-z] *[0-9][A-Za-z][0-9]).*$/.exec(txt);

  if(rv) {
    return {
      address: rv[1].trim(),
      postal_code: rv[2].trim().replace(/ /g, ''),
      country: 'CA'
    }
  }
}

function validAddress(rv) {
  if(!rv)
    return;

  const address = rv['address'];
  const city = rv['city'];

  if(!address)
    return;

  if(address[0] == '0')
    return;

  // does the address look like a price?
  if(/[0-9]{2},[0-9]{3}/.exec(address))
    return;

  if(/^[0-9 ,#-]+$/.exec(address))
    return;

  // does it look like a state + zip?
  if(/\b[A-Z][A-Z] [0-9]{5}\b/.exec(address))
    return;

  // is it just numbers?
  if(/^[0-9]+$/.exec(address))
    return;

  // or a number of beds?
  if(/[0-9] *beds|[0-9] BR /.exec(address))
    return;

  // or sqft?
  if(/sqft|for sale/i.exec(address))
    return;

  if(/Mobile Home/i.exec(address))
    return;

  if(/[0-9]+\s*photo/i.exec(address))
    return;

  // If we have what looks a lot like a bland promotional statement, we probably
  // parsed badly.
  if(address.indexOf(' is a ') >= 0 || address.indexOf('market value') >= 0 || (city && city.indexOf('is a ') >= 0))
    return;

  if(/under contract|\?/i.exec(address))
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

function parseLocationBlock(el) {
  function sel(css) {
    const rv = el.querySelectorAll(css);
    if(rv.length == 1)
      return rv[0];
  }

  const _location = sel('.q-location');
  const _address = sel('.q-address + *');
  const _city = sel('.q-city + *');
  const _province = sel('.q-province-state + *');
  const _zip = sel('.q-postal-zip-code + *');
  if(!(_location && _address && _city && _province && _zip))
    return;

  const address = innerText(_address);
  const city = innerText(_city);
  const province = innerText(_province);
  const zip = innerText(_zip);

  if(/^ *[A-Z][0-9][A-Z] *[0-9][A-Z][0-9] *$/i.exec(zip) && _caProvinceToAbbrev[province.toUpperCase()]) {
    return {
      address: address,
      city: city,
      state: _caProvinceToAbbrev[province.toUpperCase()],
      postal_code: zip.toUpperCase().replace(/ /g, ''),
      country: 'CA'
    }
  }
}

function stripPriceAndParentheticals(txt) {
  return txt
    .replace(/^\s*\$[0-9][0-9,]+[\s,]*/, '')
    .replace(/\(AKA [^)]+\)/g, '')
    .replace(/\& Tax Key.*/g, '')
}

function _parseStreetAddressFromProse(txt) {
  // "123 Foo Rd is a $279,000, 3 bedroom, 2.0 bath home on a 0.25 acre lot located in Easton, MD."
  const re = [
    /^\s*([1-9][^,]+) is a\s*, [0-9]{1,2} bedroom, [0-9]{1,2}[0-9.]* bath home on a [0-9.]{1,4} acre lot located in ([A-Z][^,]+), ([A-Z][A-Z])\.\s*$/,
    /^\s*([1-9][^,]+) is a \$[0-9,]+, [0-9,]{3,6} square foot, [0-9]{1,2} bedroom, [0-9]{1,2}[0-9.]* bath home on a [0-9.]{1,4} acre lot located in ([A-Z][^,]+), ([A-Z][A-Z])\.\s*$/,
    /^\s*([1-9][^,]+) is a\s*home located in ([A-Z][^,]+), ([A-Z][A-Z])\.\s*$/,
  ];

  for(var i = 0; i < re.length; i++) {
    const rv = re[i].exec(txt);
    if(rv) {
      return {
        address: rv[1],
        city: rv[2],
        state: rv[3],
        country: _usStateToAbbrev[rv[3]] ? 'US' : 'CA'
      }
    }
  }
}

function parseStreetAddress(el) {
//  logger.log('parseStreetAddress: ' + innerText(el));
  if(el.parsedStreetAddress !== undefined)
    return el.parsedStreetAddress;

  const priceRe = /\$[1-9][0-9]{1,2},[0-9]{3},[0-9]{3}|\$[1-9][0-9]{1,2},[0-9]{3}/g;
  const plainText = stripPriceAndParentheticals(innerText(el).replace(priceRe, ''));
  const commaForBR = stripPriceAndParentheticals(innerText(el, {'BR': ', '}, 'br').replace(priceRe, ''));
  // This should maybe just be for all block elements? Meh.
  const commaForBRAndHeaders = stripPriceAndParentheticals(innerText(el, {'BR': ', ', 'H1': ', ', 'H2': ', ', 'H3': ', ', 'H4': ', ', 'H5': ', ', 'H6': ', ', 'TR': ',', 'SPAN': ',', 'DIV': ',', 'P': ','}, 'br+headers').replace(priceRe, ''));

  const fs = [];
  if(el.possibleZip) {
    fs.push(_parseStreetAddressUSFull);
    fs.push(_parseStreetAddressStateZip);
    fs.push(_parseStreetAddressUSNoCityNoState);
    fs.push(_parseStreetAddressUSCityNoState);
  }

  if(el.possiblePostalCode) {
    fs.push(_parseStreetAddressCanadaCityProvince);
    fs.push(_parseStreetAddressCanadaCityNoProvince);
  }

  fs.push(_parseStreetAddressUSCityStateNoPostal);
  fs.push(_parseStreetAddressNoStateNoCountryNoPostal);
  fs.push(_parseStreetAddressCanadaCityStateNoPostal);
  fs.push(_parseStreetAddressStateNoPostalMaybeCity);
//  fs.push(_parseStreetAddressFromProse);

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
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^ *([0-9]{1,2}) *bed\(?s?\)? *$/i,
    /^ *([0-9]{1,2}) *bed\s*beds *$/i,
    /\bbedrooms: *([0-9]{1,2})\b/i,
    /\bbeds: *([0-9]{1,2})\b/i,
    /^ *([0-9]{1,2}) *beds? *. *[0-9]{1,2} *baths? *$/i,
    / ([0-9]{1,2}) *beds? *\| *[0-9]{1,2} *baths? */i,
    /^ *([0-9]{1,2}) *bedrooms? *. *[0-9]{1,2} *bathrooms? */i,
    /^ *([0-9]{1,2}) *bedrooms? *. *[0-9]{1,2}[.0-9]{0,2} *baths? */i,
    /^ *([0-9]{1,2}) *bds?[ ,]*$/i,
    /^ *beds *([0-9]{1,2}) *$/i,
    /^ *bedrooms? *([0-9]{1,2}) *$/i,
    /^ *([0-9]{1,2}) * bedrooms? *$/i,
    /^ *([0-9]{1,2}) *br *\/ * [0-9]{1,2} *ba /i,
    /^ *([0-9]{1,2}) Bed, [0-9.]+ Bath \([0-9] Full Bath\), [0-9]{1,2},[0-9]{3} sqft */i,
    /^ *([0-9]{1,2})\s*bed *s?\s*[ ,|]\s*[0-9]\s*bath *s?\s*[ ,|]\s*[0-9,]+\s*sq\s*ft/i,
    /^ *([0-9]{1,2})\s*bed *s?\s*[ ,|]\s*[0-9]\.[0-9]\s*bath *s?\s*[ ,|]\s*[0-9,]+\s*sq\s*ft/i,
    /^ *bed ([0-9]{1,2})\s*$/i,
    /^ *([0-9]{1,2})\s* br *, [0-9]+\s*full ba$/i,
    /^ *\$ *[0-9,]{3,10} *([0-9]{1,2})\s* beds, *[0-9]{1,2}\s*full ba/i,
    /^ *([0-9]{1,2}) *lit\(?s?\)?\s*,?\s*[0-9.]+ *salles? de bain *$/i,
    /^ *([0-9]{1,2}) beds - [0-9]{1,2}[.0-9]{0,2} baths - [0-9]{3,4} * sqft *$/i,
    /^ *([0-9]{1,2}) beds? *,? *[0-9]{1,2} full *,? *[0-9]{1,2} *half baths? *$/i,
    /^ *([0-9]{1,2}) beds? *,? *[0-9]{1,2} full baths? *$/i,
    /([0-9]{1,2})\s+Beds,\s+[0-9]{1,2}\s+Baths/i,
    /([0-9]{1,2})\s+Beds,\s+[0-9]{1,2}\s+Full Baths/i,
    /([0-9]{1,2})\s+bedrooms and\s+[0-9]{1,2}\s+Full Baths/i,
    /^ *([0-9]{1,2})\s+beds?\s*\|\s*[0-9]{1,2}\.[0-9]+\s+Baths?\s*$/i,
    /^ *Bed\s*:\s*([0-9]{1,2})\s*$/i,
    /^\s*([0-9]{1,2})\s*BR\s*[,•]\s*[0-9]{1,2}(\.[0-9])*\s*BA\s*[,•]\s*[0-9]{3,5}\s*sq\.? ?ft\.?\s*$/i,
    /^\s*([0-9]{1,2})\s*BR\s*[,•]*\s*[0-9]{1,2}(\.[0-9])*\s*BA\s*$/i,
    /^\s*[1-9].+ is a \$[0-9,]+, ([0-9]) bedroom, [0-9][0-9.]* bath home on a [0-9.]{1,4} acre lot located in [A-Z][^,]+, [A-Z][A-Z]\.\s*$/,
    /^ *([0-9])\s*Beds,?\s*[0-9]\s*Bath Areas\s*[0-9,]{3,6}\s*SqFt\s*$/i,
    /\s*Bed:\s*([0-9])\s*Bath:\s*[0-9]+\/[0-9]\s*Sqft:\s*[0-9,]{3,6}\s*/i,
    /\s*([0-9]) bedrooms, [0-9] baths, [0-9,]{3,6} sq\.ft/i,
    /\s*([0-9]) bedroom [^,.:]{5,15} with [0-9] full baths/i,
    /\s*([0-9]) bedrooms?\s*,\s*\$[1-9][0-9,]+\b/i,
    /^\s*([0-9]) bed,\s*[0-9]+[0-9.]* full bath\./i,
    /^\s*([0-9]) bed,\s*[0-9]+[0-9.]* full bath, [0-9]+ half bath/i,
    // 4 bed, 4 full bath, 1 half bath
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

function hasNumber(el) {
  if(el.hasNumber === true || el.hasNumber === false)
    return el.hasNumber;

  el.hasNumber = !!(/[0-9]/.exec(innerText(el)));
  return el.hasNumber;
}

function parseBaths(el) {
  if(!hasNumber(el))
    return;
  const txt = innerText(el);

  if(/1\/2 Bathrooms:/.exec(txt)) {
    return;
  }

  const dangerous = /([0-9]{1,2})\/[1-35-9] Bath/i; // avoid capturing "3/4" baths, which usually means something else

  const maybeHalf1 = /\bbathrooms: *([0-9]{1,2})\b/i;
  const maybeHalf2 = /\bbaths: *([0-9]{1,2})\b/i;

  const res = [
    /^ *([0-9]{1,2}) *baths? *$/i,
    maybeHalf1,
    maybeHalf2,
    /^\s*Baths\s*:? ([0-9]{1,2})\s*full/i,
    /^\s*([0-9]{1,2})\s*full\s*&\s*[0-9]{1,2}\s*half bath\(?s?\)?\s*$/i,
    /^ *[0-9]{1,2} *beds? *. *([0-9]{1,2}) *baths? *$/i,
    /^ *[0-9]{1,2} *beds? *. *([0-9]{1,2}) *baths? *,/i,
    /^ *[0-9]{1,2} *bedrooms? *. *([0-9]{1,2}) *bathrooms? */i,
    /^ *[0-9]{1,2} *bedrooms? *. *([0-9]{1,2})[.0-9]{0,2} *baths? */i,
    /^ *([0-9]{1,2}) total bath\(?s?\)? *$/i,
    /^ *([0-9]{1,2}) *ba *$/i,
    /^ *([0-9]{1,2}) *full *ba *$/i,
    /^ *([0-9]{1,2})\.[0-9] *ba *$/i,
    /^ *baths *([0-9]{1,2}) *$/i,
    /^ *baths *([0-9]{1,2})\.[0-9]+ *$/i,
    /^ *bathrooms? *([0-9]{1,2}) *$/i,
    /^ *baths *([0-9]{1,2}) *full *$/i,
    /^ *[0-9]{1,2} *br *\/ *([0-9]{1,2}) *ba /i,
    /^ *([0-9]{1,2}) * bathrooms? *$/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*[ ,|]\s*([0-9])\s*bath *s?\s*[ ,|]\s*[0-9,]+\s*sq\s*ft/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*[ ,|]\s*([0-9])\.[0-9]\s*bath *s?\s*[ ,|]\s*[0-9,]+\s*sq\s*ft/i,
    /^ *bathrooms *([0-9])\/[0-9]+ *$/i,
    /^ *([0-9]{1,2}) *full *baths? *$/i,
    /^ *[0-9]{1,2}\s* br *, ([0-9]+)\s*full ba$/i,
    /^ *\$ *[0-9,]{3,10} *[0-9]{1,2}\s* beds, *([0-9]{1,2})\s*full ba/i,
    /^ *full *bathrooms *:? *([0-9]) *$/i,
    /^ *([0-9]{1,2})\/[0-9] *Full\/Half *Baths *$/i,
    /^ *[0-9]{1,2} *lit\(?s?\)?\s*,?\s*([0-9]+)[.0-9]*? *salles? de bain *$/i,
    /^ *([0-9]{1,2}) full *bathrooms *,? *[0-9]{1,2} * half bathrooms *$/i,
    /^ *([0-9]{1,2}) *full *\/ *[0-9]{1,2} *half bathrooms *$/i,
    /^ *([0-9]{1,2}) *full *, *[0-9]{1,2} *partial baths *$/i,
    / [0-9]{1,2} *beds? *\| *([0-9]{1,2}) *½? *baths? */i,
    /^ *[0-9]{1,2} beds - ([0-9]{1,2})[.0-9]{0,2} baths - [0-9]{3,4} * sqft *$/i,
    /^ *full *bath\(?s?\)? *([0-9]{1,2}) *$/i,
    /^ *[0-9]{1,2} beds? *,? *([0-9]{1,2}) full *,? *[0-9]{1,2} *half baths? *$/i,
    /^ *[0-9]{1,2} beds? *,? *([0-9]{1,2}) full baths? *$/i,
    /^ *([0-9]{1,2}) full *,? *[0-9]{1,2} *half bat?h?s? *$/i,
    /[0-9]{1,2}\s+Beds,\s+([0-9]{1,2})\s+Baths/i,
    /[0-9]{1,2}\s+Beds,\s+([0-9]{1,2})\s+Full Baths/i,
    /[0-9]{1,2}\s+Beds,?\s+([0-9]{1,2})\.[0-9]+\s+Baths/i,
    /[0-9]{1,2}\s+bedrooms and\s+([0-9]{1,2})\s+Full Baths/i,
    /^ *[0-9]{1,2}\s+beds?\s*\|\s*([0-9]{1,2})\.[0-9]+\s+Baths?\s*$/i,
    /^ *Baths\s*([0-9]{1,2})\s*\(full\)\s*$/i,
    /^ *Bath\(Full\)\s*:\s*([0-9]{1,2})\s*$/i,
    /^\s*[0-9]{1,2}\s*BR\s*[,•]\s*([0-9]{1,2})(\.[0-9])*\s*BA\s*[,•]\s*[0-9]{3,5}\s*sq\.? ?ft\.?\s*$/i,
    /^\s*[0-9]{1,2}\s*BR\s*[,•]\s*([0-9]{1,2})(\.[0-9])*\s*BA\s*$/i,
    /^\s*Bathrooms\s*([0-9]{1,2}) Full,\s*[0-9]\s*Half\s*$/i,
    /^\s*[1-9].+ is a \$[0-9,]+, [0-9] bedroom, ([0-9]{1,2})[0-9.]* bath home on a [0-9.]{1,4} acre lot located in [A-Z][^,]+, [A-Z][A-Z]\.\s*$/,
    /^ *Baths\s*([0-9]{1,2})\s*-0\s*$/i,
    /^ *([0-9]{1,2})\s*full bathrooms\s*$/i,
    /^ *[0-9]\s*Beds,?\s*([0-9])\s*Bath Areas\s*[0-9,]{3,6}\s*SqFt\s*$/i,
    /\s*Bed:\s*[0-9]\s*Bath:\s*([0-9]+)\/[0-9]\s*Sqft:\s*[0-9,]{3,6}\s*/i,
    /\s*[0-9] bedrooms, ([0-9]) baths, [0-9,]{3,6} sq\.ft/i,
    /\s*[0-9] bedroom [^,.:]{5,15} with ([0-9]) full baths/i,
    /^\s*([0-9]{1,2})\.[0-9] baths?\s*$/i,
    /^\s*bath full\s*([0-9]{1,2})\s*$/i,
    /^\s*([0-9]{1,2})\s*full baths?\s*,\s*[0-9]{1,2}\s*half\s*baths?\s*$/i,
    /^\s*[0-9] bed,\s*([0-9]+)[0-9.]* full bath\./i,
    /^\s*[0-9] bed,\s*([0-9]+)[0-9.]* full bath, [0-9]+ half bath/i,
    /^\s*Bathrooms\s*([0-9])\s*Full\s*$/i,
    dangerous,
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);
    if(rv) {
      if(re == dangerous && /1\/2\s*bath/.exec(txt))
        continue;

      if((re == maybeHalf1 || re == maybeHalf2) && /half bath/i.exec(txt))
        continue;
      //logger.log(re);
      //logger.log('baths: ' + rv[1]);
      //logger.log(txt);
      return {
        baths: parseInt(rv[1], 10)
      }
    }
  }
}

function parseHalfBaths(el) {
  if(!hasNumber(el))
    return;
  const txt = innerText(el);

  const dangerous = /[0-9]{1,2}\/([1-35-9]) Bath/i; // avoid 3/4
  const res = [
    / *1\/2 Bathrooms?:?\s*([0-9]{1,2}) */i,
    /^ *([0-9]{1,2}) *half bath\(?s?\)? *$/i,
    /& *([0-9]{1,2}) *half bath\(?s?\)? *$/i,
    /^ *Bathrooms: *[0-9]* *\(? *full *\)? *([0-9]{1,2}) *\(? *half *\)? *$/i,
    /^ *Full: *[0-9]+ *\/ *Half: *([0-9]{1,2}) *$/i,
    /^ *\$ *[0-9,]{3,10} *[0-9]{1,2}\s* beds, *[0-9]{1,2}\s*full ba, *([0-9]) *½ *ba/i,
    /^ *half *bathrooms *:? *([0-9]) *$/i,
    /^ *[0-9]{1,2}\/([0-9]) *Full\/Half *Baths *$/i,
    /^ *[0-9]{1,2} full *bathrooms *,? *([0-9]{1,2}) * half bathrooms *$/i,
    /^ *[0-9]{1,2} *full *\/ *([0-9]{1,2}) *half bathrooms *$/i,
    /^ *[0-9]{1,2} *full *, *([0-9]{1,2}) *partial baths *$/i,
    /^ *[0-9]{1,2} beds? *,? *[0-9]{1,2} full *,? *([0-9]{1,2}) *half baths? *$/i,
    /^ *[0-9]{1,2} full *,? *([0-9]{1,2}) *half bat?h?s? *$/i,
    /^ *Bath\(Half\)\s*:\s*([0-9]{1,2})\s*$/i,
    /^\s*Bathrooms\s*[0-9]{1,2} Full,\s*([0-9])\s*Half\s*$/i,
    dangerous,
    /^\s*[0-9]{1,2}\.([1-4]) baths?\s*$/i,
    /^\s*([0-9]{1,2})\s*partial baths?\s*$/i,
    /^\s*[0-9]{1,2}\s*full baths?\s*,\s*([0-9]{1,2})\s*half\s*baths?\s*$/i,
    /^\s*[0-9] bed,\s*[0-9]+[0-9.]* full bath, ([0-9]+) half bath/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const re = res[i];
    const rv = re.exec(txt);
    if(rv) {
      if(re == dangerous && /1\/2\s*bath/.exec(txt))
        continue;

      //logger.log(re);
      //logger.log('half baths: ' + rv[1]);
      //logger.log(txt);

      return {
        half_baths: parseInt(rv[1], 10)
      }
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
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^[ -]*MLS *#?:? *([A-Z]{0,2}[0-9]{5,13}) *$/,
    /^ *MLS *Number:? *([A-Z]{0,2}[0-9]{5,13}) *$/,
    /^\s*MLS\s*®\s*Number *:? *([A-Z]{0,2}[0-9]{5,13})\s*$/i,
    /^ *ID *# *:? *([A-Z]{0,2}[0-9]{5,13}) *$/,
    /\| *MLS *#?:? *([A-Z]{0,2}[0-9]{5,13}) *\|/,
    /^ *#:? *([A-Z]{0,2}[0-9]{5,13}) *$/,
    /^\s*MLS\s*®\s*([A-Z]{0,2}[0-9]{5,13})\s*$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);
    if(rv)
      return {
        external_id: rv[1]
      }
  }
}

function parseSqft(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^ *([0-9]{1,2},? *[0-9]{3}) *squ?a?r?e?\.? ?fe?e?o?o?t[. ]*$/i,
    /^ *([0-9]{3}) *squ?a?r?e?\.? ?fe?e?o?o?t[. ]*$/i,
    /^ *square feet:? *([0-9]{1,2},[0-9]{3}) *$/i,
    /^ *square feet:? *([0-9]{3}) *$/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*,\s*[0-9]\s*bath *s?\s*,\s*([0-9]{1,2},[0-9]{3})+\s*sq\s*ft/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*,\s*[0-9]\s*bath *s?\s*,\s*([0-9]{3})+\s*sq\s*ft/i,
    /^ *[0-9]{1,2} Bed, [0-9.]+ Bath \([0-9] Full Bath\), ([0-9]{1,2},[0-9]{3}) sqft */i,
    /^ *[0-9]{1,2}\s*bed *s?\s*[,|]\s*[0-9]\s*bath *s?\s*[,|]\s*([0-9,]+)\s*sq\s*ft/i,
    /^ *[0-9]{1,2}\s*bed *s?\s*[,|]\s*[0-9]\.[0-9]\s*bath *s?\s*[,|]\s*([0-9,]+)\s*sq\s*ft/i,
    /^ *sq\.? *ft\.?:? ([0-9,]{3,5})\s*$/i,
    /^ *([0-9,]{3,6}) pieds carr.{0,2}s\s*$/i,
    /^ *home size: ([0-9,]{3,6})\s*sq\s*ft\s*$/i,
    /^ *([0-9,]{3,6}) sq ft; lot: [0-9.]+ acres *$/i,
    /^ *[0-9]{1,2} beds - [0-9]{1,2}[.0-9]{0,2} baths - ([0-9]{3,4}) * sqft *$/i,
    /^\s*([0-9,]{3,6})\s*sqft\s*lot\s*[0-9. ]+\s*acr?e?s?\s*$/i,
    /^\s*([0-9,]{3,6})\s*sqft\s*lot\s*[0-9,]+\s*sq *ft\s*$/i,
    /^\s*[0-9]{1,2} BR, [0-9]{1,2}\.?[0-9]* BA, ([0-9]{3,5}) sq ?ft\s*$/i,
    /^ *[0-9]\s*Beds,?\s*[0-9]\s*Bath Areas\s*([0-9,]{3,6})\s*SqFt\s*$/i,
    /\s*Bed:\s*[0-9]\s*Bath:\s*[0-9]+\/[0-9]\s*Sqft:\s*([0-9,]{3,6})\s*/i,
    /^\s*[1-9][^,]+ is a \$[0-9,]+, ([0-9,]{3,6}) square foot, [0-9]{1,2} bedroom, [0-9]{1,2}[0-9.]* bath home on a [0-9.]{1,4} acre lot located in [A-Z][^,]+, [A-Z][A-Z]\.\s*$/,
    /\s*[0-9] bedrooms, [0-9] baths, ([0-9,]{3,6}) sq\.ft/i,
    /\s*Bedrooms:\s*[0-9]+\s*Baths:\s*[0-9]+\s*sq\.?\s*fe*t:\s*([0-9,]{3,6})\s*$/i
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
  if(!hasNumber(el))
    return;

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
    if(!hasNumber(el) || innerText(el).indexOf('$') < 0)
      return;

    const txt = innerText(el);
    const rv = extractPriceFromString(txt);

    function likelyPrice() {
      const res = [
        /This property[^.]+priced at \$/,
        /home was sold for \$/,
        /currently listed at \$/,
      ];

      for(var i = 0; i < res.length; i++) {
        if(res[i].exec(txt))
          return true;
      }
      return false;
    }

    // Be conservative in our willingness to extract a price from a chunk of prose.
    if(rv && (txt.length < 80 || likelyPrice())) {
      return {
        [field]: rv
      }
    }
  }
}

function parseListingDate(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^ *listed *: *(.+) *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);
    if(rv) {
      const listingDate = extractDateFromString(rv[1]);

      if(listingDate)
        return {listing_date: listingDate};
    }
  }
}

function parseSoldDate(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^ *date sold *: *(.+) *$/i,
    /^ *sold *:? *(.+) *$/i,
    /^ *sold *- *(.+) *$/i,
    /^[( ]*sold on *(.+?)[ )]*$/i,
    /^[( ]*sold on *(.+?)[ )]*for \$[0-9,]+\s*$/i,
    /^ *sold for *:? *\$ *[0-9,]* *on ([0-9/ -]+?) *$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);
    if(rv) {
      const soldDate = extractDateFromString(rv[1]);

      if(soldDate)
        return {sold_date: soldDate};
    }
  }
}

function parseSoldPrice(el) {
  if(!hasNumber(el) || innerText(el).indexOf('$') < 0)
    return;

  const txt = innerText(el);
  const res = [
    /^ *SOLD: *(\$ *[0-9,]*) *$/,
    /^ *sold for *:? *(\$ *[0-9,]*) *$/i,
    /^ *sold for *:? *(\$ *[0-9,]*) *on [0-9/ -]+$/i,
    /^ *sold on [0-9/ -]* for *(\$ *[0-9,]*) *$/i,
    /^ *sale price *:? *(\$ *[0-9,]+) *$/i,
    /^ *(\$ *[0-9,]+) *sale price *$/i,
    /^ *(\$ *[0-9,]+) *\(?sold price\)? *$/i,
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
    /\$ *([0-9]{1,3},? *[0-9]{3}, *[0-9]{3})/g,
    /\$ *([0-9]{2,3},? *[0-9]{3})/g
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
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const rv = /^[ :]*([0-9]{5}) *$/.exec(txt);

  if(rv)
    return {
      postal_code: rv[1],
      country: 'US'
    }
}

function extractZipAfterCounty(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const rv = /^\s*[A-za-z ]+,\s*([0-9]{5}) *$/.exec(txt);

  if(rv)
    return {
      postal_code: rv[1],
      country: 'US'
    }
}

function sqft2acres(sqft) {
  return sqft * 0.000022956841138040226540538088;
}

function parseLotSize(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^ *lot size *:? *([0-9]{1,2}[ ,]*[0-9]{3}) *sq *ft$/i,
    /\blot *: *([0-9]{1,2}[ ,]*[0-9]{3}) *sq *ft$/i,
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(txt);

    if(rv)
      return {
        lot_size: sqft2acres(parseInt(rv[1].replace(/[ ,]+/g, ''), 10))
      }
  }
}

function extractLotSizeFromSquareFeet(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const res = [
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *$/,
    /^[ :]*([0-9]{1,2}[ ,]*[0-9]{3}) *sq\.?u?a?r?e? *f?e?e?t *$/i,
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
  if(!hasNumber(el))
    return;

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
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const rv = /^[ :]*#? *([A-Z]{0,2}[0-9]{5,}) *$/.exec(txt);

  if(rv)
    return {
      external_id: rv[1]
    }
}

function extractCity(el) {
  const txt = innerText(el);
  const rv = /^\s*([A-Z][A-Za-z ]+)\s*$/.exec(txt);

  if(rv)
    return {
      city: rv[1]
    }
}

function extractBedsBathsHalfBaths(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const rv = /^\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(txt);
  if(rv) {
    return {
      beds: parseInt(rv[1], 10),
      baths: parseInt(rv[2], 10),
      half_baths: parseInt(rv[3], 10)
      }
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

function extractBaths(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);
  const rv = /^[ :]*([0-9]) *full\s*$/.exec(txt);
  if(rv)
    return {baths: parseInt(rv[1], 10)}
}


function extractIntegerFromFloat(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = /^[ :]*([0-9]+)\.[0-9] *$/.exec(txt);
    if(rv)
      return {[field]: parseInt(rv[1], 10)}
  }
}


export function extractDateFromString(txt) {
  const rv = /^[ :]*([0-9]{1,4})[/-]([0-9]{1,2})[/-]([0-9]{1,4}) *$/.exec(txt);
  if(rv) {
    const a = parseInt(rv[1], 10);
    const b = parseInt(rv[2], 10);
    const c = parseInt(rv[3], 10);

    if(a >= 1850 && a <= 2050 && b >= 1 && b <= 12 && c >= 1 && c <= 31)
      return `${a}-${b}-${c}`;

    if(c >= 1850 && c <= 2050 && a >= 1 && a <= 12 && b >= 1 && b <= 31)
      return `${c}-${a}-${b}`;

    if(c >= 10 && c <= 30 && a >= 1 && a <= 12 && b >= 1 && b <= 31)
      return `${2000 + c}-${a}-${b}`;
  }

  const rv2 = /^ *(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December) ([0-9]{1,2}) *,? *([0-9]{4}) *$/.exec(txt);
  if(rv2) {
    const [_, _month, _day, _year] = rv2;
    const day = parseInt(_day, 10);
    const year = parseInt(_year, 10);

    var month = 1;
    if(/Feb/.exec(_month)) month = 2;
    if(/Mar/.exec(_month)) month = 3;
    if(/Apr/.exec(_month)) month = 4;
    if(/May/.exec(_month)) month = 5;
    if(/Jun/.exec(_month)) month = 6;
    if(/Jul/.exec(_month)) month = 7;
    if(/Aug/.exec(_month)) month = 8;
    if(/Sep/.exec(_month)) month = 9;
    if(/Oct/.exec(_month)) month = 10;
    if(/Nov/.exec(_month)) month = 11;
    if(/Dec/.exec(_month)) month = 12;

    if(year >= 1850 && year <= 2050 && day >= 1 && day <= 31)
      return `${year}-${month}-${day}`;
  }
}

function extractDate(field) {
  return function(el) {
    const txt = innerText(el);
    const rv = extractDateFromString(txt);
    if(rv)
      return {[field]: rv};
  }
}

function parseYearBuilt(el) {
  if(!hasNumber(el))
    return;

  const txt = innerText(el);

  const res = [
    /^ *([0-9]{4}) *year built *$/i,
    /^ *year built *([0-9]{4}) *$/i,
    /^ *([0-9]{4}) *built *$/i,
    /^ *.{0,3}built in:? *([0-9]{4}) *$/i,
    /^ *year built *:? *([0-9]{4}) *$/i,
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
    if(!hasNumber(el))
      return;

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

function expandLinkToPostalCode(el, listing) {
  const { address, city, state, postal_code } = listing;
  if(!address || !city || !state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const txt = innerText(el);

  const addressSlug = address.toLowerCase().replace(city.toLowerCase(), '').trim().replace(/[^a-z0-9]/g, '-');
  const citySlug = city.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');

  const res = [
    new RegExp(addressSlug + '-' + citySlug + '-' + state + '-([0-9]{5})\.html', 'i'),
    new RegExp(addressSlug + '-' + citySlug + '-' + state + '-([a-z][0-9][a-z]-?[0-9][a-z][0-9])$', 'i'),
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      return {
        postal_code: rv[1].toUpperCase().replace(/-/g, '')
      }
    }
  }
}

function expandLinkToPostalCodeAndProvince(el, listing) {
  const { address, city, state, postal_code } = listing;
  if(!address || !city || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const addressSlug = address.toLowerCase().replace(city.toLowerCase(), '').trim().replace(/[^a-z0-9]/g, '-');
  const citySlug = city.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');

  const res = [
    new RegExp(addressSlug + '-' + citySlug + '-(' + _caProvinceAlternation + ')-([a-z][0-9][a-z]-?[0-9][a-z][0-9])/?$', 'i'),
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      return {
        state: _caProvinceToAbbrev[rv[1].toUpperCase()],
        postal_code: rv[2].toUpperCase().replace(/-/g, ''),
        country: 'CA',
      }
    }
  }
}

function expandLinkToProvince(el, listing) {
  const { address, city, state, postal_code } = listing;
  if(!address || !city || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const citySlug = city.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');

  const res = [
    new RegExp('/(' + _caProvinceAlternation + ')/' + citySlug + '/', 'i'),
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      return {
        state: _caProvinceToAbbrev[rv[1].toUpperCase()],
        country: 'CA'
      }
    }
  }
}

function expandLinkToState(el, listing) {
  const { address, city, state } = listing;
  if(!address || !city || state)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const addressSlug = address.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
  const citySlug = city.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');

  const res = [
    new RegExp('/' + addressSlug + '-' + citySlug + '-(' + _caProvinceAlternation.replace(/ /g, '-') + '|' + _usStateAlternation.replace(/ /g, '-') + ')/?$', 'i'),
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      if(logger.enabled()) {
        logger.log('!!!');
        logger.log(rv);
      }
      if(_caProvinceToAbbrev[rv[1].toUpperCase()]) {
        return {
          state: _caProvinceToAbbrev[rv[1].toUpperCase()],
          country: 'CA'
        }
      } else {
        return {
          state: _usStateToAbbrev[rv[1].toUpperCase()],
          country: 'US'
        }
      }
    }
  }
}


function expandLinkToPostalCodeWhenAddress(el, listing) {
  const { price, address, city, state, postal_code } = listing;
  if(!price || !address || city || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const res = [
    new RegExp('yahoo.com/py/maps.py.*csz=([A-Z][0-9][A-Z][0-9][A-Z][0-9])&')
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      return {
        postal_code: rv[1].toUpperCase(),
        country: 'CA'
      }
    }
  }
}

function expandLinkToAddressCityState(el, listing) {
  const { price, address, city, state, postal_code } = listing;
  if(!price || address || city || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const txt = innerText(el);

  const rvResult = /^ *\$ *([0-9,]{3,10}) *- *(.+)$/.exec(txt);
  if(!rvResult)
    return;

  var [_, maybePrice, maybeAddress] = rvResult;
  maybePrice = maybePrice.replace(/,/g, '');

  if(maybePrice != price)
    return;

  const addressSlug = maybeAddress.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

  const res = [
    new RegExp(addressSlug + '_([a-z_]+)_([a-z][a-z])_$', 'i'),
    new RegExp(addressSlug + '_([a-z_]+)_([a-z][a-z])_([0-9]{5})$', 'i')
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      const m = {
        address: maybeAddress.replace(/_/g, ' '),
        city: rv[1].replace(/_/g, ' '),
        state: rv[2].toUpperCase(),
        country: 'US'
      }

      if(rv[3])
        m['postal_code'] = rv[3];
      return m;
    }
  }
}

function expandLinkToFullAddress(el, listing) {
  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;


  //chicago-suburbs-west/downers-grove/home/4940-Seeley-Avenue,-Downers-Grove,-IL-60515/9690154/photos
  const maybeAddressCityStateZip = /^.+\/([0-9][^,]+),-([A-Z][^,]+),-([A-Z][A-Z])-([0-9]{5})\/.*$/.exec(href);

  if(!maybeAddressCityStateZip)
    return;

  const [_, address, city, state, zip] = maybeAddressCityStateZip;

  if(maybeAddressCityStateZip)
    return {
      address: address.replace(/-+/g, ' '),
      city: city.replace(/-+/g, ' '),
      state: state,
      postal_code: zip,
      country: 'US'
    };
}

function expandLinkToFullAddress2(el, listing) {
  const { external_id, address, state, postal_code } = listing;
  if(!external_id || address || state || postal_code)
    return;
  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  // /listing/C4192917-7812-churchill-dr-sw-calgary-alberta-t2v-2r9
  const re = new RegExp('/' + external_id.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-([1-9][a-z0-9-]+)-(' + _caProvinceAlternation + ')-([a-z][0-9][a-z]-?[0-9][a-z][0-9])/?$', 'i');
  const maybeAddressStateZip = re.exec(href);

  if(!maybeAddressStateZip)
    return;

  const [_, _address, _state, zip] = maybeAddressStateZip;

  if(maybeAddressStateZip)
    return {
      address: _address.replace(/-+/g, ' '),
      state: _caProvinceToAbbrev[_state.toUpperCase()],
      postal_code: zip.replace(/-/g, '').toUpperCase(),
      country: 'CA'
    };
}

function expandLinkToEntireListing(el, listing) {
  // Only accept very minimal listings to avoid contagion.
  const keys = Object.keys(listing);
  for(var i = 0; i < keys.length; i++)
    if(keys[i] != 'price' && keys[i] != 'baths' && keys[i] != 'beds' && keys[i] != 'half_baths')
      return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');
  const title = el.getAttribute('title');

  if(!href)
    return;

  if(!title)
    return;

  const maybeCityStateZip = /^.*property in ([A-Z][^,]+), *([A-Z][A-Z]),? *([0-9]{5}) *$/i.exec(title);

  if(!maybeCityStateZip)
    return;

  const [_, _city, _state, _zip] = maybeCityStateZip;

  const maybeAddress = new RegExp('/' + _city.replace(/[^a-z]+/ig, '_') + ',' + _state + '/([0-9]+_[^/]+)').exec(href);

  if(maybeAddress)
    return {
      address: maybeAddress[1].replace(/_+/g, ' '),
      city: _city,
      state: _state,
      postal_code: _zip,
      country: 'US'
    };
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
  const addressSlugNoApt = maybeAddress.toLowerCase().trim().replace(/[ ,]*#[0-9]+$/, '').replace(/[^a-z0-9]/g, '-');

  const res = [
    new RegExp('/' + addressSlug + '/([a-z-]+)/([a-z][a-z])/([0-9]{5}|[a-z][0-9][a-z]-?[0-9][a-z][0-9])/', 'i'),
    new RegExp(addressSlug + '-([a-z-]+)-([a-z][a-z])-([0-9]{5}|[a-z][0-9][a-z]-?[0-9][a-z][0-9])$', 'i'),
    new RegExp('/' + addressSlugNoApt + '/([a-z-]+)/([a-z][a-z])/([0-9]{5}|[a-z][0-9][a-z]-?[0-9][a-z][0-9])/', 'i'),
    new RegExp(addressSlugNoApt + '-([a-z-]+)-([a-z][a-z])-([0-9]{5}|[a-z][0-9][a-z]-?[0-9][a-z][0-9])$', 'i'),
    new RegExp('/' + addressSlug + '-([a-z-]+)-([a-z][a-z])-([0-9]{5})/mls', 'i'),
    new RegExp('/' + addressSlug + '-([a-z-]+)-([a-z][a-z])-([0-9]{5})/$', 'i'),
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      return {
        address: maybeAddress,
        city: rv[1],
        postal_code: rv[3].toUpperCase(),
        state: rv[2].toUpperCase(),
        country: parseInt(rv[3]) ? 'US' : 'CA'
      }
    }
  }
}

function expandLinkToAddressCityStatePostalCodeUnderscore(el, listing) {
  const { address, city, state, postal_code } = listing;
  if(address || city || state || postal_code)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  const maybeAddress = innerText(el);
  const addressSlug = maybeAddress.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

  if(addressSlug.length == 0)
    return;

  const res = [
    new RegExp('/' + addressSlug + '_([a-z_]+)_([a-z][a-z])_([0-9]{5})$', 'i'),
    new RegExp(addressSlug + '-([a-z_]+)-([a-z][a-z])-([0-9]{5})', 'i'),
  ];

  for(var i = 0; i < res.length; i++) {
    const rv = res[i].exec(href);
    if(rv) {
      return {
        address: maybeAddress,
        city: rv[1].replace(/_/g, ' '),
        postal_code: rv[3].toUpperCase(),
        state: rv[2].toUpperCase(),
        country: 'US'
      }
    }
  }
}
function expandAddressCityToStatePostalCode2(el, listing) {
  if(listing['state'] || listing['postal_code'] || !listing['address'] || !listing['city'])
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const href = el.getAttribute('href');

  if(!href)
    return;

  // be very aggressive: nuke non alphanumerics.
  const addressCitySlug = (listing['address'] + listing['city']).toLowerCase().replace(/[^a-z0-9]/g, '');
  const re = RegExp(addressCitySlug + '([a-z][a-z])([0-9]{5})$');

  const rv = re.exec(href.toLowerCase().replace(/[^a-z0-9]/g, ''));
  if(rv) {
    return {
      postal_code: rv[2],
      state: rv[1].toUpperCase(),
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

function expandCityStateToAddress(el, listing) {
  const { address, postal_code, city, state} = listing;
  if(address || postal_code || !city || !state)
    return;

  if(el.nodeType != 1 || el.nodeName.toUpperCase() != 'A')
    return;

  const txt = innerText(el).trim();
  const href = el.getAttribute('href');

  if(!href)
    return;

  const citySlug = city.toLowerCase().replace(/[^0-9a-z]/g, '[_-]*');
  const addressSlug = txt.toLowerCase().replace(/[^0-9a-z]/g, '[-_]*');
  const re = RegExp('/(' + _usStateAlternation.replace(/ /g, '[-_]') + '|' + _caProvinceAlternation.replace(/ /g, '[-_]') + ')/' + citySlug + '/' + addressSlug, 'i');

  const rv = re.exec(href);
  if(rv) {
    const maybeState = rv[1].toUpperCase().replace(/[-_]/g, ' ');
    if(_usStateToAbbrev[maybeState]) {
      return {
        address: txt,
        state: _usStateToAbbrev[maybeState],
        country: 'US'
      }
    } else {
      return {
        address: txt,
        state: _caProvinceToAbbrev[maybeState],
        country: 'CA'
      }
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
    ['.q-maintenance-charge-month + td', extractPrice('_condo_fee'), true],
    ['.q-association-fee + td', extractPrice('_association_fee'), true],
    ['.q-tax-amount + *', extractPrice('_tax_amount'), true],
    ['.q-total-mortgage + td', extractPrice('_mortgage'), true],
    ['.q-bc-assessment-2017 + span, .q-assessed-value + dd', extractPrice('_assessment'), true],

    ['.list-price, .q-list-price + div', extractPrice('price'), true],
    ['*', parseSoldDate],
    ['.close-price, .q-close-price + div, .q-sold-price + td, .q-sold-price + dd, .q-sale-price + span, .q-sale-price + strong, .q-sold-price + span', extractPrice('sold_price'), true],
    ['[title="Closing price"]', extractPrice('sold_price')],
    ['*', parseSoldPrice, true],
    ['*', extractPrice('price')],
    [STOP_IF_NO_PRICE, STOP_IF_NO_PRICE],
    ['*', parseYearBuilt],
    ['.q-lot-size + td, .q-lot-size + dd, .q-acres + span, .q-lot-size + span, .q-lot-dimensions + span', extractLotSizeFromSquareFeet, true],
    ['*', parseSqft],
    ['*', parseBeds],
    ['.q-bathrooms + span, .q-bathrooms + div, .q-bathrooms + dd, .q-full-bathrooms-number + td, .q-full-bathrooms + td, .q-full-baths + span, .q-baths + div, .yoarticon-bathtub + span, .featuredListingBathroom', extractDigit('baths'), true],
    ['.q-bathrooms + span, .q-bathrooms + div, .q-bathrooms + dd, .q-full-bathrooms-number + td, .q-full-bathrooms + td, .q-full-baths + span, .q-baths + div', extractBaths, true],
    ['.q-half-bathrooms + td, .q-half-bath + span, .q-3-4-baths + span, .q-half-baths + span, .q-half-bath + td', extractDigit('half_baths'), true],
    ['.q-bathrooms + span, .q-bathrooms + dd, .q-full-bathrooms-number + td, .q-full-bath + td, .q-baths + td', extractIntegerFromFloat('baths')],
    ['*', parseBaths],
    ['*', parseHalfBaths],
    ['*', parseMLS],
    ['a', parseMLSAndMLSId],
    ['*', parseLocationBlock],
    ['*', parseStreetAddress],
    ['*', parseCityState],
    ['*', parseAcres],
    ['*', parseLotSize],
    ['.q-town + span, .q-city + td', extractCity],
    ['.q-address + span, .q-address + td', parseAddressNoStateNoZip],
    ['.q-state + span, .q-province + td, .q-state + td', parseState],
    ['.q-postal-code + span, .q-postal-code + td', parsePostalCode],
    ['.q-city + span', extractTextNoComma('city')],
    ['.q-zip + span, .q-zip-code + span, .q-zipcode + td', extractZip],
    ['.q-county-zip + td', extractZipAfterCounty],
    ['.q-mls + span, .q-mls-num + dd, .q-mls-id + span, .q-listing-id + span, .q-mls-no + td', extractMLS],
    ['*', parseListingDate],
    ['.q-list-date + div, .q-date-listed + span', extractDate('listing_date')],
    ['.q-sold + span, .q-sale-date + span, .q-sold-date + *, .q-closing-date + dd', extractDate('sold_date')],
    ['.q-year-built + div, .q-yr-built + td, .q-year-built + dd, .q-built + span, .q-year-built + td, .q-year + span, .q-year-built + span, .q-built + div', extractYear('year_built')],
    ['.q-sq-feet + span, .q-square-ft + span, .q-sq-feet + td, .q-sq-ft + strong, .q-sq-ft + span, .q-fin-sqft + span, .q-square-feet + td, .q-square-feet + div, .q-living-sqft + dd, .q-bldg-sqft + td, .q-square-footage + td, .q-sq-footage + td, .q-square-feet + span, .q-square-footage + span, .q-building-square-feet + span, .q-approx-sq-ft + div, .q-apx-sqft + td', extractSquareFeet],
    ['.q-bedrooms + span, .q-beds + td, .q-bedrooms + dd, .q-bedrooms-number + td, .q-bedrooms + td, .q-bedrooms + div, .featuredListingBedroom', extractDigit('beds')],
    ['.q-bed-ba-ba + td', extractBedsBathsHalfBaths],
    [COLLATE, COLLATE],
    ['a', expandAddressCityToStatePostalCode],
    ['a', expandAddressCityToStatePostalCode2],
    ['a', expandCityStateToAddressPostalCode],
    ['a', expandCityStateToAddress],
    ['a', expandMLSAndMLSIdToAddressStatePostalCode],
    ['a', expandExternalIdCityToAddressStatePostalCode],
    ['a', expandLinkToAddressCityStatePostalCode],
    ['a', expandLinkToAddressCityStatePostalCodeUnderscore],
    ['a', expandLinkToAddressCityState],
    ['a', expandLinkToPostalCode],
    ['a', expandLinkToPostalCodeAndProvince],
    ['a', expandLinkToPostalCodeWhenAddress],
    ['a', expandLinkToEntireListing],
    ['a', expandLinkToFullAddress],
    ['a', expandLinkToFullAddress2],
    ['a', expandLinkToProvince],
    ['a', expandLinkToState],
  ]]
];

