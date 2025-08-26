// ==UserScript==
// @name         巴哈姆特動畫瘋 - 下一集不自動播放
// @namespace    Sayuki2123
// @version      1.1.0
// @description  動畫瘋的設定「自動播放下一集」沒有勾選時，切換到下一集後不會自動播放
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BahamutAnime#下一集不自動播放
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://ani.gamer.com.tw/animeVideo.php?sn=*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  window.addEventListener('load', () => {
    document.getElementById('nextEpisode').addEventListener('click', (event) => {
      if (document.getElementById('autoPlay').checked) {
        return;
      }

      const nextSn = document.querySelector('.playing').nextElementSibling?.firstElementChild.href;

      if (nextSn == null) {
        return;
      }

      event.stopImmediatePropagation();

      location.href = nextSn;
    }, true);
  });
})();
