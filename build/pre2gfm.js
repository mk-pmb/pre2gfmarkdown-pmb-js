/*jslint indent: 2, maxlen: 80, node: true, browser: true */
/* -*- tab-width: 2 -*- */
'use strict';

var umark = require('ultramarked'), umOpts,
  sani = false, // too aggressive: require('pagedown-sanitizer'),
  hljs = require('highlight.js');

umOpts = {
  // https://github.com/markedjs/marked/blob/master/docs/USING_ADVANCED.md
  gfm: true,
  breaks: true,
  headerPrefix: 'hl-',
  mangle: false,
  sanitize: !!sani,
};

if (sani) { umOpts.sanitizer = sani; }

umOpts.highlight = function (code, lang, next) {
  try {
    var html = hljs.highlight(lang, code, true).value;
    return (next ? next(null, html) : html);
  } catch (err) {
    if (!next) { throw err; }
    return next(err, null);
  }
};

umark.setOptions(umOpts);

function transformOneTag(orig) {
  var par = orig.parentNode, mdTag = document.createElement('div');
  mdTag.className = 'markdown';
  mdTag.innerHTML = umark(orig.innerHTML);
  par.insertBefore(mdTag, orig);
  par.removeChild(orig);
}

function hasCls(t, c) {
  return (t && ((' ' + t.className + ' ').indexOf(c) >= 0));
}

function pre2gfm() {
  var pres = document.getElementsByTagName('pre'), n = pres.length, i, o;
  if (!n) { return; }
  pres = [].slice.call(pres);
  for (i = 0; i < n; i += 1) {
    o = pres[i];
    if (hasCls(o, 'markdown')) { transformOneTag(o); }
  }
}

module.exports = pre2gfm;
setTimeout(pre2gfm, 1);
