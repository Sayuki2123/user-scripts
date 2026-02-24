// ==UserScript==
// @name         BOOK☆WALKER - 割引率を表示します
// @name:zh-TW   BOOK☆WALKER - 顯示折扣百分比
// @namespace    Sayuki2123
// @version      1.0.0
// @description  セール商品の詳細ページで割引率を表示します
// @description:zh-TW  在特價書籍的詳細頁面顯示折扣百分比
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BookwalkerJP#顯示折扣百分比
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://bookwalker.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bookwalker.jp
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (window.logPageLabel !== '詳細ページ') {
    return;
  }

  const getPrice = (selector) => parseInt(document.querySelector(selector)?.textContent.replace(',', ''));

  let discount;
  const originalPrice = getPrice('.t-c-product-action-parts-price__before');

  if (isNaN(originalPrice)) {
    const title = document.querySelector('.t-c-product-main-data__title').textContent;

    if ((discount = title.match(/^【(\d+)％OFF】/)?.at(1)) == null) {
      return;
    }
  } else {
    const salePrice = getPrice('.t-c-product-action-parts-price__value');
    discount = Math.round((1 - salePrice / originalPrice) * 100);
  }

  document.querySelector('.t-o-book-label.--sale').textContent += ` 【${discount}% OFF】`;
})();
