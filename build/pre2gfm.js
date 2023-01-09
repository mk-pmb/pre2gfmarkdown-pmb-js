/*jslint indent: 2, maxlen: 80, node: true, browser: true */
/* -*- tab-width: 2 -*- */
'use strict';

function pre2gfm() { pre2gfm.scan(); }
function triggerOnRendered(el) { (pre2gfm.onRendered || Boolean)(el); }
function urlNoHash(url) { return String(url).split(/#/)[0]; }
function dotText(x) { return x.text(); }

var mdRender = require('marked').parse, mdOpt, now = Date.nowx,
  bodyCacheBust = document.body.getAttribute('markdown-from-file-cachebust'),
  sani = false, // too aggressive: require('pagedown-sanitizer'),
  docUrlNoHash = urlNoHash(window.document.URL),
  hljs = require('highlight.js');

if (!now) { now = function now() { return (new Date()).getTime(); }; }

function orf(x) { return x || false; }
function inStr(needle, hay) { return (hay.indexOf(needle) >= 0); }
function hasCls(t, c) { return (t && inStr(c, ' ' + t.className + ' ')); }


function eachElemCls(t, c, f) {
  var l = document.getElementsByTagName(t), n = l.length, i, o;
  if (!n) { return; }
  l = [].slice.call(l);
  for (i = 0; i < n; i += 1) {
    o = l[i];
    if (hasCls(o, c)) { f(o); }
  }
}

mdOpt = {
  // https://github.com/markedjs/marked/blob/master/docs/USING_ADVANCED.md
  gfm: true,
  breaks: false,
  headerPrefix: 'hl-',  // ATTN: This is used for id=…, not class=…!
  langPrefix: 'hljs ',
  mangle: false,
  sanitize: Boolean(sani),
};


mdOpt.httpGet = (orf(window.axios).get // <-- see `../docs/httpGet.md`
  || window.fetch.bind(window));

if (sani) { mdOpt.sanitizer = sani; }

mdOpt.highlight = function (code, lang, next) {
  try {
    code = hljs.highlight(code, {
      language: lang,
      ignoreIllegals: true,
    }).value;
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
  if (!hasCls(mdTag, ' markdown ')) { mdTag.className += ' markdown'; }
  mdTag.innerHTML = mdRender(orig.innerHTML);
  if (par) {
    console.debug('insert mdTag', mdTag, 'before', orig);
    par.insertBefore(mdTag, orig);
    // Delay removal a bit, to avoid odd mistargetings in Firefox:
    setTimeout(function rm() { par.removeChild(orig); }, 1);
  }
  triggerOnRendered(mdTag);
  return mdTag;
}

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
  var mdTag = transformOneTagText(link), url = link.getAttribute('href'),
    hll = link.getAttribute('codelang');
  if (!url) { return; }

  function upd(orig) {
    console.debug('MDwiki fetched:', [url], '=', [orig]);
    var code = orig.replace(/\r|\uFEFF/g, '');
    if (code.slice(-1) !== '\n') { code += '\n'; }
    if (hll) { code = '```' + hll + '\n' + code + '```\n'; }
    mdTag.innerHTML = mdRender(code);
    triggerOnRendered(mdTag);
  }

  if (url.slice(0, 1) === '#') {
    return upd(orf(document.getElementById(url.slice(1))).innerHTML || url);
  }

  url = urlNoHash(link.href);
  if (url === docUrlNoHash) { return; }
  if (url.slice(0, 6) === 'about:') { return; }
  url = maybeBustCache(url, link.getAttribute('cachebust'));
  console.debug('MDwiki fetch:', [url], '->', mdTag);
  function fail(err) { console.error('pre2gfm fetch error:', [url, err]); }
  mdOpt.httpGet(url).then(dotText).then(String, String).then(upd).catch(fail);
}

pre2gfm.scan = function scan() {
  eachElemCls('pre', ' markdown ', transformOneTagText);
  eachElemCls('a', ' markdown-from-file ', fetchOneTagText);
};

pre2gfm.formURL = function mdFromUrl(url, opt) {
  function ga(k) { return String(orf(opt)[k] || ''); }
  return fetchOneTagText({ href: url, getAttribute: ga });
};

window.pre2gfm = pre2gfm;
module.exports = pre2gfm;
setTimeout(pre2gfm, 1);
