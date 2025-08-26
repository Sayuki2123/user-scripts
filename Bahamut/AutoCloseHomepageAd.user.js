// ==UserScript==
// @name         巴哈姆特 - 首頁全畫面廣告自動關閉
// @namespace    Sayuki2123
// @version      1.0.0
// @description  進入首頁時遇到全畫面廣告時會自動關閉廣告
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#首頁全畫面廣告自動關閉
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://www.gamer.com.tw/*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// @run-at       document-body
// ==/UserScript==

(() => {
  'use strict';

  if (document.body.onload == null) {
    return;
  }

  location.replace(location.href);
})();
