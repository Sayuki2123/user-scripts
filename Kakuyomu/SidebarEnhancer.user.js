// ==UserScript==
// @name         カクヨム - 目次サイドバーエンハンサー
// @name:zh-TW   カクヨム - 側邊目錄增強
// @namespace    Sayuki2123
// @version      1.0.0
// @description  目次サイドバーを初めて開いたときに、自動的に現在エピソードの位置までスクロールします。また、小説エリアをクリックすることで、サイドバーを閉じることができます
// @description:zh-TW  第一次打開側邊目錄時會自動捲動到現在章節的位置，另外點擊小說區域可以關閉側邊目錄
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Kakuyomu#側邊目錄增強
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://kakuyomu.jp/works/*/episodes/*
// @icon         https://www.google.com/s2/favicons?sz=32&domain=kakuyomu.jp
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (document.getElementById('content').classList.contains('contentAside-isShown')) {
    scrollCurrentEpisodeIntoView();
  } else {
    document.getElementById('sidebar-button').addEventListener('click', scrollCurrentEpisodeIntoView, { once: true });
  }

  document.getElementById('contentMain').addEventListener('click', function () {
    if (this.parentNode.classList.contains('contentAside-isHidden')) {
      return;
    }

    document.getElementById('sidebar-button').click();
  });

  function scrollCurrentEpisodeIntoView() {
    const observer = new MutationObserver((_, observer) => {
      if (document.getElementById('contentAside-episodeInfo') == null) {
        return;
      }

      observer.disconnect();
      document.querySelector('.isHighlighted').scrollIntoView();
    });

    observer.observe(document.getElementById('contentAside'), { childList: true });
  };
})();
