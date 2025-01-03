/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, browser: true */
/* -*- tab-width: 2 -*- */
(function () {
  'use strict';
  var EX = {}, MDW = window.MDwiki;

  window.pre2gfm.syntaxHighlighters['mdwiki-fx'] = String;

  EX.scan = function scan(container) {
    MDW.qsMap(container, 'pre > code.mdwiki-fx', EX.parse);
  };

  EX.parse = function parse(codeElem) {
    var t = codeElem.innerText, m;
    m = t.split(/^fx:\s*(\S+)( [ -\uFFFF]*|)(?:\n|$)/);
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
  };

  EX.tryParseJsonArg = function tryParseJsonArg(fxDescr, open, close) {
    var a = fxDescr.args, d = fxDescr.data;
    if (!a.startsWith(open)) { return; }
    if (a.endsWith(close)) {
      fxDescr.args = JSON.parse(a);
      return fxDescr;
    }
    if (d.endsWith(close)) {
      fxDescr.args = JSON.parse(a + d);
      fxDescr.data = '';
      return fxDescr;
    }
  };

  EX.upgrade = function upgrade(codeElem, fxName, fxArgs, fxData) {
    var pre = codeElem.parentElement, par = pre.parentElement, fxElem;
    pre.removeChild(codeElem);
    fxElem = document.createElement('div');
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
  };

  window.pre2gfm.onRendered.push(EX.scan);
}());
