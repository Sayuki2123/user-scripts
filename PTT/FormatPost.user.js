// ==UserScript==
// @name         PTT - 統一文章格式
// @namespace    Sayuki2123
// @version      1.2.0
// @description  統一 PTT 網頁版的文章和推文的格式並顯示樓層數
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/PTT#統一文章格式
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://www.ptt.cc/*/M.*.html
// @grant        none
// @run-at       document-body
// ==/UserScript==

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', formatPost);
  addStyle();

  function formatPost() {
    const mainContent = document.getElementById('main-content');

    if (mainContent == null) {
      return;
    }

    const fragment = document.createDocumentFragment();

    const done = () => document.getElementById('main-container').prepend(fragment);
    const task = setTimeout(done, 0);

    fragment.append(mainContent);

    checkMetaLine();
    checkPostLink();
    checkFooter();
    checkMissingPushTag();
    checkMissingPush();
    markPush();
    formatPush();
    formatReply();
    addClickEvent();

    done();
    clearTimeout(task);

    function checkMetaLine() {
      if (mainContent.querySelectorAll('.article-metaline').length === 3) {
        return;
      }

      for (let node of mainContent.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) {
          continue;
        }

        const metaInfo = node.textContent.match(/作者:.*?看板:.*\n標題:.*\n時間:.*\n+/)?.at(0);

        if (metaInfo == null) {
          continue;
        }

        const metaLines = metaInfo.split('\n');
        const [_, id, name, , board] = metaLines[0].trim().split(' ');
        const title = metaLines[1].trim().substring(4);
        const timespan = metaLines[2].trim().substring(4);

        const html = [
          ['作者', `${id} ${name}`],
          ['看板', board],
          ['標題', title],
          ['時間', timespan]
        ].reduce((result, [tag, value]) => (`
            ${result}
            <div class="article-metaline${tag === '看板' ? '-right' : ''}">
              <span class="article-meta-tag">${tag}</span>
              <span class="article-meta-value">${value}</span>
            </div>
          `), '')
          .replaceAll(/\n\s+/g, '');

        mainContent.insertAdjacentHTML('afterbegin', html);
        node.textContent = node.textContent.replace(metaInfo, '\n');
        document.title = `${title} - 看板 ${board} - 批踢踢實業坊`;

        break;
      }
    }

    function checkPostLink() {
      mainContent.querySelectorAll(`a[href="${location.href}"]`).forEach((link) => {
        if (link.parentNode !== mainContent) {
          return;
        }

        const previousNode = link.previousSibling;

        if (previousNode.nodeName === 'SPAN' && previousNode.textContent.startsWith('※ 文章網址:')) {
          link.textContent = link.textContent;
          previousNode.append(link);
        }
      });
    }

    function checkFooter() {
      const regex = /※ (發信站|文章網址):/;

      if (!regex.test(mainContent.textContent)) {
        return;
      }

      for (let node of mainContent.querySelectorAll('.f2')) {
        if (regex.test(node.textContent)) {
          node.classList.add('article-footer');
          break;
        }
      }
    }

    function checkMissingPushTag() {
      const regex = /\n(\[(\d;)?\d+m)?[推噓→※]\s?$/;

      mainContent.querySelectorAll('#main-content > .f3').forEach((nextNode) => {
        const node = nextNode.previousSibling;

        if (node == null) {
          return;
        }

        const targetIndex = node?.textContent.search(regex);

        if (targetIndex < 0) {
          return;
        }

        const targetText = node.textContent.substring(targetIndex);
        const newNode = document.createElement('span');

        newNode.textContent = targetText.trim().slice(-1);
        newNode.className =
          newNode.textContent === '※'
            ? 'f2'
            : newNode.textContent === '推'
              ? 'hl'
              : 'f1 hl';

        node.textContent = node.textContent.replace(targetText, '');
        node.parentNode.insertBefore(newNode, node.nextSibling);
      });
    }

    function checkMissingPush() {
      const regex = /^[推噓→※]/;

      mainContent.querySelectorAll('.hl, .f2').forEach((pushTag) => {
        if (!regex.test(pushTag.textContent)) {
          return;
        }

        if (!fixPushTag(pushTag) || pushTag.parentNode.classList.contains('push')) {
          return;
        }

        const pushId = pushTag.nextSibling;
        const pushContent = pushId.nextSibling;
        const pushDateTime = pushContent.nextSibling;
        const pushDiv = document.createElement('div');

        pushDiv.className = 'push';
        pushTag.classList.add('push-tag');
        pushId.classList.add('f3', 'hl', 'push-userid');
        pushContent.classList.add('f3', 'push-content');
        pushDateTime.classList.add('push-ipdatetime');

        // 轉錄至看板
        if (pushTag.textContent.startsWith('※')) {
          pushDiv.classList.add('not-comment');
          pushId.className = 'f2 hl push-userid';
          pushContent.className = 'f2 push-content';
          pushDateTime.className = 'f2 push-ipdatetime';
        }

        mainContent.insertBefore(pushDiv, pushTag);
        pushDiv.append(pushTag, pushId, pushContent, pushDateTime);
      });

      function fixPushTag(nodeTag) {
        if (nodeTag.nextSibling == null) {
          return false;
        }

        let remainder = null;

        if (nodeTag.textContent.length > 2) {
          if (nodeTag.textContent.startsWith('※')) {
            return false;
          }

          remainder = nodeTag.textContent.substring(2);
          nodeTag.textContent = nodeTag.textContent.substring(0, 2);
        }

        if (!fixPushId(nodeTag.nextSibling, remainder)) {
          return false;
        }

        return true;
      }

      function fixPushId(node, privRemainder = null) {
        if (node.nodeType === Node.TEXT_NODE || node.nextSibling == null) {
          return false;
        }

        let nodeId = node;
        let nextNode = node.nextSibling;
        let remainder = null;

        if (privRemainder != null) {
          nodeId = document.createElement('span');
          nodeId.textContent = privRemainder;

          nextNode = node;
          nextNode.parentNode.insertBefore(nodeId, nextNode);
        }

        if (!/^\s*[A-Za-z0-9]{1,12}\s*$/.test(nodeId.textContent)) {
          const index = nodeId.textContent.indexOf(':');

          if (index < 0) {
            console.log('[fixPushId] Error!', nodeId, nextNode);
            return false;
          }

          const id = nodeId.textContent.substring(0, index);

          if (index > 0) {
            // userid + 推文
            remainder = nodeId.textContent.substring(index);
          } else {
            // 缺少 userid
            nodeId = document.createElement('span');
            nextNode = node;

            nextNode.parentNode.insertBefore(nodeId, nextNode);
          }

          nodeId.textContent = id;
        }

        if (!fixPushContent(nextNode, remainder)) {
          return false;
        }

        return true;
      }

      function fixPushContent(node, privRemainder = null) {
        if (node.nextSibling == null) {
          return false;
        }

        let nodeContent = node;
        let nextNode = node.nextSibling;

        if (privRemainder == null) {
          if (nodeContent.nodeType === Node.TEXT_NODE) {
            return false;
          }
        } else {
          nodeContent = document.createElement('span');
          nodeContent.textContent = privRemainder;

          nextNode = node;
          nextNode.parentNode.insertBefore(nodeContent, nextNode);
        }

        fixPushDate(nextNode);

        return true;
      }

      function fixPushDate(node) {
        let nodeDateTime = node;
        let dateText;
        const regex = /((\d{1,3}\.){3}\d{1,3}\s+)?\d{2}\/\d{2}(\s+\d{2}:\d{2})?/;

        if (
          (nodeDateTime.nodeName === 'SPAN' || nodeDateTime.nodeType === Node.TEXT_NODE)
          && (dateText = nodeDateTime.textContent.match(regex)?.at(0)) != null
        ) {
          if (nodeDateTime.textContent.trim() !== dateText) {
            // ipdatetime + 其他內容
            const newNode = document.createTextNode(nodeDateTime.textContent.replace(dateText, '').trimStart());

            nodeDateTime.textContent = dateText;
            nodeDateTime.parentNode.insertBefore(newNode, nodeDateTime.nextSibling);
          }
        } else {
          let isMissingNode = false;
          let isMissingDate = false;
          let needReplaceTemp = false;

          // 可能在推文裡面，先往前面找
          let tempNode = nodeDateTime.previousSibling.lastChild;
          dateText = tempNode.textContent.match(regex)?.at(0);

          if (dateText != null) {
            isMissingNode = true;
            needReplaceTemp = true;
          } else {
            // 往後面找，直到遇到 div 或 .hl (未處理的 tag 或 userid)
            tempNode = nodeDateTime;

            while (dateText == null && (tempNode = tempNode.nextSibling) != null) {
              if (tempNode.nodeName === 'DIV' || tempNode.classList?.contains('hl')) {
                break;
              }

              dateText = tempNode.textContent.match(regex)?.at(0);
            };

            if (dateText == null || tempNode == null) {
              // 缺少 ipdatetime
              isMissingNode = true;
              isMissingDate = true;
            } else if (tempNode.textContent.trim() === dateText) {
              // ipdatetime 在後面
              nodeDateTime = tempNode;
            } else {
              // ipdatetime 在後面的 node 裡面
              isMissingNode = true;
              needReplaceTemp = true;
            }
          }

          if (isMissingNode) {
            if (nodeDateTime.textContent.trim() !== '') {
              nodeDateTime = document.createElement('span');
            }

            nodeDateTime.textContent = dateText;
          }

          if (isMissingDate) {
            nodeDateTime.classList.add('no-ipdatetime');
            console.log(`[fixPushDate] 推文「${nodeDateTime.previousSibling?.textContent}」沒有時間資訊!`);
          }

          if (needReplaceTemp) {
            tempNode.textContent = tempNode.textContent.replace(dateText, '').trimStart();
          }

          node.parentNode.insertBefore(nodeDateTime, node);
        }

        if (nodeDateTime.nodeType === Node.TEXT_NODE) {
          const newNode = document.createElement('span');

          nodeDateTime.parentNode.insertBefore(newNode, nodeDateTime);
          newNode.append(nodeDateTime);

          nodeDateTime = newNode;
        }
      }
    }

    function markPush() {
      let footerNode = mainContent.querySelector('.article-footer');

      const authorID = Array.from(mainContent.querySelectorAll('.article-meta-tag'))
        .find((tag) => tag.textContent === '作者')?.nextElementSibling?.textContent.trim().split(' ')[0];

      mainContent.querySelectorAll('.push:not(.not-comment), .article-footer').forEach((push) => {
        if (push === footerNode) {
          footerNode = null;
          return;
        }

        if (footerNode != null) {
          push.classList.add('not-comment');
          return;
        }

        const id = push.children[1]?.textContent.trim();

        push.dataset.userId = id;

        if (id === authorID) {
          push.classList.add('post-author');
        }
      });

      // 檔案過大！部分文章無法顯示
      mainContent.querySelectorAll('.push.warning-box').forEach((elem) => elem.classList.add('not-comment'));
    }

    function formatPush() {
      // push-userid
      mainContent.querySelectorAll('.push-userid').forEach((pushId) => {
        if (pushId.textContent.startsWith(' ')) {
          pushId.textContent = pushId.textContent.trim();
        }
      });

      // push-content
      mainContent.querySelectorAll('.push-content').forEach((pushContent) => {
        if (!pushContent.firstChild.textContent.startsWith(': ')) {
          pushContent.firstChild.textContent = pushContent.firstChild.textContent.replace(/^:/, ': ');
        }

        if (pushContent.lastChild.nodeType === Node.TEXT_NODE) {
          pushContent.lastChild.textContent = pushContent.lastChild.textContent.trimEnd();
        }
      });

      // push-ipdatetime
      const regex = /(\d{1,3}\.){3}\d{1,3}\s+/;

      mainContent.querySelectorAll('.push-ipdatetime').forEach((pushDateTime) => {
        pushDateTime.textContent = pushDateTime.textContent.replace(regex, '').trim();
      });

      // push-floor
      let floorCount = 0;

      mainContent.querySelectorAll('.push:not(.not-comment)').forEach((push) => {
        push.insertAdjacentHTML('beforeend', `<span class="push-floor">${++floorCount}F</span>`);
      });
    }

    function formatReply() {
      let node = mainContent.querySelector('.article-footer') ?? mainContent.querySelector('push');

      while ((node = node?.nextSibling) != null) {
        if (node.nodeName === 'DIV' || node.textContent.startsWith('◆ From:')) {
          continue;
        }

        let tempNode = null;

        if (node.nodeName === 'SPAN') {
          if (
            !(node.classList.contains('hl') || node.className === 'f3')
            || (node.classList.contains('f0') && node.textContent.includes('刪除'))
            || node.textContent.startsWith('＠')
          ) {
            continue;
          }

          if (node.className === 'f3' || node.className === 'hl') {
            tempNode = node;
          }
        }

        if (node.nodeName === '#text' && node.textContent === '\n') {
          if (node.previousSibling.nodeName === 'SPAN') {
            node.previousSibling.append(node);
            node = node.parentNode;
            continue;
          }
        }

        let reply = node.previousSibling;

        if (reply.className !== 'reply post-author') {
          reply = document.createElement('div');
          reply.className = 'reply post-author';

          mainContent.insertBefore(reply, node);
        }

        reply.append(tempNode?.firstChild ?? node);
        tempNode?.remove();

        node = reply;
      }

      mainContent.querySelectorAll('.reply').forEach((reply) => {
        reply.firstChild.textContent = reply.firstChild.textContent.trimStart();
        reply.lastChild.textContent = reply.lastChild.textContent.trimEnd();
      });
    }

    function addClickEvent() {
      // 在頂端列加入文章標題，點擊可以在新分頁開啟同標題文章的搜尋結果
      const title = Array.from(mainContent.querySelectorAll('.article-meta-tag'))
        .find((tag) => tag.textContent === '標題')?.nextElementSibling?.textContent;

      if (title != null) {
        const boardName = document.querySelector('.board-label')?.nextSibling?.textContent;
        const href = encodeURI(`/bbs/${boardName}/search?q=${title.replace('Re:', '').replaceAll(' ', '+')}`);

        document.getElementById('topbar').insertAdjacentHTML('beforeend', `
          <span>›</span>
          <a style="float: none;" href="${href}" title="搜尋同標題文章">${title}</a>
        `);
      }

      // 點擊推文醒目標示相同帳號的所有推文
      document.addEventListener('click', (event) => {
        if (event.target.nodeName === 'A') {
          return;
        }

        const push = event.target.closest('.push:not(.not-comment)');
        const selected = push?.classList.contains('selected');

        document.querySelectorAll('.selected').forEach((selected) => selected.classList.remove('selected'));

        if (push != null && !selected) {
          document.querySelectorAll(`.push[data-user-id="${push.dataset.userId}"`)
            .forEach((push) => push.classList.add('selected'));
        }
      });
    };
  }

  function addStyle() {
    const style = document.createElement('style');

    style.textContent = `
      #topbar {
        overflow: hidden;
        white-space: nowrap;
      }

      #main-content a {
        line-height: 130%;
      }

      .push-tag {
        width: 3ch;
        min-width: unset;
      }

      .push-userid {
        display: inline-block;
        width: 150px;
      }

      .push-floor {
        float: right;
        margin-right: 1ch;
        font-size: smaller;
        color: #888888;
      }

      .post-author {
        background-color: #222222;
      }

      .selected {
        background-color: #502020;
      }

      .reply {
        padding-left: calc(5ch + 150px);
        line-height: 130%;
      }

      #navigation-container {
        visibility: hidden;
      }
    `;

    document.head.append(style);
  }
})();
