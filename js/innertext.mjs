export function innerText(el, subs) {
  if(el.nodeType == 1) {
    if(subs && subs[el.nodeName.toUpperCase()])
      return subs[el.nodeName.toUpperCase()];
    const rv = [];

    for(var i = 0; i < el.childNodes.length; i++) {
      rv.push(innerText(el.childNodes[i], subs));
    }
    const ret = rv.join(' ').replace(/^ +| +$/g, '');
    el.hasInnerText = ret;
    return ret;
  } else if (el.nodeType == 3) {
    return el.textContent;
  }
  return '';
}
