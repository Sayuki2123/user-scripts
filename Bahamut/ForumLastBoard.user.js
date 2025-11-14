// ==UserScript==
// @name         巴哈姆特 - 哈拉區首頁最近閱覽看板
// @namespace    Sayuki2123
// @version      1.0.0
// @description  在哈拉區新版首頁顯示舊版的最近閱覽看板區域
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#哈拉區首頁最近閱覽看板
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://forum.gamer.com.tw/
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  window.addEventListener('load', () => {
    if (checkItem()) {
      addList();
      return;
    }

    const observer = new MutationObserver((_, observer) => {
      if (!checkItem()) {
        return;
      }

      observer.disconnect();
      addList();
    });

    observer.observe(document.getElementById('global-aside'), { childList: true, subtree: true });
  });

  function checkItem() {
    return document.querySelector('[class*=myBoard_boardItem__]') != null;
  }

  function addList() {
    const lastBoard = document.createElement('div');

    lastBoard.id = 'forum-lastBoard';
    lastBoard.className = 'w-full mb-4 overflow-hidden text-secondary-text bg-f1-bg rounded';

    lastBoard.addEventListener('click', deleteBoard);
    lastBoard.insertAdjacentHTML('beforeend', `
      <h5 class="text-lg text-center bg-f2-bg">最近閱覽看板</h5>
      <ul class="min-h-10 px-2"></ul>
    `);

    getData().forEach(([bsn, name]) => {
      lastBoard.lastElementChild.insertAdjacentHTML('beforeend', `
        <li class="lastBoard-item flex py-1 pl-4">
          <a class="truncate hover:text-primary"
            href="B.php?bsn=${bsn}" title="${name}">${name}</a>
          <span class="material-icons invisible ml-auto text-base font-bold text-warning"
            data-bsn="${bsn}" title="刪除" role="button">close</span>
        </li>
      `);
    });

    document.querySelector('.max-w-tower').firstElementChild.prepend(lastBoard);

    addStyle();
  }

  function deleteBoard(event) {
    const bsn = event.target.dataset.bsn;

    if (bsn == null) {
      return;
    }

    const data = getData().filter(([sn]) => sn !== bsn);

    window.Cookies.set("ckBH_lastBoard", JSON.stringify(data), {
      domain: "gamer.com.tw",
      path: "/",
      expires: 365
    });

    event.target.parentNode.remove();
  }

  function getData() {
    return JSON.parse(window.Cookies.get('ckBH_lastBoard') || '[]');
  }

  function addStyle() {
    const style = document.createElement('style');

    style.textContent = `
      .lastBoard-item {
        background: url(https://i2.bahamut.com.tw/icon_blue.gif) no-repeat left center;
        border-bottom: 1px dotted var(--border-strong);
      }

      .lastBoard-item:last-child {
        border-bottom: none;
      }

      .lastBoard-item:hover > span {
        visibility: visible;
      }
    `;

    document.body.append(style);
  }
})();
