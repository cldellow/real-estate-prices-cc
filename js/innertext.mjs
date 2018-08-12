export function innerText(el) {
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
