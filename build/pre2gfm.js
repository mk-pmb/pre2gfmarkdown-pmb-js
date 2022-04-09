/*jslint indent: 2, maxlen: 80, node: true, browser: true */
/* -*- tab-width: 2 -*- */
'use strict';

var mdRender = require('marked').parse, mdOpt,
  sani = false, // too aggressive: require('pagedown-sanitizer'),
  hljs = require('highlight.js');

mdOpt = {
  // https://github.com/markedjs/marked/blob/master/docs/USING_ADVANCED.md
  gfm: true,
  breaks: false,
  headerPrefix: 'hl hl-',
  langPrefix: 'hljs ',
  mangle: false,
  sanitize: Boolean(sani),
};

if (sani) { mdOpt.sanitizer = sani; }

mdOpt.highlight = function (code, lang, next) {
  try {
    code = hljs.highlight(lang, code, true).value;
    code = '<!-- begin ' + lang + ' code -->' + code +
      '<!-- endof ' + lang + ' code -->';
    return (next ? next(null, code) : code);
  } catch (err) {
    if (!next) { throw err; }
    return next(err, null);
  }
};

mdRender.setOptions(mdOpt);

function transformOneTag(orig) {
  var par = orig.parentNode, mdTag = document.createElement('div');
  mdTag.className = 'markdown';
  mdTag.innerHTML = mdRender(orig.innerHTML);
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
    if (hasCls(o, ' markdown ')) { transformOneTag(o); }
  }
}

window.pre2gfm = pre2gfm;
module.exports = pre2gfm;
setTimeout(pre2gfm, 1);
