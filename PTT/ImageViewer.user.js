// ==UserScript==
// @name         PTT - 圖片檢視器
// @namespace    Sayuki2123
// @version      1.1.1
// @description  在 PTT 網頁版使用 PhotoSwipe 檢視圖片
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/PTT#圖片檢視器
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://www.ptt.cc/*/M.*.html
// @grant        none
// @run-at       document-body
// ==/UserScript==

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementsByTagName('img').length === 0) {
      return;
    }

    classifyImages();
    addPhotoSwipe();

    document.getElementById('main-content').addEventListener('click', showImage);
  });

  function showImage(event) {
    const img = event.target;

    if (img.nodeName !== 'IMG') {
      return;
    }

    if (img.dataset.group === undefined) {
      classifyImages();
    }

    const imageList = [];
    const options = {
      bgOpacity: 0.8,
      clickToCloseNonZoomable: false,
      errorMsg: '<div class="pswp__error-msg">無法載入<a href="%url%" target="_blank">圖片</a></div>',
      history: false,
      index: parseInt(img.dataset.index) || 0,
      getDoubleTapZoom: ZoomImage
    };

    document.querySelectorAll(`img[data-group="${parseInt(img.dataset.group)}"]`)
      .forEach((image) => imageList.push({ src: image.src, w: 0, h: 0 }));

    const gallery = new window.PhotoSwipe(document.querySelector('.pswp'), PhotoSwipeUI_Default, imageList, options);

    gallery.listen('gettingData', getData);
    gallery.init();
  }

  function ZoomImage(_, item) {
    if (item.currentZoomLevel === undefined) {
      item.currentZoomLevel = item.initialZoomLevel;
    }

    let level;

    if (item.currentZoomLevel <= 0.3) {
      level = 0.5;
    } else if (item.currentZoomLevel < 1) {
      level = 1;
    } else if (item.currentZoomLevel < 2) {
      level = 2;
    } else {
      level = item.initialZoomLevel;
    }

    item.currentZoomLevel = level;
    return level;
  }

  function getData(_, item) {
    if (item.onLoading !== undefined || item.w > 0 || item.h > 0) {
      return;
    }

    const gallery = this;
    const image = new Image;

    image.onload = function () {
      if (gallery.panAreaSize === undefined && item.vGap != null) {
        gallery.panAreaSize = {
          x: gallery.viewportSize.x,
          y: gallery.viewportSize.y - item.vGap.top - item.vGap.bottom
        };
      }

      item.w = this.naturalWidth;
      item.h = this.naturalHeight;

      gallery.invalidateCurrItems();
      gallery.updateSize(true);
    };

    image.src = item.src;
    item.onLoading = true;
  }

  function classifyImages() {
    const mainContent = document.getElementById('main-content');

    const patternSignature = /\n--\n/g;
    const patternFooter = /※ (發信站|文章網址):/;

    let signatureCount = mainContent.textContent.match(patternSignature)?.length ?? 0;
    const hasFooter = patternFooter.test(mainContent.textContent);

    let currentSession = 0;
    let imgCount = 0;
    patternSignature.lastIndex = 0;

    mainContent.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // 簽名檔開始
        if (currentSession === 0 && patternSignature.test(node.textContent)) {
          if (signatureCount > 2) {
            signatureCount = signatureCount - node.textContent.match(patternSignature).length;
          } else if (signatureCount === 2) {
            currentSession = 1;
            imgCount = 0;
          }
        }

        patternSignature.lastIndex = 0;
        return;
      }

      if (node.nodeName === 'SPAN') {
        // 推文開始
        if (currentSession < 2 && hasFooter && patternFooter.test(node.textContent)) {
          currentSession = 2;
          imgCount = 0;
        }

        return;
      }

      if (!node.className.includes('richcontent')) {
        return;
      }

      node.querySelectorAll('img').forEach((img) => {
        img.dataset.group = currentSession;
        img.dataset.index = imgCount++;
      });
    });
  }

  function addPhotoSwipe() {
    document.body.append(document.createRange().createContextualFragment(`
      <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="pswp__bg"></div>
        <div class="pswp__scroll-wrap">
          <div class="pswp__container">
            <div class="pswp__item"></div>
            <div class="pswp__item"></div>
            <div class="pswp__item"></div>
          </div>
          <div class="pswp__ui pswp__ui--hidden">
            <div class="pswp__top-bar">
              <div class="pswp__counter"></div>
              <button class="pswp__button pswp__button--close" title="關閉 (Esc)"></button>
              <button class="pswp__button pswp__button--fs" title="切換全螢幕"></button>
              <div class="pswp__preloader">
                <div class="pswp__preloader__icn">
                  <div class="pswp__preloader__cut">
                    <div class="pswp__preloader__donut"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
              <div class="pswp__share-tooltip"></div>
            </div>
            <button class="pswp__button pswp__button--arrow--left" title="上一張"></button>
            <button class="pswp__button pswp__button--arrow--right" title="下一張"></button>
            <div class="pswp__caption">
              <div class="pswp__caption__center"></div>
            </div>
          </div>
        </div>
      </div>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/default-skin/default-skin.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe-ui-default.min.js"></script>
      <style>img { cursor: pointer; } .pswp__img { max-height: none; }</style>
    `));
  }
})();
