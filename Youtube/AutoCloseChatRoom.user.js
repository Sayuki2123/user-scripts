// ==UserScript==
// @name         Youtube - 自動關閉聊天室
// @namespace    Sayuki2123
// @version      1.0.0
// @description  在進入直播頁面的時候自動關閉聊天室
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Youtube#自動關閉聊天室
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://*.youtube.com/live_chat*
// @match        https://*.youtube.com/live_chat_replay*
// @icon         https://www.google.com/s2/favicons?sz=32&domain=youtube.com
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (window.self === window.top) {
    return;
  }

  if (parent.neverChat === parent.location.search) {
    return;
  }

  parent.neverChat = parent.location.search;

  document.querySelector('#close-button .yt-spec-button-shape-next--icon-only-default').click();
})();
