// ==UserScript==
// @name         PTT - 固定搜尋文章位置
// @namespace    Sayuki2123
// @version      1.0.0
// @description  固定 PTT 網頁版的搜尋文章的位置
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/PTT#固定搜尋文章位置
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://www.ptt.cc/bbs/*index*.html
// @match        https://www.ptt.cc/bbs/*search?*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const searchBar = document.querySelector('.search-bar');

  if (searchBar == null) {
    return;
  }

  const actionBar = document.querySelector('.action-bar');

  actionBar.insertBefore(searchBar, actionBar.lastElementChild);

  const style = document.createElement('style');

  style.textContent = `
    .action-bar {
      display: flex;
    }

    .search-bar {
      flex: 1;
      padding: 0;
    }

    .search-bar .query {
      height: 40px;
      border: none;
    }

    .search-bar .query:focus {
      border: none;
    }

    @media screen and (max-width: 799px) {
      .btn-group-dir {
        width: 25%;
      }

      .btn-group-paging {
        width: 50%;
      }

      .btn-group-paging > .btn,
      .btn-group-dir > .btn {
        width: unset;
      }

      .search-bar {
        flex: unset;
        width: 100%;
      }
    }

    @media screen and (max-width: 499px) {
      .btn-group-dir {
        width: 33%;
      }

      .btn-group-paging {
        width: 66%;
      }
    }
  `;

  document.body.append(style);
})();
