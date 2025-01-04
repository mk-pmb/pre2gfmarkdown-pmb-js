'use strict';
/* global window, document */

const mdRender = require('marked').parse;
const getOwn = require('getown');
const hljs = require('highlight.js');

function dotText(x) { return x.text(); }
function pre2gfm() { pre2gfm.scan(); }
function urlNoHash(url) { return String(url).split(/#/)[0]; }

const sani = false; // too aggressive: require('pagedown-sanitizer'),

const bodyCacheBust = document.body.getAttribute(
  'markdown-from-file-cachebust');
const docUrlNoHash = urlNoHash(window.document.URL);

let { now } = Date;
if (!now) { now = function getTime() { return (new Date()).getTime(); }; }

function orf(x) { return x || false; }
function inStr(needle, hay) { return (hay.indexOf(needle) >= 0); }
function hasCls(t, c) { return (t && inStr(c, ' ' + t.className + ' ')); }


function eachElemCls(t, c, f) {
  let l = document.getElementsByTagName(t);
  const n = l.length;
  if (!n) { return; }
  l = [].slice.call(l);
  let i;
  let o;
  for (i = 0; i < n; i += 1) {
    o = l[i];
    if (hasCls(o, c)) { f(o); }
  }
}

const mdOpt = {
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


pre2gfm.hljsProxy = function hljsProxy(code, lang) {
  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
};


pre2gfm.syntaxHighlighters = {
  '*': pre2gfm.hljsProxy,
};


mdOpt.highlight = function highlight(origCode, lang, next) {
  let impl = pre2gfm.syntaxHighlighters;
  impl = getOwn(impl, lang) || getOwn(impl, '*');
  let err;
  let code = '';
  try {
    code = impl(origCode, lang); /*
      Passing the code as arg 1 has the benefit of supporting any generic
      one-argument string function, like String. */
  } catch (caught) {
    err = caught;
  }
  if (err) {
    console.warn('pre2gfm: Failed to highlight code:',
      { code, lang, error: err });
  }
  return (next ? next(null, code) : code);
};

mdRender.setOptions(mdOpt);


function rescrollToHeadline() {
  const lh = window.location.hash;
  const hp = '#' + mdOpt.headerPrefix;
  // console.debug('rescrollToHeadline:', { lh: lh, hp: hp });
  if (lh.startsWith(hp)) { window.location.hash = lh; }
}

function runEventHandlerChain(hndList, args) {
  const [f, ...g] = hndList;
  if (g.length) { setTimeout(runEventHandlerChain.bind(null, g, args), 10); }
  if (f) { f(...args); }
}
pre2gfm.runEventHandlerChain = runEventHandlerChain;

pre2gfm.onRendered = [];

function triggerOnRendered(el) {
  runEventHandlerChain([
    rescrollToHeadline,
  ].concat(pre2gfm.onRendered), [el]);
}


function transformOneTagText(orig) {
  const par = orig.parentNode;
  const mdTag = document.createElement('div');
  mdTag.className = orig.className;
  mdTag.classList.add('markdown');
  mdTag.innerHTML = mdRender(orig.innerHTML);
  if (par) {
    // console.debug('insert mdTag', mdTag, 'before', orig);
    par.insertBefore(mdTag, orig);
    // Delay removal a bit, to avoid odd mistargetings in Firefox:
    setTimeout(function rm() { par.removeChild(orig); }, 1);
  }
  triggerOnRendered(mdTag);
  return mdTag;
}


const cacheBusterValueGenerators = {
  rand() { return Math.random().toString(26).slice(2); },
  uts() { return Math.floor(now() / 1e3); },
};

function maybeBustCache(origUrl, bust) {
  const how = (bust || bodyCacheBust);
  if (!how) { return origUrl; }
  const [, genName, suf] = String(how || '').split(/^([a-z]+) ?/);
  const genImpl = getOwn(cacheBusterValueGenerators, genName || '');
  if (!genImpl) {
    console.warn('pre2gfm: Unknown cache buster value generator:', genName);
    return origUrl;
  }
  const url = origUrl + suf + genImpl();
  return url;
}

function fetchOneTagText(link) {
  let url = link.getAttribute('href');
  if (!url) { return; }
  const mdTag = transformOneTagText(link);
  const hll = link.getAttribute('codelang');

  function upd(orig) {
    // console.debug('MDwiki fetched:', [url], '=', [orig]);
    let code = orig.replace(/\r|\uFEFF/g, '');
    if (code.slice(-1) !== '\n') { code += '\n'; }
    if (hll) { code = '```' + hll + '\n' + code + '```\n'; }
    mdTag.innerHTML = mdRender(code);
    mdTag.classList.remove('hourglass');
    triggerOnRendered(mdTag);
  }

  if (url.startsWith('#')) {
    return upd(orf(document.getElementById(url.slice(1))).innerHTML || url);
  }

  url = urlNoHash(link.href);
  if (url === docUrlNoHash) { return; }
  if (url.startsWith('about:')) { return; }
  url = maybeBustCache(url, link.getAttribute('cachebust'));
  // console.debug('MDwiki fetch:', [url], '->', mdTag);
  function fail(err) { console.error('pre2gfm fetch error:', [url, err]); }
  mdOpt.httpGet(url).then(dotText).then(String, String).then(upd)
    .catch(fail);
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
