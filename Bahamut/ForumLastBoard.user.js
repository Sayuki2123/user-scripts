// ==UserScript==
// @name         巴哈姆特 - 哈拉區顯示最近閱覽看板
// @namespace    Sayuki2123
// @version      1.1.0
// @description  在哈拉區新版首頁和首頁以外的上方看板選單顯示最近閱覽看板
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#哈拉區顯示最近閱覽看板
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://forum.gamer.com.tw/*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  if (location.pathname === '/') {
    const observer = new MutationObserver((_, observer) => {
      observer.disconnect();

      addHomepageList();
      addHomepageStyle();
    });

    observer.observe(document.body, { childList: true });
  } else {
    addTopBarList();
    addTopBarStyle();
  }

  function addHomepageList() {
    const container = document.querySelector('.max-w-tower')?.firstElementChild;

    if (container == null) {
      return;
    }

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

    container.prepend(lastBoard);
  }

  function addTopBarList() {
    const topBar = document.querySelector('#BH-menu-path > .BH-menuE > .dropList');

    if (topBar == null) {
      return;
    }

    const lastBoard = document.createElement('dl');

    lastBoard.className = "lastBoard";

    getData().forEach(([bsn, name]) => {
      lastBoard.insertAdjacentHTML('beforeend', `
        <dd class="lastBoard-item">
          <a href="B.php?bsn=${bsn}">${name}</a>
        </dd>
      `);
    });

    topBar.append(lastBoard);
    topBar.addEventListener('mouseover', function () {
      window.jQuery("#navBarHover").stop().animate({
        left: 0,
        width: this.offsetWidth,
        opacity: 1
      }, 200);
    });
  }

  function deleteBoard(event) {
    const bsn = event.target.dataset.bsn;

    if (bsn == null) {
      return;
    }

    const data = encodeURIComponent(JSON.stringify(getData().filter(([sn]) => sn !== bsn)));
    const expires = new Date();

    expires.setDate(expires.getDate() + 365);

    document.cookie = `ckBH_lastBoard=${data}; domain=gamer.com.tw; path=/; expires=${expires.toUTCString()};`;

    event.target.parentNode.remove();
  }

  function getData() {
    return JSON.parse(
      decodeURIComponent(document.cookie).split('; ').find(c => c.startsWith('ckBH_lastBoard'))?.split('=')?.at(-1)
      ?? '[]'
    );
  }

  function addHomepageStyle() {
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
    document.body.insertAdjacentHTML('beforeend', '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">');
  }

  function addTopBarStyle() {
    const style = document.createElement('style');

    style.textContent = `
      .dropList > .lastBoard {
        right: unset;
        left: 0;
        display: block;
        visibility: hidden;
      }

      .dropList:hover > .lastBoard {
        visibility: visible;
        transition: visibility 0s 0.25s;
      }
    `;

    document.body.append(style);
  }
})();
