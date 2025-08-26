// ==UserScript==
// @name         巴哈姆特 - 稍後觀看
// @namespace    Sayuki2123
// @version      1.1.0
// @description  在哈拉區加入稍後觀看的功能
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#稍後觀看
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://*.gamer.com.tw/*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        GM_setValue
// @grant        GM_getValue
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const addWatchLaterList = () => {
    const topBar = document.getElementById('topBar_forum');

    if (topBar == null) {
      return false;
    }

    topBar.addEventListener('click', showWatchLaterList, { once: true });
    addStyle();

    return true;
  };

  if (!addWatchLaterList()) {
    window.addEventListener('load', addWatchLaterList);
  }

  if (location.hostname === 'forum.gamer.com.tw' && /(?=.*bsn)(?=.*[^b]snA?)/.test(location.search)) {
    addWatchLaterButton();
    startObserver();
  }

  // main program end

  function showWatchLaterList() {
    const msgList = document.getElementById('topBarMsgList_forum');

    if (msgList == null) {
      setTimeout(showWatchLaterList, 200);
      return;
    }

    const data = getData();
    const container = document.createElement('ul');

    container.className = 'wa-list';

    for (const [key, itemInfo] of Object.entries(data)) {
      container.insertAdjacentHTML('beforeend', createItem(key, itemInfo));
    }

    container.insertAdjacentHTML('beforeend', '<li class="wa-tmp"><div class="wa-effect"></div></li>');
    container.addEventListener('click', (event) => {
      if (!event.target.classList?.contains('wa-remove')) {
        return;
      }

      const link = event.target.parentNode.previousElementSibling;
      const removeFromWatchLater = () => {
        const currentItem = event.target.closest('.wa-item');
        const { [currentItem.dataset.id]: _, ...data } = getData();

        setData(data);
        currentItem.remove();

        console.log(`[稍後觀看] 已從列表刪除 - ${link.title} ${link.href}`);
      };

      if (event.shiftKey) {
        event.stopImmediatePropagation();
        removeFromWatchLater();

        return;
      }

      unsafeWindow.Dialogify.confirm(`
        ${link.title}
        <br><br>
        <span class="is-error">確定要刪除嗎?</span>
      `, {
        ok: removeFromWatchLater,
        dialogOptions: {
          dialog: {
            style: { 'font-size': '16px' },
            className: 'TOP-msg',
            contentClassName: 'text-center'
          }
        }
      });
    });

    msgList.append(container);

    addSortEvent(container, container.lastElementChild, '.wa-item');

    function addSortEvent(container, tempElement, itemSelector) {
      const currentState = {
        item: null,
        target: null,
        offsetX: 0,
        offsetY: 0,
        hasMoved: false
      };

      container.addEventListener('mousedown', mouseDown);

      function mouseDown(event) {
        event.preventDefault();

        if (event.buttons > 1 || currentState.item != null) {
          return;
        }

        currentState.item = event.target.closest(itemSelector);

        if (currentState.item == null) {
          return;
        }

        currentState.offsetX = event.offsetX;
        currentState.offsetY = event.offsetY;
        currentState.hasMoved = false;

        document.addEventListener('mouseup', mouseUp);
        document.addEventListener('mousemove', mouseMove);
        container.addEventListener('mouseover', mouseOver);
        container.addEventListener('mouseout', mouseOut);
      }

      function mouseUp() {
        document.removeEventListener('mouseup', mouseUp);
        document.removeEventListener('mousemove', mouseMove);
        container.removeEventListener('mouseover', mouseOver);
        container.removeEventListener('mouseout', mouseOut);

        if (currentState.hasMoved) {
          sortList();
        }

        currentState.item?.removeAttribute('style');
        currentState.item = null;

        setTargetStyle(false, false);
      }

      function mouseMove(event) {
        if (currentState.item == null) {
          return;
        }

        if (!currentState.hasMoved) {
          if (
            Math.abs(event.offsetX - currentState.offsetX) < 5
            && Math.abs(event.offsetY - currentState.offsetY) < 5
          ) {
            return;
          }

          currentState.hasMoved = true;
          tempElement.append(currentState.item);
        }

        currentState.item.style.left = `${event.clientX - currentState.offsetX}px`;
        currentState.item.style.top = `${event.clientY - currentState.offsetY}px`;
      }

      function mouseOver(event) {
        if (currentState.item == null) {
          return;
        }

        currentState.target = event.target.closest(itemSelector);

        if (currentState.target == null) {
          return;
        }

        setTargetStyle(true, false);
      }

      function mouseOut() {
        if (currentState.item == null) {
          return;
        }

        setTargetStyle(false, true);
      }

      function setTargetStyle(isTarget, isTemp) {
        const className = 'wa-target';

        if (isTarget) {
          currentState.target?.classList.add(className);
        } else {
          currentState.target?.classList.remove(className);
          currentState.target = null;
        }

        if (isTemp) {
          tempElement.classList.add(className);
        } else {
          tempElement.classList.remove(className);
        }
      }

      function sortList() {
        container.insertBefore(currentState.item, currentState.target ?? container.lastElementChild);

        const orignalData = getData();
        const keys = Array.from(container.querySelectorAll(itemSelector)).map((item) => item.dataset.id);
        const newData = Object.entries(orignalData).sort(([a], [b]) => {
          const idx1 = keys.indexOf(a);
          const idx2 = keys.indexOf(b);

          return (idx1 - idx2);
        });

        setData(Object.fromEntries(newData));
      }
    }
  }

  function addWatchLaterButton() {
    const toolbar = document.querySelector('.c-menu__scrolldown > .toolbar');

    toolbar.insertAdjacentHTML('beforeend', '<a><i class="fa fa-tag" aria-hidden="true"></i>稍後觀看</a>');
    toolbar.lastElementChild.addEventListener('click', (event) => {
      event.preventDefault();

      const data = getData();
      const { bsn, sn, key } = getSn();

      if (Object.prototype.hasOwnProperty.call(data, key)) {
        showMessage('已經在稍後觀看了!');

        return;
      }

      const itemInfo = {
        title: document.title.substring(0, document.title.length - 11),
        type: location.pathname.match(/\w+(?=\.php)/)[0],
        bsn: bsn,
        sn: sn,
        floor: 1
      };

      data[key] = itemInfo;
      setData(data);

      document.querySelector('.wa-tmp')?.insertAdjacentHTML('beforebegin', createItem(key, itemInfo));

      startObserver();
      showMessage('已加入至稍後觀看');
    });
  }

  function startObserver() {
    if (document.getElementById('BH-master').hasAttribute('wa-observed')) {
      return;
    }

    const { key } = getSn();

    if (!Object.prototype.hasOwnProperty.call(getData(), key)) {
      return;
    }

    document.getElementById('BH-master').setAttribute('wa-observed', '');

    const rangeHeight = 10;
    const topY = 240;
    const BottomY = window.innerHeight - topY - rangeHeight;

    const observer = new IntersectionObserver(recordFloor, {
      rootMargin: `-${topY}px 0px -${BottomY}px 0px`
    });

    document.querySelectorAll('.c-user__avatar').forEach((card) => observer.observe(card));

    function recordFloor(entries) {
      const entry = entries.find((e) => e.isIntersecting);
      const floor = entry?.target.closest('.c-section')?.querySelector('.floor')?.dataset.floor;

      if (floor == null) {
        return;
      }

      const data = getData();

      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        return;
      }

      data[key].floor = parseInt(floor) || 1;
      setData(data);
    }
  }

  function createItem(key, itemInfo) {
    return (`
      <li class="wa-item" data-id="${key}">
        <div class="wa-effect"></div>
        <div class="wa-link">
          <a
            href="//forum.gamer.com.tw/${itemInfo.type}.php?bsn=${itemInfo.bsn}&sn${itemInfo.type === 'C' ? 'A' : ''}=${itemInfo.sn}&to=${itemInfo.floor}"
            title="${itemInfo.title}">
            ${itemInfo.title}
          </a>
          <span title="刪除 (按住 Shift 直接刪除)"><i class="fa fa-remove fa-lg wa-remove"></i></span>
        </div>
      </li>
    `);
  }

  function setData(data) {
    GM_setValue('forumWatchLater', JSON.stringify(data));
  }

  function getData() {
    return JSON.parse(GM_getValue('forumWatchLater', '{}'));
  }

  function getSn() {
    const bsn = parseInt(location.search.match(/(?<=bsn=)\d+/)[0]);
    const sn = parseInt(location.search.match(/(?<=[^b]snA?=)\d+/)[0]);

    return {
      bsn: bsn,
      sn: sn,
      key: `${bsn}_${sn}`
    };
  }

  function showMessage(msg) {
    if ('toastr' in unsafeWindow) {
      unsafeWindow.toastr.success(msg, null, { timeOut: 2000, positionClass: 'toast-top-center' });
    } else {
      unsafeWindow.Dialogify.alert(`<p class="dialogify__content-box text-center">${msg}</p>`);
    }
  }

  function addStyle() {
    const style = document.createElement('style');

    style.id = 'styleWatchLater';
    style.textContent = `
      #topBarMsg_forum .TOP-msglist > .wa-list {
        padding: 0.5em 0.5em 0 0;
        margin: 0.5em 0 0 0;
        line-height: unset;
        border-top: solid 1px #E5E5E5;
        border-bottom: none;
      }

      .wa-effect {
        display: none;
        height: 22px;
        border: 1px dashed #249DB8;
      }

      .wa-target > .wa-effect {
        display: block;
      }

      .wa-target > .wa-link {
        pointer-events: none;
      }

      .wa-link > a {
        width: unset;
        max-width: 90%;
        text-overflow: ellipsis;
      }

      .wa-link > span {
        visibility: hidden;
        float: right;
        cursor: pointer;
      }

      .wa-link:hover > span {
        visibility: visible;
      }

      .fa-lg.wa-remove {
        font-size: 18px;
        line-height: 24px;
        color: var(--warning);
      }

      .wa-tmp > .wa-item {
        position: fixed;
        cursor: move;
        pointer-events: none;
      }

      .wa-tmp > .wa-item > .wa-link > a {
        max-width: 100%;
        color: var(--warning);
      }
    `;

    document.body.append(style);
  }
})();
