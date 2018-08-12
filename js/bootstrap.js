// This script is meant to be loaded in browser clients to demonstrate
// the output and provide a UI for testing selectors.
function _ready() {
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

s=document.createElement('script');
s.setAttribute('type','text/javascript');
s.setAttribute('src','https://dv0akt2986vzh.cloudfront.net/unstable/lib/selectorgadget_edge.js');
document.body.appendChild(s);

s=document.createElement('script');
s.setAttribute('type', 'module');
s.setAttribute('src', 'http://localhost:8000/js/engine.mjs');
document.body.appendChild(s);


