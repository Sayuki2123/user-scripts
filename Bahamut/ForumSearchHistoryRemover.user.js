// ==UserScript==
// @name         巴哈姆特 - 哈拉區搜尋紀錄個別刪除
// @namespace    Sayuki2123
// @version      1.1.0
// @description  哈拉區的搜尋紀錄可以個別刪除
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#哈拉區搜尋紀錄個別刪除
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://forum.gamer.com.tw/*.php?*bsn=*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// ==/UserScript==

(() => {

  if (!init()) {
    window.addEventListener('load', init);
  }

  function init() {
    const recentlySearch = document.getElementById('gcse-suggest-child-recently');

    if (recentlySearch == null || recentlySearch.childElementCount === 0) {
      return false;
    }

    recentlySearch.lastElementChild.addEventListener('click', removeItem, true);

    addEditButton();
    addStyle();

    return true;
  }

  function removeItem(event) {
    if (!event.target.hasAttribute('data-search-dynamic')) {
      return;
    }

    if (!event.currentTarget.parentNode.classList.contains('edit')) {
      return;
    }

    event.stopPropagation();

    const item = event.target;
    const bsn = item.dataset.bsn;
    const search = JSON.parse(localStorage.getItem('forumSearch'));
    const index = Array.prototype.indexOf.call(item.parentNode.children, item);

    console.log('刪除搜尋紀錄:', search[bsn][index]);

    search[bsn].splice(index, 1);
    localStorage.setItem('forumSearch', JSON.stringify(search));

    item.parentNode.removeChild(item);
  }

  function addEditButton() {
    const buttonEdit = document.createElement('a');

    buttonEdit.className = 'clean edit';
    buttonEdit.href = '#';
    buttonEdit.insertAdjacentHTML('beforeend', '<i class="fa fa-edit"></i>');
    buttonEdit.addEventListener('click', (event) => {
      event.preventDefault();

      const recently = document.getElementById('gcse-suggest-child-recently');

      recently.classList.toggle('edit');

      if (recently.classList.contains('edit')) {
        document.addEventListener('click', closeEdit);
      }
    });

    document.getElementById('gcse-suggest-child-recently').firstElementChild.append(buttonEdit);

    function closeEdit() {
      const recently = document.getElementById('gcse-suggest-child-recently');

      if (recently.parentNode.classList.contains('is-active')) {
        return;
      }

      recently.classList.remove('edit');
      document.removeEventListener('click', closeEdit);
    }
  }

  function addStyle() {
    const style = document.createElement('style');

    style.textContent = `
      .TOP-data .gcse-bar .gcse-option .gcse-dropdown.gcse-suggest .gcse-suggest-child h3 {
        display: block;
      }

      #gcse-suggest-child-recently.edit > h3 > .edit {
        color: var(--warning);
      }

      #gcse-suggest-child-recently.edit > .gcse-suggest-tag > a:hover {
        background: var(--warning);
      }
    `;

    document.body.append(style);
  }
})();
