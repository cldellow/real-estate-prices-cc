export function innerText(el, subs, cacheKey) {
  cacheKey = cacheKey || '';
  if(el.hasInnerText && el.hasInnerText[cacheKey])
    return el.hasInnerText[cacheKey];

  if(el.nodeType == 1) {
    if(subs && subs[el.nodeName.toUpperCase()])
      return subs[el.nodeName.toUpperCase()];
    const rv = [];

    for(var i = 0; i < el.childNodes.length; i++) {
      rv.push(innerText(el.childNodes[i], subs, cacheKey));
    }
    const ret = rv.join(' ').replace(/^ +| +$/g, '');
    if(!el.hasInnerText)
      el.hasInnerText = {};

    el.hasInnerText[cacheKey] = ret;
    return ret;
  } else if (el.nodeType == 3) {
    return el.textContent;
  }
  return '';
}
