export function innerText(el, subs, cacheKey) {
  cacheKey = cacheKey || '';
  if(el.hasInnerText && el.hasInnerText[cacheKey])
    return el.hasInnerText[cacheKey];

  if(el.nodeType == 1) {
    const rv = [];

    for(var i = 0; i < el.childNodes.length; i++) {
      rv.push(innerText(el.childNodes[i], subs, cacheKey));
    }

    var ret = rv.join(' ').replace(/^ +| +$/g, '');
    if(subs && subs[el.nodeName.toUpperCase()])
      ret += subs[el.nodeName.toUpperCase()];

    if(!el.hasInnerText)
      el.hasInnerText = {};

    el.hasInnerText[cacheKey] = ret;
    return ret;
  } else if (el.nodeType == 3) {
    return el.textContent;
  }
  return '';
}
