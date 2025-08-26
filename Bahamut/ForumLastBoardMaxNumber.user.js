// ==UserScript==
// @name         巴哈姆特 - 哈拉區最近閱覽看板紀錄數量增加
// @namespace    Sayuki2123
// @version      1.0.0
// @description  增加最近閱覽看板的最大數量
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#哈拉區最近閱覽看板紀錄數量增加
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://forum.gamer.com.tw/*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// @run-at       document-body
// ==/UserScript==

(() => {
  'use strict';

  if (window.Forum?.LastBoard == null) {
    return;
  }

  window.Forum.LastBoard.MAX_SHOW = 20;
})();
