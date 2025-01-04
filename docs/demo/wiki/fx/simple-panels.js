'use strict';
/* global window, document */
(function install() {
  const { pre2gfm, MDwiki } = window;
  const { qsMap } = MDwiki;

  const EX = {

    scan(container) {
      qsMap(container, '.mdwiki-fx-simple-panels', EX.upgrade);
    },

    upgrade(fxElem) {
      const { tag, cls } = fxElem.fxArgs;
      const par = fxElem.parentNode;
      fxElem.innerText.replace(/\S+/g, function insertPanel(src) {
        const t = document.createElement(tag || 'div');
        if (cls) { t.className = cls; }
        const a = document.createElement('a');
        a.className = 'markdown-from-file hourglass';
        a.href = src;
        a.innerText = '… ' + src + ' …';
        t.appendChild(a);
        par.insertBefore(t, fxElem);
      });
      par.removeChild(fxElem);
      setTimeout(pre2gfm.scan, 1);
    },

  };

  pre2gfm.onRendered.push(EX.scan);
}());
