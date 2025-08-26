// ==UserScript==
// @name         巴哈姆特 - 哈拉區最近閱覽看板紀錄規則修改
// @namespace    Sayuki2123
// @version      1.0.0
// @description  直接進入到不在最近閱覽看板內的文章頁面 (C、Co) 時，不會記錄到最近閱覽看板
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#哈拉區最近閱覽看板紀錄規則修改
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://forum.gamer.com.tw/C*.php?*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// @run-at       document-body
// ==/UserScript==

(() => {
  'use strict';

  const currentBoard = location.search.match(/(?<=bsn=)\d+/)?.at(0);

  if (window.Forum.LastBoard.getData().some(([board]) => board === currentBoard)) {
    return;
  }

  window.Forum.LastBoard.addBoard = () => { };
})();
