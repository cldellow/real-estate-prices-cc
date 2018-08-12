import LZ4 from 'lz4';

import fs from 'fs';
import path from 'path';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;
import * as engine from './engine';
//import { LZ4 } from 'lz4';
//const LZ4 = require('lz4');


function parseOracle(file) {
  const bytes = fs.readFileSync(file);
  const lines = bytes.toString('utf8').split('\n');
  const rv = [];
  for(var i = 0; i < lines.length; i++) {
    if(lines[i])
      rv.push(JSON.parse(lines[i]));
  }

  return rv;
}

function canonicalize(obj) {
  return Object.entries(obj).sort();
}

function compare(expected, actual) {
  const rv = {
    'both': [],
    'missing': [],
    'extra': []
  };

  const both = {}
  for(var i = 0; i < expected.length; i++) {
    const needle = JSON.stringify(canonicalize(expected[i]));

    for (var j = 0; j < actual.length; j++) {
      const candidate = JSON.stringify(canonicalize(expected[j]));

      if(needle == candidate) {
        both[needle] = true;
        break;
      }
    }
  }

  for(var i = 0; i < expected.length; i++) {
    const candidate = expected[i];
    const needle = JSON.stringify(canonicalize(candidate));
    if(both[needle]) {
      //rv['both'].push(candidate);
    } else {
      rv['missing'].push(candidate);
    }
  }

  for(var i = 0; i < actual.length; i++) {
    const candidate = actual[i];
    const needle = JSON.stringify(canonicalize(candidate));
    if(!both[needle]) {
      rv['extra'].push(candidate);
    }
  }

  return rv;
}

function runTests(dir) {
  const results = {};
  var files = 0;
  var ok = 0;

  fs.readdirSync(dir).forEach(oracle => {
    const onlyRun = null; //'0004';
    if(!oracle.endsWith('.jsonl') || (onlyRun && oracle.indexOf(onlyRun) < 0))
      return;

    const expected = parseOracle(dir + '/' + oracle);

    const file = oracle.replace(/\.jsonl$/, '');

    console.log(file);
    var bytes = fs.readFileSync(dir + '/' + file);
    if(file.endsWith('.lz4')) {
      bytes = LZ4.decode(bytes);
    }

    const dom = new JSDOM(bytes);

    engine.rewrite(dom.window.document.body);

    const actual = engine.extract(dom.window.document);
    const compared = compare(expected, actual);
    results[file] = compared;
    files++;
    if(compared['missing'].length == 0 && compared['extra'].length == 0)
      ok++;
  })

  console.log(JSON.stringify(results, null, 2));
  console.log(ok + '/' + files + ' files OK.');
}

// TODO: how to get __filename when in mjs?
//runTests(path.dirname(__filename) + '/../tests');
runTests('/home/cldellow/src/real-estate-prices-cc/tests');
