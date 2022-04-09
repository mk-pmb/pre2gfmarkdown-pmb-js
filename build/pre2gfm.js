/*jslint indent: 2, maxlen: 80, node: true, browser: true */
/* -*- tab-width: 2 -*- */
'use strict';

var mdRender = require('marked').parse, mdOpt, now = Date.nowx,
  bodyCacheBust = document.body.getAttribute('markdown-from-file-cachebust'),
  sani = false, // too aggressive: require('pagedown-sanitizer'),
  hljs = require('highlight.js');

if (!now) { now = function now() { return (new Date()).getTime(); }; }

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

function transformOneTagText(orig) {
  var par = orig.parentNode, mdTag = document.createElement('div');
  mdTag.className = orig.className;
  mdTag.innerHTML = mdRender(orig.innerHTML);
  par.insertBefore(mdTag, orig);
  par.removeChild(orig);
  return mdTag;
}

function hasCls(t, c) {
  return (t && ((' ' + t.className + ' ').indexOf(c) >= 0));
}

function eachElemCls(t, c, f) {
  var l = document.getElementsByTagName(t), n = l.length, i, o;
  if (!n) { return; }
  l = [].slice.call(l);
  for (i = 0; i < n; i += 1) {
    o = l[i];
    if (hasCls(o, c)) { f(o); }
  }
}

function dotText(x) { return x.text(); }

function maybeBustCache(url, bust) {
  var how = (bust || bodyCacheBust);
  if (!how) { return url; }
  how = String(how || '').split(/^([a-z]+) ?/);
  if (!how) { return url; }
  url += how[2];
  how = how[1];
  if (how === 'rand') { url += Math.random().toString(26).slice(2); }
  if (how === 'uts') { url += Math.floor(now() / 1e3); }
  return url;
}

function fetchOneTagText(link) {
  // Use link text as temporary "loading" hint:
  var mdTag = transformOneTagText(link), url,
    hll = link.getAttribute('codelang');
  url = maybeBustCache(link.href, link.getAttribute('cachebust'));
  if (!hasCls(mdTag, ' markdown ')) { mdTag.className += ' markdown'; }
  function upd(orig) {
    var code = orig.replace(/\r|\uFEFF/g, '');
    if (code.slice(-1) !== '\n') { code += '\n'; }
    if (hll) { code = '```' + hll + '\n' + code + '```\n'; }
    mdTag.innerHTML = mdRender(code);
  }
  window.fetch(url).then(dotText).then(String, String).then(upd);
}

function pre2gfm() {
  eachElemCls('pre', ' markdown ', transformOneTagText);
  eachElemCls('a', ' markdown-from-file ', fetchOneTagText);
}

window.pre2gfm = pre2gfm;
module.exports = pre2gfm;
setTimeout(pre2gfm, 1);
