// ==UserScript==
// @name         BOOK☆WALKER - 期間限定無料お試し版を強調表示します
// @name:zh-TW   BOOK☆WALKER - 醒目標示期間限定免費版本
// @namespace    Sayuki2123
// @version      1.0.0
// @description  期間限定無料お試し版を強調表示します。また、非表示ボタンを追加します
// @description:zh-TW  醒目標示期間限定免費版本，並增加可以隱藏的按鈕
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BookwalkerJP#醒目標示期間限定免費版本
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://bookwalker.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bookwalker.jp
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  highlightTrialBooks();
  addHideTrialBooksButton();
  addStyle();

  function highlightTrialBooks() {
    const keywords = ['無料', '試し', '読み', '試読'];

    document.querySelectorAll('a.m-book-item__title').forEach((title) => {
      if (!keywords.some((word) => title.textContent.includes(word))) {
        return;
      }

      const item = title.closest('.m-book-item');
      const price = parseInt(item.querySelector('.m-book-item__price-num')?.textContent) || 0;

      if (price > 0) {
        return;
      }

      item.parentNode.classList.add('trial');
    });
  }

  function addHideTrialBooksButton() {
    const menu = document.querySelector('.o-list--menu-display-setting');

    if (menu == null) {
      return;
    }

    if (sessionStorage.getItem('hideTrialBooks')) {
      hideTrialBooks(true);
    }

    const hideButton = document.createElement('a');

    hideButton.className = 'o-list-toggle__series';
    hideButton.innerHTML = '<span class="ico ico-Zero-Books"></span>\n<span class="button-text">試し読み非表示</span>';

    hideButton.addEventListener('click', function () {
      const hasHidden = !!sessionStorage.getItem('hideTrialBooks');

      if (hasHidden) {
        this.lastElementChild.textContent = '試し読み非表示';
        sessionStorage.setItem('hideTrialBooks', '');
      } else {
        this.lastElementChild.textContent = '試し読み表示';
        sessionStorage.setItem('hideTrialBooks', '1');
      }

      hideTrialBooks(!hasHidden);
    });

    menu.insertBefore(hideButton, menu.firstElementChild);

    function hideTrialBooks(isHidden) {
      const bookList = document.querySelector('.m-tile-list');

      if (isHidden) {
        bookList.classList.add('hide-trial');
      } else {
        bookList.classList.remove('hide-trial');
      }
    }
  }

  function addStyle() {
    const style = document.createElement('style');

    style.textContent = `
      .o-list-toggle__series {
        cursor: pointer;
      }

      .m-tile.trial > .m-book-item {
        background-color: bisque;
      }

      .hide-trial > .trial {
        display: none;
      }
    `;

    document.body.append(style);
  }
})();
