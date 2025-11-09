// ==UserScript==
// @name         BOOK☆WALKER - 検索条件の保存数制限解除
// @name:zh-TW   BOOK☆WALKER - 搜尋條件的儲存數量限制解除
// @namespace    Sayuki2123
// @version      1.0.0
// @description  保存した検索条件の数制限をなくします
// @description:zh-TW  解除搜尋條件的儲存數量限制
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BookwalkerJP#搜尋條件的儲存數量限制解除
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://bookwalker.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bookwalker.jp
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  document.querySelectorAll('.search-history-list-el-save-btn').forEach((btn) => {
    btn.addEventListener('click', saveHistory, true);
  });

  function saveHistory(event) {
    event.stopImmediatePropagation();

    const keyName = 'MANUAL_SAVED_SEARCH_HISTORIES_JSON';
    const history = JSON.parse(localStorage.getItem(keyName)) ?? [];
    const link = event.currentTarget.previousElementSibling;
    const newItem = {
      key: Date.now().toString(16),
      text: link.title,
      uri: link.href
    };

    addToList(newItem);
    history.push(newItem);
    localStorage.setItem(keyName, JSON.stringify(history));
  }

  function deleteHistory(item) {
    const keyName = 'MANUAL_SAVED_SEARCH_HISTORIES_JSON';
    const history = JSON.parse(localStorage.getItem(keyName));
    const index = history.findIndex(({ key }) => key === item.key);

    if (index < 0) {
      return;
    }

    history.splice(index, 1);
    localStorage.setItem(keyName, JSON.stringify(history));
  }

  function addToList(item) {
    const lastEl = document.querySelector('.search-history-manual-list-el.last');
    const el = lastEl.cloneNode(true);
    const link = el.firstElementChild;
    const BtnDelete = el.lastElementChild;

    link.title = item.text;
    link.textContent = item.text;
    link.href = item.uri;

    BtnDelete.addEventListener('click', (event) => {
      deleteHistory(item);

      event.currentTarget.parentElement.previousElementSibling.classList.add('last');
      event.currentTarget.parentElement.remove();
    });

    lastEl.classList.remove('last');
    lastEl.parentElement.append(el);
  }
})();
