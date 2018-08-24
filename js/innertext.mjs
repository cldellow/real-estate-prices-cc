export function innerText(el, subs, cacheKey) {
  cacheKey = cacheKey || '';
  if(el.hasInnerText && el.hasInnerText[cacheKey])
    return el.hasInnerText[cacheKey];

  if(el.nodeType == 1) {
    const rv = [];

    for(var i = 0; i < el.childNodes.length; i++) {
      const childNode = el.childNodes[i].nodeName;
      const sub = subs && subs[childNode];
      if(sub) rv.push(sub);
      rv.push(innerText(el.childNodes[i], subs, cacheKey));
      if(sub) rv.push(sub);
    }

    var ret = rv.join(' ').replace(/^ +| +$/g, '');
    if(!el.hasInnerText)
      el.hasInnerText = {};

    ret = ret.replace(/\u00A0/g, ' ');
    ret = ret.replace(/,[ ,]+,/g, ',');
    el.hasInnerText[cacheKey] = ret;
    return ret;
  } else if (el.nodeType == 3) {
    return el.textContent.replace(/\u00A0/g, ' ');
  }
  return '';
}
