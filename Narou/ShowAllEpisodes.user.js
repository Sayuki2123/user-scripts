// ==UserScript==
// @name         なろう - 目次ページにすべてのエピソードを表示します
// @name:zh-TW   なろう - 目錄頁面顯示全部章節
// @namespace    Sayuki2123
// @version      1.0.0
// @description  目次ページで全エピソードを表示するボタンを追加します。また、すべてのページリンクを表示します
// @description:zh-TW  在目錄頁增加顯示所有章節的按鈕，並顯示所有頁次的連結
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Narou#目錄頁面顯示全部章節
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://ncode.syosetu.com/*
// @icon         https://www.google.com/s2/favicons?sz=32&domain=ncode.syosetu.com
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (document.querySelector('.c-pager__item--last') == null) {
    return;
  }

  const { currentPage, lastPage } = getPageIndex();

  if (lastPage <= 10) {
    addDirectLink(currentPage, lastPage);
    addStyle();
  } else {
    addDropDownList(currentPage, lastPage);
  }

  addShowAllEpisodesButton();

  function addDirectLink(currentPage, lastPage) {
    let html = '';

    for (let i = 1; i <= lastPage; i++) {
      if (i === currentPage) {
        html += `<span class="c-pager__item">${i}</span>`;
      } else {
        html += `<a href="?p=${i}" class="c-pager__item">${i}</a>`;
      }
    }

    document.querySelectorAll('.c-pager__item--next').forEach((nextLink) => {
      nextLink.insertAdjacentHTML('beforebegin', html);
    });
  }

  function addDropDownList(currentPage, lastPage) {
    const list = document.createElement('select');

    list.className = 'c-pager__item';
    list.style.color = 'var(--color-text)';
    list.style.borderRight = 'none';

    for (let i = 1; i <= lastPage; i++) {
      list.insertAdjacentHTML('beforeend', `<option value="?p=${i}">${i}</option>`);
    }

    list.children[currentPage - 1].setAttribute('selected', '');

    document.querySelectorAll('.c-pager__pager').forEach((pager) => {
      const pageList = list.cloneNode(true);

      pageList.addEventListener('change', function () { location.href = this.value; });
      pager.insertBefore(pageList, pager.children[2]);
    });
  }

  function addShowAllEpisodesButton() {
    document.querySelectorAll('.c-pager__result-stats').forEach((button) => {
      button.title = '全エピソードを表示する';
      button.style.color = 'var(--color-reaction-new-bg)';
      button.style.cursor = 'pointer';

      button.addEventListener('click', getAllEpisodes);
    });
  }

  async function getAllEpisodes() {
    document.querySelectorAll('.c-pager__result-stats').forEach((button) => {
      button.removeAttribute('style');
      button.removeEventListener('click', getAllEpisodes);
    });

    const parser = new DOMParser();
    let episodeList = document.createElement('div');

    document.querySelector('.p-eplist').prepend(episodeList);

    const { currentPage, lastPage } = getPageIndex();

    for (let i = 1; i <= lastPage; i++) {
      if (i === currentPage) {
        episodeList = episodeList.parentNode;
        continue;
      }

      const response = await fetch(`?p=${i}`);

      if (response.ok) {
        const html = await response.text();
        const doc = parser.parseFromString(html, 'text/html');

        episodeList.append(...doc.querySelector('.p-eplist').children);
      }

      await delay(100);
    }

    document.querySelectorAll('.c-pager').forEach((pager) => {
      pager.style.display = 'none';
    });

  }

  function getPageIndex() {
    const regex = /(?<=p=)\d+/;
    const currentPage = parseInt(location.search.match(regex)?.at(0)) || 1;
    const lastPage = parseInt(document.querySelector('.c-pager__item--last').href?.match(regex)?.at(0)) || currentPage;

    return {
      currentPage: currentPage,
      lastPage: lastPage
    };
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function addStyle() {
    const style = document.createElement('style');

    style.textContent = '.l-main { width: 800px; }';

    document.body.append(style);
  }
})();
