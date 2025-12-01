'use strict';
/* global window, document */
(function install() {
  const EX = {
    byid(id) { return (document.getElementById(id) || false); },
    qs1(ctnr, sel) { return ctnr.querySelector(sel) || false; },

    qsMap(container, sel, func) {
      let l = Array.from((container || document).querySelectorAll(sel));
      if (func) { l = l.map(func); }
      return l;
    },

    mkTag(tn, pr) { return Object.assign(document.createElement(tn), pr); },

    mapChTags(container, func, ctx) {
      return Array.from(container.children).map(function oneChild(ch, idx) {
        const tn = (ch.tagName || '').toLowerCase();
        let tf = func[tn];
        if (tf === false) { return; }
        tf = EX.maybeFun(tf) || func;
        return tf.call && tf(ch, idx, tn, ctx);
      });
    },

    urlBaseDir(u) {
      return String(u).split(/\?|\#/)[0].replace(/[\w\.\-]+$/, '');
    },

    maybeFun(x) { return (!!(x && x.call && x.apply)) && x; },

  };

  let rootLen;
  let rootSub;
  const docHtmlElem = document.body.parentElement;
  // ^-- HTML often has no document.rootElement
  let contentLink = EX.byid('mdwiki-content-link');
  if (!contentLink) { return; }
  const contentDestElem = (contentLink.parentNode || document.body);

  EX.fatalError = function fatalError(msg, ds) {
    let el = contentDestElem;
    el.innerHTML = '<p class="mdwiki-error"></p>';
    el = el.firstChild;
    el.innerText = 'Error: ' + msg;
    el.dataset = ds;
  };

  EX.docBaseDir = EX.urlBaseDir(document.URL);
  window.MDwiki = EX;

  EX.rootUrl = EX.byid('mdwiki-root-link').href;
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
      let relUrl = url;
      const up = rootSub.length;
      let common;
      let dir;
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
    const lnk = document.createElement('a');
    const ab = 'about:blank';
    lnk.id = 'mdwiki-href-resolver';
    lnk.style.display = 'none !important';
    lnk.href = ab;
    contentDestElem.appendChild(lnk);
    function reso(href) {
      lnk.href = href;
      const abs = lnk.href;
      lnk.href = ab;
      return abs;
    }
    reso.lnk = lnk;
    EX.resolveUrl = reso;
  }());

  (function ns() {
    const wn = function whyNotSafeRelativeLink(href) {
      if (!href) { return 'empty'; }
      if (href.startsWith('/')) { return 'absolute'; }
      if (href !== encodeURI(href)) { return 'scary:char'; }
      if (/[\/:]\//.test(href)) { return 'scary:slash'; }
    };
    wn.rooted = function andRooted(href) {
      const bad = wn(href);
      if (bad) { return bad; }
      const url = EX.resolveUrl(href);
      if (url !== EX.resolveUrl('./' + href)) { return 'exotic:nonrel'; }
      if (!EX.isRooted(url)) { return 'root:outside'; }
    };
    EX.whyNotSafeRelativeLink = wn;
  }());

  function hookWikiLink(lnk) {
    const hrefAttr = lnk.getAttribute('href');
    if (!/\.md(?:\.txt|)$/.test(hrefAttr)) { return; }
    let hrefFullUrl = lnk.href;
    if (!EX.isRooted(hrefFullUrl)) { return; }
    hrefFullUrl = hrefFullUrl.slice(rootLen);
    if (rootSub) { hrefFullUrl = rootSub.rel(hrefFullUrl); }
    // eslint-disable-next-line no-param-reassign
    if (!lnk.innerHTML) { lnk.innerText = hrefFullUrl; }
    // eslint-disable-next-line no-param-reassign
    lnk.href = '?' + hrefFullUrl;
    return true;
  }

  window.pre2gfm.onRendered.push(function adjustLinks(mdTag) {
    const cbd = contentDestElem.baseDirUrl;
    const fixRoot = (cbd && (mdTag.parentNode.id === 'mdwiki-content'));

    function fixUrlAttrs(container, tag, attr) {
      const elems = EX.qsMap(container, tag + '[' + attr + ']');
      elems.forEach(function adjust(el) {
        const val = el.getAttribute(attr);
        if (!val) { return; }
        if (fixRoot) {
          const url = EX.resolveUrl('./' + val);
          // eslint-disable-next-line no-param-reassign
          if (el[attr] === url) { el[attr] = cbd + val; }
        }
      });
      return elems;
    }

    fixUrlAttrs(mdTag, 'a', 'href').forEach(hookWikiLink);
    fixUrlAttrs(mdTag, 'img', 'src');
  });

  (function maybeLoadWantedPage() {
    const want = (window.location.search || '').slice(1);
    const title = String(want || contentLink.getAttribute('href') || '',
    ).replace(/^[\.\/]*\//, '');
    if (title) { document.title = (title + ' — ' + document.title); }
    docHtmlElem.setAttribute('doctitle', title);
    if (!want) {
      docHtmlElem.setAttribute('docsrc', '');
      return;
    }
    const bad = EX.whyNotSafeRelativeLink.rooted(want);
    if (bad) { return EX.fatalError('Invalid content URL', { why: bad }); }
    contentLink.href = want;
    docHtmlElem.setAttribute('docsrc', want);
    let base = EX.urlBaseDir(contentLink.href);
    contentLink = null;
    if (base === EX.docBaseDir) { base = ''; }
    contentDestElem.baseDirUrl = base;
  }());

}());
