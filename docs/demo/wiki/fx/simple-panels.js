/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, browser: true */
/* -*- tab-width: 2 -*- */
(function () {
  'use strict';
  var EX = {}, MDW = window.MDwiki;

  EX.scan = function scan(container) {
    MDW.qsMap(container, '.mdwiki-fx-simple-panels', EX.upgrade);
  };

  EX.upgrade = function upgrade(fxElem) {
    console.debug(fxElem.fxArgs, fxElem.fxData);
  };

  window.pre2gfm.onRendered.push(EX.scan);
}());
