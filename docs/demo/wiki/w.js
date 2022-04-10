/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, browser: true */
/* -*- tab-width: 2 -*- */
(function () {
  'use strict';
  function byid(id) { return (document.getElementById(id) || false); }

  var EX = {}, rootLen, rootSub,
    contentLink = byid('mdwiki-content-link'), contentDestElem;

  if (!contentLink) { return; }
  contentDestElem = (contentLink.parentNode || document.body);

  EX.fatalError = function fatalError(msg, ds) {
    var el = contentDestElem;
    el.innerHTML = '<p class="mdwiki-error"></p>';
    el = el.firstChild;
    el.innerText = 'Error: ' + msg;
    el.dataset = ds;
  };

  EX.urlBaseDir = function urlBaseDir(u) {
    return String(u).split(/\?|\#/)[0].replace(/[\w\.\-]+$/, '');
  };
  EX.docBaseDir = EX.urlBaseDir(document.URL);
  window.MDwiki = EX;

  EX.rootUrl = byid('mdwiki-root-link').href;
  EX.isRooted = function isRooted(u) { return u.startsWith(EX.rootUrl); };
  if (EX.rootUrl) {
    if (!EX.rootUrl.endsWith('/')) { EX.rootUrl += '/'; }
    rootLen = EX.rootUrl.length;
    rootSub = (EX.isRooted(EX.docBaseDir) && EX.docBaseDir.slice(rootLen));
  } else {
    EX.rootUrl = EX.docBaseDir;
    rootLen = EX.rootUrl.length;
  }

  (function ns() {
    if (!rootSub) { return; }
    rootSub = rootSub.replace(/\/$/, '').split(/\//);
    rootSub.rel = function rel(url) {
      var relUrl = url, up = rootSub.length, common, dir;
      for (common = 0; common < up; common += 1) {
        dir = rootSub[common] + '/';
        if (!relUrl.startsWith(dir)) { break; }
        relUrl = relUrl.slice(dir.length);
      }
      relUrl = '../'.repeat(up - common) + relUrl;
      // console.debug('rootRel:', [up, url, common, relUrl]);
      return relUrl;
    };
  }());

  (function ns() {
    var lnk = document.createElement('a'), ab = 'about:blank';
    lnk.id = 'mdwiki-href-resolver';
    lnk.style.display = 'none !important';
    lnk.href = ab;
    contentDestElem.appendChild(lnk);
    function reso(href) {
      lnk.href = href;
      var abs = lnk.href;
      lnk.href = ab;
      return abs;
    }
    reso.lnk = lnk;
    EX.resolveUrl = reso;
  }());

  (function ns() {
    var wn = function whyNotSafeRelativeLink(href) {
      if (!href) { return 'empty'; }
      if (href.startsWith('/')) { return 'absolute'; }
      if (href !== encodeURI(href)) { return 'scary:char'; }
      if (/[\/:]\//.test(href)) { return 'scary:slash'; }
    };
    wn.rooted = function andRooted(href) {
      var bad = wn(href), url;
      if (bad) { return bad; }
      url = EX.resolveUrl(href);
      if (url !== EX.resolveUrl('./' + href)) { return 'exotic:nonrel'; }
      if (!EX.isRooted(url)) { return 'root:outside'; }
    };
    EX.whyNotSafeRelativeLink = wn;
  }());

  function hookWikiLink(lnk) {
    var href = lnk.getAttribute('href');
    if (!/\.md(?:\.txt|)$/.test(href)) { return; }
    href = lnk.href;
    if (!EX.isRooted(href)) { return; }
    href = href.slice(rootLen);
    if (rootSub) { href = rootSub.rel(href); }
    if (!lnk.innerHTML) { lnk.innerText = href; }
    lnk.href = '?' + href;
    return true;
  }

  window.pre2gfm.onRendered = function adjustLinks(mdTag) {
    var cbd = contentDestElem.baseDirUrl,
      fixRoot = (cbd && (mdTag.parentNode.id === 'mdwiki-content'));

    function fixUrlAttrs(container, tag, attr) {
      var sel = tag + '[' + attr + ']',
        elems = Array.from(container.querySelectorAll(sel));
      elems.forEach(function adjust(el) {
        var val = el.getAttribute(attr), url;
        if (!val) { return; }
        if (fixRoot) {
          url = EX.resolveUrl('./' + val);
          if (el[attr] === url) { el[attr] = cbd + val; }
        }
      });
      return elems;
    }

    fixUrlAttrs(mdTag, 'a', 'href').forEach(hookWikiLink);
    fixUrlAttrs(mdTag, 'img', 'src');
  };

  (function maybeLoadWantedPage() {
    var want, bad, base, title;
    want = (location.search || '').slice(1);
    title = String(want || contentLink.getAttribute('href') || ''
      ).replace(/^[\.\/]*\//, '');
    if (title) { document.title = (title + ' — ' + document.title); }
    if (!want) { return; }
    bad = EX.whyNotSafeRelativeLink.rooted(want);
    if (bad) { return EX.fatalError('Invalid content URL', { why: bad }); }
    contentLink.href = want;
    base = EX.urlBaseDir(contentLink.href);
    contentLink = null;
    if (base === EX.docBaseDir) { base = ''; }
    contentDestElem.baseDirUrl = base;
  }());
}());
