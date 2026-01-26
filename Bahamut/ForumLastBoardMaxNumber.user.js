// ==UserScript==
// @name         巴哈姆特 - 哈拉區最近閱覽看板紀錄數量增加
// @namespace    Sayuki2123
// @version      1.0.1
// @description  增加最近閱覽看板的最大數量
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#哈拉區最近閱覽看板紀錄數量增加
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://forum.gamer.com.tw/*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  const forum = new Proxy({}, {
    set(_, key, value) {
      if (key === 'LastBoard' && 'MAX_SHOW' in value) {
        value.MAX_SHOW = 20;
      }

      return Reflect.set(...arguments);
    }
  });

  if (window.Forum != null) {
    for (const [key, value] of Object.entries(window.Forum)) {
      forum[key] = value;
    }
  }

  window.Forum = forum;
})();
