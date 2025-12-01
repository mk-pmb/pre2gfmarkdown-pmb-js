'use strict';
/* global window, document */
(function install() {
  const { pre2gfm, MDwiki } = window;
  const { byid, mkTag, qsMap } = MDwiki;
  pre2gfm.syntaxHighlighters['mdwiki-fx'] = String;

  const EX = {

    scan(container) {
      qsMap(container, 'pre > code.mdwiki-fx', EX.parse);
    },

    parse(codeElem) {
      const t = codeElem.innerText;
      let m = t.split(/^fx:\s*(\S+)( [ -\uFFFF]*|)(?:\n|$)/);
      if (m.length > 2) {
        m = { name: m[1], args: m[2].trim(), data: m[3] };
        try {
          m = (EX.tryParseJsonArg(m, '{', '}')
            || EX.tryParseJsonArg(m, '[', ']')
            || m);
        } catch (c) {
          console.error('MDWiki fx: Failed to parse JSON params:', m);
        }
        return EX.upgrade(codeElem, m.name, m.args, m.data);
      }
    },

    tryParseJsonArg(fxDescr, open, close) {
      const { args, data } = fxDescr;
      if (!args.startsWith(open)) { return; }
      if (args.endsWith(close)) {
        return { ...fxDescr, args: JSON.parse(args) };
      }
      if (data.endsWith(close)) {
        return { ...fxDescr, args: JSON.parse(args + data), data: '' };
      }
    },

    upgrade(codeElem, fxName, fxArgs, fxData) {
      const pre = codeElem.parentElement;
      const par = pre.parentElement;
      pre.removeChild(codeElem);
      const fxElem = document.createElement('div');
      fxElem.className = 'mdwiki-fx mdwiki-fx-' + fxName;
      fxElem.setAttribute('fx-name', fxName);
      fxElem.fxName = fxName;
      fxElem.fxArgs = fxArgs;
      par.insertBefore(fxElem, pre);
      if (!pre.firstChild) { par.removeChild(pre); }
      if ((typeof fxData) === 'string') {
        fxElem.innerText = fxData.replace(/\r\n/g, '\n').replace(/\n+$/, '');
      } else {
        fxElem.fxData = fxData;
      }
    },

    addCss(css) {
      if (!css) { return; }
      if (Array.isArray(css)) { return EX.addCss(css.join('\n')); }
      EX.addCss.dest.innerHTML += '\n\n' + String(css) + '\n';
    },

  };

  EX.addCss.dest = (function setup() {
    const id = 'mdwiki-fx-stylesheet';
    const el = byid(id) || mkTag('style', { id, type: 'text/css' });
    if (!el.parentNode) { document.head.appendChild(el); }
    return el;
  }());

  if (!MDwiki.fx) { MDwiki.fx = {}; }
  MDwiki.fx.base = EX;
  pre2gfm.onRendered.push(EX.scan);
}());
