// ==UserScript==
// @name         巴哈姆特動畫瘋 - 截圖工具
// @namespace    Sayuki2123
// @version      1.0.0
// @description  動畫瘋的截圖工具，可以記錄截圖並提供時間跳轉、預覽、複製、下載以及合併截圖等功能
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BahamutAnime#截圖工具
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://ani.gamer.com.tw/animeVideo.php?sn=*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const aniVideo = document.getElementById('ani_video');
  const videoElement = document.getElementById('ani_video_html5_api');

  videoElement.addEventListener('play', () => {
    setupGallery();

    aniVideo.addEventListener('keydown', onHotkey);
    aniVideo.addEventListener('keyup', onHotkey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.querySelector('.vjs-res-button .vjs-menu-content').addEventListener('click', onResolutionChange);

    videoElement.addEventListener('loadeddata', () => {
      if (!aniVideo.classList.contains('vjs-ad-playing')) {
        setTimeout(onResolutionChange, 1000);
      }
    });
  }, { once: true });

  // main program end

  const currentState = {
    gallery: null,
    toolbar: null,
    itemList: null,
    mainSlider: null,
    selectedItems: [],
    selectedNumber: 0,
    currentPreviewItem: null,
    isSliderHiddenInPreview: false,
    resizeObserver: null,
    quickCollageMode: false,
    quickCollageItems: []
  };

  const aniMaid = {
    player: aniVideo.player,
    getCurrentTime() {
      return this.player.currentTime();
    },
    setCurrentTime(value) {
      this.player.currentTime(value);
    },
    play() {
      this.player.play();
    },
    pause() {
      this.player.pause();
    },
    isPaused() {
      return this.player.paused();
    },
    isFullscreen() {
      return (document.fullscreenElement != null);
    }
  };

  // #region event handlers

  const keyEvents = {
    keydown: {
      Insert: toggleQuickCollageMode
    },
    keyup: {
      PrintScreen: takeScreenshot
    }
  };

  function onHotkey(event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (document.activeElement.id === 'danmutxt') {
      return;
    }

    const key = event.key.length > 1 ? event.key : event.key.toUpperCase();

    if (key in keyEvents[event.type]) {
      if (key !== 'PrintScreen') {
        event.preventDefault();
      }

      keyEvents[event.type][key](event);
    }
  }

  function onFullscreenKeyDown(event) {
    if (event.key !== 'g' || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (document.activeElement.id === 'danmutxt') {
      return;
    }

    if (!isFullscreenMode()) {
      enterFullscreenMode();
    } else {
      exitFullscreenMode();
    }
  }

  function onFullscreenChange() {
    if (aniMaid.isFullscreen()) {
      document.addEventListener('keydown', onFullscreenKeyDown);
      videoElement.addEventListener('play', exitFullscreenMode);
    } else {
      exitFullscreenMode();

      document.removeEventListener('keydown', onFullscreenKeyDown);
      videoElement.removeEventListener('play', exitFullscreenMode);
    }
  }

  function onResolutionChange() {
    const slider = currentState.mainSlider;

    const videoHeight = parseInt(localStorage.getItem('ANIME_quality')) || videoElement.videoHeight;

    const originalHeight = parseInt(slider.style.getPropertyValue('--video-height')) || videoHeight;
    const top = parseInt(slider.style.getPropertyValue('--value-top')) / originalHeight || 0.12;
    const bottom = parseInt(slider.style.getPropertyValue('--value-bottom')) / originalHeight || 0.035;

    const valueTop = Math.round(videoHeight * top);
    const valueBottom = Math.round(videoHeight * bottom);

    slider.style.setProperty('--video-height', videoHeight);
    slider.style.setProperty('--value-top', valueTop);
    slider.style.setProperty('--value-bottom', valueBottom);

    slider.firstElementChild.max = videoHeight;
    slider.firstElementChild.value = valueTop;

    slider.lastElementChild.max = videoHeight;
    slider.lastElementChild.value = valueBottom;
  }

  // #endregion

  // #region keyboard event functions

  function toggleQuickCollageMode() {
    currentState.quickCollageMode = !currentState.quickCollageMode;

    if (currentState.quickCollageMode) {
      aniVideo.classList.add('is-slider-enabled');
      currentState.mainSlider.classList.add('is-enabled');
    } else {
      aniVideo.focus();
      aniVideo.classList.remove('is-slider-enabled');
      currentState.mainSlider.classList.remove('is-enabled');

      if (currentState.quickCollageItems.length > 1) {
        createCollage(currentState.quickCollageItems, false);
      }

      currentState.quickCollageItems.length = 0;
    }
  }

  function takeScreenshot() {
    const item = createScreenshot();

    if (currentState.quickCollageMode) {
      currentState.quickCollageItems.push(item);
    }
  }

  // #endregion

  // #region gallery functions

  function createScreenshot() {
    const canvas = document.createElement('canvas');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);

    return createGalleryItem(canvas, aniMaid.getCurrentTime());
  }

  function createCollage(items, showResult) {
    if (items.length < 2) {
      return;
    }

    const datas = [];

    items.forEach((item) => {
      if (item.isMerged) {
        return;
      }

      datas.push({
        isMainImage: item.classList.contains('is-pinned'),
        source: item.image,
        top: parseInt(item.slider.firstElementChild.value),
        bottom: parseInt(item.slider.lastElementChild.value)
      });
    });

    if (datas.findIndex(({ isMainImage }) => isMainImage) < 0) {
      datas[0].isMainImage = true;
    }

    const canvas = document.createElement('canvas');
    let mainImageHeight = 0;

    canvas.width = videoElement.videoWidth;
    canvas.height = datas.reduce((totalHeight, { isMainImage, source, top, bottom }) => {
      if (isMainImage) {
        mainImageHeight = source.naturalHeight - top;
        totalHeight += mainImageHeight;
      }

      return totalHeight + top - bottom;
    }, 0);

    const context = canvas.getContext('2d');
    let currentHeight = mainImageHeight;

    datas.forEach(({ isMainImage, source, top, bottom }) => {
      if (isMainImage) {
        context.drawImage(source,
          0, 0, source.naturalWidth, mainImageHeight,
          0, 0, canvas.width, mainImageHeight);
      }

      const height = top - bottom;

      if (height <= 0) {
        return;
      }

      context.drawImage(source,
        0, source.naturalHeight - top, source.naturalWidth, height,
        0, currentHeight, canvas.width, height);

      currentHeight += height;
    });

    const result = createGalleryItem(canvas);

    if (showResult) {
      openPreview(result);
    }
  }

  function updateToolbarState() {
    if (currentState.selectedItems.length === 0) {
      currentState.toolbar.classList.add('is-disabled');
    } else {
      currentState.toolbar.classList.remove('is-disabled');
    }
  }

  function checkItemSelected(item) {
    return currentState.selectedItems.includes(item);
  }

  function selectItems(items) {
    if (typeof items.forEach === 'function') {
      items.forEach(selectItem);
    } else {
      selectItem(items);
    }

    updateToolbarState();

    function selectItem(item) {
      if (checkItemSelected(item)) {
        return;
      }

      item.classList.add('is-selected');

      if (!item.isMerged) {
        item.dataset.index = ++currentState.selectedNumber;
      }

      currentState.selectedItems.push(item);
    }
  }

  function unselectItems(items) {
    const count = currentState.selectedNumber;

    if (typeof items.forEach === 'function') {
      items.forEach(unselectItem);
    } else {
      unselectItem(items);
    }

    if (items === currentState.selectedItems) {
      currentState.selectedItems.length = 0;
    }

    if (currentState.selectedNumber < count) {
      currentState.selectedNumber = 0;

      currentState.selectedItems.forEach((item) => {
        if (item.isMerged) {
          return;
        }

        item.dataset.index = ++currentState.selectedNumber;
      });
    }

    updateToolbarState();

    function unselectItem(item, _, list) {
      const index = currentState.selectedItems.indexOf(item);

      if (index < 0) {
        return;
      }

      item.classList.remove('is-selected', 'is-pinned');

      if (!item.isMerged) {
        item.removeAttribute('data-index');
        currentState.selectedNumber--;
      }

      if (list !== currentState.selectedItems) {
        currentState.selectedItems.splice(index, 1);
      }
    };
  }

  function pickItems(currentItem) {
    const items = Array.from(currentState.itemList.children);
    const currentIndex = items.indexOf(currentItem);
    let targetIndex = items.findLastIndex((item, index) => {
      return index < currentIndex && checkItemSelected(item);
    });

    if (targetIndex < 0) {
      targetIndex = items.findIndex((item, index) => {
        return index > currentIndex && checkItemSelected(item);
      });
    }

    if (targetIndex < currentIndex) {
      selectItems(items.filter((_, index) => targetIndex < index && index <= currentIndex));
    } else {
      selectItems(items.filter((_, index) => currentIndex <= index && index < targetIndex).reverse());
    }
  }

  function removeItems(items) {
    if (typeof items.forEach === 'function') {
      items.forEach(removeItem);
    } else {
      removePreview();
      removeItem(items);
    }

    unselectItems(items);

    function removeItem(item) {
      item.remove();
    }
  }

  function pinItem(item) {
    const hasPinned = item.classList.contains('is-pinned');

    if (!hasPinned) {
      document.querySelector('.is-pinned')?.classList.remove('is-pinned');
    }

    item.classList.toggle('is-pinned');
  }

  async function copyImage(item, elem) {
    try {
      const response = await fetch(item.image.src);
      const blob = await response.blob();
      const data = [new ClipboardItem({ [blob.type]: blob })];

      await navigator.clipboard.write(data);

      elem.classList.add('is-copied');
      setTimeout(() => elem.classList.remove('is-copied'), 1500);
    }
    catch (error) {
      console.error('複製圖片失敗', error);
    }
  }

  function downloadImages(items) {
    if (typeof items.forEach === 'function') {
      items.forEach(downloadImage);
    } else {
      downloadImage(items);
    }

    unselectItems(items);

    function downloadImage(item) {
      const name = item.querySelector('.animaid-gallery__control--timestamp')?.textContent.replace(':', '') ?? '合併';
      const link = document.createElement('a');

      link.href = item.image.src;
      link.download = `${window.animefun.title} - ${name}.png`;

      link.click();
    };
  }

  function jumpToTime(item) {
    if (item.timestamp < 0) {
      return;
    }

    if (isFullscreenMode()) {
      exitFullscreenMode();
    }

    if (isPreviewMode()) {
      closePreview();
    }

    aniMaid.setCurrentTime(item.timestamp);
    aniMaid.play();
    aniVideo.focus();
  }

  function toggleSlider(item) {
    currentState.isSliderHiddenInPreview = !currentState.isSliderHiddenInPreview;
    item.classList.toggle('is-slider-hidden');
  }

  function setSliderWidth(slider, baseWidth) {
    slider?.style.setProperty('--thumb-width', `${baseWidth * 0.9}px`);
  }

  function setSliderPosition(currentSlider, value) {
    const currentValue = value || parseInt(currentSlider.value);
    const position = currentSlider.className.match(/(?<=--)\w+/)[0];

    currentSlider.value = currentValue;
    currentSlider.parentNode.style.setProperty(`--value-${position}`, currentValue);

    const anotherSlider = currentSlider.nextElementSibling ?? currentSlider.previousElementSibling;
    const anotherValue = parseInt(anotherSlider.value);

    if (
      position === 'top' && currentValue < anotherValue
      || position === 'bottom' && currentValue > anotherValue
    ) {
      anotherSlider.value = currentValue;
      currentSlider.parentNode.style.setProperty(`--value-${position === 'top' ? 'bottom' : 'top'}`, currentValue);
    }
  }

  // #region fullscreen mode

  function enterFullscreenMode() {
    aniMaid.pause();

    currentState.gallery.classList.add('is-fullscreen-mode', 'toast-top-center');
    currentState.gallery.addEventListener('click', exitFullscreenMode);
  }

  function exitFullscreenMode() {
    currentState.gallery.classList.remove('is-fullscreen-mode', 'toast-top-center');
    currentState.gallery.removeEventListener('click', exitFullscreenMode);

    if (isPreviewMode()) {
      closePreview();
    }

    if (aniMaid.isFullscreen() && !aniVideo.classList.contains('vjs-ended')) {
      aniVideo.focus();
      aniMaid.play();
    }
  }

  function isFullscreenMode() {
    return currentState.gallery.classList.contains('is-fullscreen-mode');
  }

  // #endregion

  // #region preview mode

  function setPreview(item) {
    currentState.currentPreviewItem?.classList.remove('is-current', 'is-slider-hidden');
    currentState.currentPreviewItem = item;

    if (item == null) {
      return;
    }

    item.classList.add('is-current');

    if (currentState.isSliderHiddenInPreview) {
      item.classList.add('is-slider-hidden');
    }

    item.scrollTo(0, 0);
    setSliderWidth(item.slider, item.clientWidth);
  }

  function openPreview(item) {
    if (item == null) {
      return;
    }

    currentState.gallery.classList.add('is-preview-mode');
    document.body.classList.add('is-preview-mode');

    document.addEventListener('keydown', previewKeydown);

    setPreview(item);
  }

  function closePreview() {
    currentState.gallery.classList.remove('is-preview-mode');
    document.body.classList.remove('is-preview-mode');

    document.removeEventListener('keydown', previewKeydown);

    setPreview(null);
  }

  function previousPreview() {
    setPreview(
      currentState.currentPreviewItem.previousElementSibling
      ?? currentState.currentPreviewItem.parentNode.lastElementChild
    );
  }

  function nextPreview() {
    setPreview(
      currentState.currentPreviewItem.nextElementSibling
      ?? currentState.currentPreviewItem.parentNode.firstElementChild
    );
  }

  function removePreview() {
    if (!isPreviewMode()) {
      return;
    }

    const nexetItem = currentState.currentPreviewItem.nextElementSibling
      ?? currentState.currentPreviewItem.previousElementSibling;

    if (nexetItem != null) {
      setPreview(nexetItem);
    } else {
      closePreview();
    }
  }

  function isPreviewMode() {
    return currentState.currentPreviewItem != null;
  }

  // #endregion

  // #endregion

  // #region gallery event handler

  function onToolbarClick(event) {
    if (event.target === event.currentTarget) {
      return;
    }

    event.stopPropagation();

    const action = event.target.dataset.action ?? event.target.parentNode.dataset.action;

    switch (action) {
      case 'select':
        if (event.currentTarget.classList.contains('is-disabled')) {
          selectItems(Array.from(currentState.itemList.children));
        } else {
          unselectItems(currentState.selectedItems);
        }

        break;

      case 'collage':
        createCollage(currentState.selectedItems, true);
        unselectItems(currentState.selectedItems);
        break;

      case 'download':
        downloadImages(currentState.selectedItems);
        break;

      case 'remove':
        removeItems(currentState.selectedItems);
        break;

      default:
    }
  }

  function onGalleryItemClick(event) {
    if (event.target === event.currentTarget) {
      if (isPreviewMode()) {
        event.stopPropagation();
        closePreview();
      }

      return;
    }

    event.stopPropagation();

    if (event.target.nodeName === 'INPUT') {
      return;
    }

    const currentItem = event.target.closest('.animaid-gallery__item');
    const action = event.target.dataset.action ?? event.target.parentNode.dataset.action;

    switch (action) {
      case 'jump':
        jumpToTime(currentItem);
        break;

      case 'pin':
        pinItem(currentItem);
        break;

      case 'view':
        openPreview(currentItem);
        break;

      case 'copy':
        copyImage(currentItem, event.target.parentNode);
        break;

      case 'download':
        downloadImages(currentItem);
        break;

      case 'remove':
        removeItems(currentItem);
        break;

      case 'hide':
        if (isPreviewMode()) {
          toggleSlider(currentItem);
          break;
        }

      default:
        const isSelected = checkItemSelected(currentItem);
        const isPinned = currentItem.classList.contains('is-pinned');

        if (action === 'select-pin' && isSelected && !isPinned) {
          pinItem(currentItem);
          break;
        }

        if (event.shiftKey) {
          pickItems(currentItem);
          break;
        }

        if (!isSelected) {
          selectItems(currentItem);
        } else {
          unselectItems(currentItem);
        }
    }
  }

  function onPreViewUIClick(event) {
    event.stopPropagation();

    const action = event.target.dataset.action ?? event.target.parentNode.dataset.action;

    switch (action) {
      case 'previous':
        previousPreview();
        break;

      case 'next':
        nextPreview();
        break;

      default:
    }
  }

  function previewKeydown(event) {
    switch (event.key) {
      case 'Escape':
        closePreview();
        break;

      case 'Delete':
        removeItems(currentState.currentPreviewItem);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        previousPreview();
        break;

      case 'ArrowRight':
        event.preventDefault();
        nextPreview();
        break;

      default:
    }
  }

  function onSliderInput(event) {
    setSliderPosition(event.target);
  }

  function onSliderMouseUp(event) {
    if (event.target.nodeName !== 'INPUT') {
      return;
    }

    if (!event.ctrlKey && !event.shiftKey) {
      return;
    }

    const value = parseInt(event.target.value);
    const selector = (event.ctrlKey ? '.' : '.is-selected .') + event.target.classList[1];

    document.querySelectorAll(selector).forEach((slider) => setSliderPosition(slider, value));
  }

  // #endregion

  // #region other functions

  function setupGallery() {
    addGalleryBlock();
    addStyle();

    const gallery = document.getElementById('animaid-gallery');
    const slider = document.querySelector('.vjs-hotkey-hint > .animaid-slider');

    gallery.children[0].addEventListener('click', onToolbarClick);
    gallery.children[1].addEventListener('click', onPreViewUIClick);
    gallery.children[2].addEventListener('click', onGalleryItemClick);
    gallery.children[2].addEventListener('input', onSliderInput);
    gallery.children[2].addEventListener('mouseup', onSliderMouseUp);
    slider.addEventListener('input', onSliderInput);
    document.querySelector('.vjs-screenshot-button').addEventListener('click', createScreenshot);

    currentState.gallery = gallery;
    currentState.toolbar = gallery.children[0];
    currentState.itemList = gallery.children[2];
    currentState.mainSlider = slider;
    currentState.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        switch (entry.target.id) {
          case 'animaid-gallery':
            entry.target.style.setProperty('--height', `${entry.borderBoxSize[0].blockSize}px`);
            break;

          case videoElement.id:
            setSliderWidth(currentState.mainSlider, entry.contentRect.width);
            break;

          default:
        }
      });
    });

    currentState.resizeObserver.observe(gallery);
    currentState.resizeObserver.observe(videoElement);
  }

  function addGalleryBlock() {
    document.querySelector('.vjs-hotkey-hint').insertAdjacentHTML('beforeend', `
      <div class="animaid-slider">
        <input type="range" class="animaid-slider__input animaid-slider__input--top" max="1080" min="0" step="1" />
        <input type="range" class="animaid-slider__input animaid-slider__input--bottom" max="1080" min="0" step="1" />
      </div>
    `);

    document.querySelector('.control-bar-rightbtn').insertAdjacentHTML('beforeend', `
      <button class="vjs-control vjs-button vjs-screenshot-button" type="button" aria-disabled="false" title="截圖">
        <i class="fa fa-camera"></i>
      </button>
    `);

    document.querySelector('.player').insertAdjacentHTML('afterend', `
      <div id="animaid-gallery" class="animaid-gallery">
        <div class="animaid-gallery__toolbar is-disabled">
          <button type="button" class="animaid-gallery__button animaid-gallery__button--select" data-action="select">選擇</button>
          <button type="button" class="animaid-gallery__button animaid-gallery__button--collage" data-action="collage">合併</button>
          <button type="button" class="animaid-gallery__button animaid-gallery__button--download" data-action="download">下載</button>
          <button type="button" class="animaid-gallery__button animaid-gallery__button--remove" data-action="remove">刪除</button>
        </div>
        <div class="animaid-gallery__preview-ui">
          <button type="button" class="animaid-gallery__preview-control animaid-gallery__preview-control--previous" data-action="previous" title="上一張"><i class="fa fa-arrow-left"></i></button>
          <button type="button" class="animaid-gallery__preview-control animaid-gallery__preview-control--next" data-action="next" title="下一張"><i class="fa fa-arrow-right"></i></button>
        </div>
        <div class="animaid-gallery__item-list"></div>
      </div>
    `);
  }

  function createGalleryItem(canvas, itemTime = 99999) {
    const item = document.createElement('div');
    const isMerged = itemTime === 99999;
    const timestamp = isMerged ? '' : new Date(Math.round(itemTime * 1000)).toISOString().substring(itemTime > 3600 ? 11 : 14, 23);

    item.className = 'animaid-gallery__item';
    item.innerHTML = `
      <div class="animaid-gallery__img-container">
        <img class="animaid-gallery__img" style="display: none;" draggable="false" data-action="hide">
      </div>
      <div class="animaid-gallery__control-bar--top">
        <span class="animaid-gallery__control animaid-gallery__control--select ani-checkbox__button" data-action="select"></span>
        <span class="animaid-gallery__control animaid-gallery__control--remove" data-action="remove" title="刪除"><i class="fa fa-remove"></i></span>
      </div>
      <div class="animaid-gallery__control-bar--bottom">
      ${!isMerged
        ? `<span class="animaid-gallery__control animaid-gallery__control--timestamp" data-action="jump" title="時間跳轉">${timestamp}</span>
        <span class="animaid-gallery__control animaid-gallery__control--pin" data-action="pin" title="設定為合併時的主畫面"><i class="fa fa-pinterest-p"></i></span>
        <span class="animaid-gallery__control animaid-gallery__control--icon" data-action="select-pin" title="選擇或設定為合併時的主畫面"><i class="fa fa-compass"></i></span>`
        : '<span class="animaid-gallery__control animaid-gallery__control--icon" data-action="select" title="選擇"><i class="fa fa-compass"></i></span>'
      }
        <span class="animaid-gallery__control animaid-gallery__control--view" data-action="view" title="預覽"><i class="fa fa-picture-o"></i></span>
        <span class="animaid-gallery__control animaid-gallery__control--copy" data-action="copy" title="複製"><i class="fa fa-clone"></i><i class="fa fa-check"></i></span>
        <span class="animaid-gallery__control animaid-gallery__control--download" data-action="download" title="下載"><i class="fa fa-cloud-download"></i></span>
        <span class="animaid-gallery__control animaid-gallery__control--remove" data-action="remove" title="刪除"><i class="fa fa-trash-o"></i></span>
      </div>
    `;

    canvas.className = 'animaid-gallery__img';
    item.firstElementChild.append(canvas);

    canvas.toBlob((blob) => {
      const img = canvas.previousElementSibling;

      img.onload = function () {
        canvas.remove();
        this.removeAttribute('style');
      };

      img.src = URL.createObjectURL(blob);
    });

    if (!isMerged) {
      const slider = currentState.mainSlider.cloneNode(true);

      slider.classList.remove('is-enabled');
      item.append(slider);

      item.slider = slider;
    }

    item.image = item.firstElementChild.firstElementChild;
    item.timestamp = itemTime;
    item.isMerged = isMerged;

    const list = currentState.itemList;

    if (isMerged) {
      list.append(item);
    } else {
      list.insertBefore(item, Array.prototype.find.call(list.children, (item) => item.timestamp > itemTime));
    }

    return item;
  }

  // #endregion

  // #region style

  function addStyle() {
    const style = document.createElement('style');

    style.id = 'styleAniMaidGallery';
    style.textContent = `
      @font-face {
        font-family: 'FontAwesome';
        src: url('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.eot?v=4.7.0');
        src: url('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.eot?#iefix&v=4.7.0') format('embedded-opentype'), url('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0') format('woff2'), url('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff?v=4.7.0') format('woff'), url('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf?v=4.7.0') format('truetype'), url('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.svg?v=4.7.0#fontawesomeregular') format('svg');
      }

      .fa-clone:before {
        content: "\\f24d";
      }

      .vjs-screenshot-button {
        cursor: pointer;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }

      #video-container > #ani_video.is-slider-enabled {
        > .top-tool-bar {
          display: none;
        }

        > :is(.tool-bar-mask, .vjs-control-bar, .control-bar-mask, .vjs-big-play-button) {
          visibility: hidden;
        }
      }

      /* slider */
      .animaid-slider {
        --thumb-color: #FFFFFF;
        --thumb-bg: #000000;
        visibility: hidden;

        &.is-enabled {
          visibility: visible;
        }
      }

      .animaid-slider__input {
        position: absolute;
        bottom: 0;
        left: 5%;
        height: 100%;
        margin: 0;
        writing-mode: vertical-lr;
        cursor: pointer;
        pointer-events: auto;
        outline: none;
        appearance: none;
        direction: rtl;

        &::-webkit-slider-runnable-track {
          width: 0;
        }

        &::-moz-range-track {
          width: 0;
        }

        &::-webkit-slider-thumb {
          width: var(--thumb-width);
          height: 0;
          background-color: var(--thumb-bg);
          border-bottom: 1px dotted var(--thumb-color);
          appearance: none;
        }

        &::-moz-range-thumb {
          width: var(--thumb-width);
          height: 0;
          background-color: var(--thumb-bg);
          border-bottom: 1px dotted var(--thumb-color);
          appearance: none;
        }

        &:hover::-webkit-slider-thumb {
          background-color: var(--thumb-color);
          border-color: var(--anime-secondary-hover);
        }

        &:hover::-moz-range-thumb {
          background-color: var(--thumb-color);
          border-color: var(--anime-secondary-hover);
        }

        &::before,
        &::after {
          content: "";
          position: absolute;
          left: calc(var(--thumb-width) / 2);
          border-right: 25px solid transparent;
          border-left: 25px solid transparent;
          translate: -50%;
        }

        &::before {
          border-right-width: 26px;
          border-left-width: 26px;
        }
      }

      .animaid-slider__input--top {
        &::before,
        &::after {
          bottom: calc(100% / var(--video-height) * var(--value-top));
        }

        &::before {
          border-bottom: 26px solid var(--thumb-bg);
        }

        &::after {
          border-bottom: 25px solid var(--thumb-color);
        }

        &:hover::before,
        &:hover::after {
          border-bottom-color: var(--anime-secondary-hover);
        }
      }

      .animaid-slider__input--bottom {
        &::before,
        &::after {
          bottom: calc(100% / var(--video-height) * var(--value-bottom) + 1px);
          transform: translateY(100%);
        }

        &::before {
          border-top: 26px solid var(--thumb-bg);
        }

        &::after {
          border-top: 25px solid var(--thumb-color);
        }

        &:hover::before,
        &:hover::after {
          border-top-color: var(--anime-secondary-hover);
        }
      }

      /* gallery */

      .animaid-gallery {
        --gallery-bg-trans-dark: rgba(0, 0, 0, 0.8);
        --color-success: #7CBB7B;
        --color-remove: var(--span-R18);
        --color-remove-hover: var(--emphasize-error);
        padding: 8px 12px 0;
        font-size: 18px;
        background-color: var(--card-bg);
      }

      .animaid-gallery__toolbar {
        display: flex;
        margin: 4px;
      }

      .animaid-gallery__button {
        padding: 8px;
        margin-right: 8px;
        color: var(--text-default-color);
        cursor: pointer;
        background-color: var(--anime-primary-color);
        border: none;
        border-radius: 4px;

        &:hover {
          background-color: var(--anime-primary-hover);
        }
      }

      .animaid-gallery__toolbar.is-disabled > .animaid-gallery__button:not(.animaid-gallery__button--select) {
        pointer-events: none;
        background-color: var(--anime-background-fill);
      }

      .animaid-gallery__button--select {
        &::before {
          content: "取消";
        }

        .animaid-gallery__toolbar.is-disabled > &::before {
          content: "全部";
        }
      }

      .animaid-gallery__button--remove {
        background-color: var(--color-remove);

        &:hover {
          background-color: var(--color-remove-hover);
        }
      }

      .animaid-gallery__preview-ui {
        display: none;
      }

      .animaid-gallery__preview-control {
        position: fixed;
        z-index: 1000;
        top: 50%;
        width: 48px;
        height: 32px;
        font-size: 24px;
        line-height: 32px;
        color: var(--text-secondary-color);
        text-align: center;
        cursor: pointer;
        background-color: var(--anime-bg-trans-second);
        border: none;
        translate: 0 -50%;

        &:hover {
          color: var(--text-default-color);
        }
      }

      .animaid-gallery__preview-control--previous {
        left: 5px;
      }

      .animaid-gallery__preview-control--next {
        right: 5px;
      }

      .animaid-gallery__item-list {
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--seperator-transparent);
        outline: none;
        user-select: none;
      }

      .animaid-gallery__item {
        position: relative;
        margin: 8px 4px 4px;
        overflow: hidden;
        background-color: var(--card-bg);
        border-radius: 4px;

        &.is-selected {
          &::after {
            content: attr(data-index);
            position: absolute;
            bottom: 34px;
            left: 4px;
            width: 22px;
            height: 22px;
            line-height: 24px;
            text-align: center;
            background-color: var(--selected-color);
            border-radius: 50%;
          }

          > .animaid-gallery__control-bar--bottom {
            background-color: var(--selected-color);
          }
        }
      }

      .animaid-gallery__img {
        display: block;
        max-width: 240px;
        max-height: 135px;
        margin-left: auto;
      }

      .animaid-gallery__control-bar--top {
        position: absolute;
        top: 0;
        display: flex;
        width: 100%;
        padding: 4px;
      }

      .animaid-gallery__control-bar--bottom {
        display: flex;
        justify-content: right;
        padding: 4px;
        background-color: var(--anime-bg-trans-second);
      }

      .animaid-gallery__control {
        width: 22px;
        height: 22px;
        line-height: 22px;
        color: var(--text-default-color);
        text-align: center;
        cursor: pointer;

        &:hover {
          color: var(--anime-primary-hover);
        }

        .animaid-gallery__control-bar--bottom > & {
          margin-left: 4px;
        }
      }

      .animaid-gallery__control--select {
        text-align: left;

        .animaid-gallery__item.is-selected > .animaid-gallery__control-bar--top > &::before {
          border: 2px solid var(--anime-primary-color);
        }

        .animaid-gallery__item.is-selected > .animaid-gallery__control-bar--top > &::after {
          opacity: 1;
        }
      }

      .animaid-gallery__control--remove {
        color: var(--color-remove);

        &:hover {
          color: var(--color-remove-hover);
        }

        .animaid-gallery__control-bar--top > & {
          visibility: hidden;
          margin-left: auto;
          font-size: 22px;
        }

        .animaid-gallery__item:hover > .animaid-gallery__control-bar--top > & {
          visibility: visible;
        }
      }

      .animaid-gallery__control--timestamp {
        margin-right: auto;
        margin-left: 0;
      }

      .animaid-gallery__control--pin {
        visibility: hidden;

        .animaid-gallery__item.is-selected > .animaid-gallery__control-bar--bottom > & {
          visibility: visible;
        }
      }

      .animaid-gallery__item.is-pinned > .animaid-gallery__control-bar--bottom > :is(.animaid-gallery__control--pin, .animaid-gallery__control--icon) {
        color: var(--anime-primary-lightest);
      }

      .animaid-gallery__control--copy {
        > .fa {
          transition: opacity 0.5s ease-in;
        }

        > .fa-check {
          position: absolute;
          color: var(--color-success);
          opacity: 0;
          translate: -100%;
        }

        &.is-copied > .fa-clone {
          opacity: 0;
        }

        &.is-copied > .fa-check {
          opacity: 1;
        }
      }

      .animaid-gallery__control-bar--bottom > :is(.animaid-gallery__control--icon, .animaid-gallery__control--remove) {
        display: none;
      }

      /* fullscreen mode */

      .animaid-gallery.is-fullscreen-mode {
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding: 40px 0 110px;
        background-color: var(--gallery-bg-trans-dark);

        > .animaid-gallery__toolbar {
          width: 77.5%;
          padding: 8px 4px 0;
          margin: auto;
        }

        > .animaid-gallery__item-list {
          width: 77.5%;
          max-height: 100%;
          margin: auto;
          overflow-y: auto;
          border-bottom: none;
          scrollbar-width: none;
        }

        @media (min-width:1281px) and (max-width:1536px) {
          > :is(.animaid-gallery__toolbar, .animaid-gallery__item-list) {
            width: 1240px;
          }
        }
      }

      /* preview mode  */

      body.is-preview-mode {
        padding-right: 12px;
        overflow: hidden;
      }

      .animaid-gallery.is-preview-mode {
        z-index: 7;
        height: var(--height);
        border-bottom: 1px solid var(--seperator-transparent);

        > .animaid-gallery__preview-ui {
          display: block;
        }

        > .animaid-gallery__item-list {
          position: fixed;
          z-index: 999;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding-bottom: 0;
          background-color: var(--gallery-bg-trans-dark);
          border-bottom: 0;

          > .animaid-gallery__item {
            display: none;

            &.is-current {
              display: block;
            }
          }
        }
      }

      .animaid-gallery__item.is-current {
        max-width: 90%;
        margin: auto;
        overflow: visible;
        border-radius: 0;

        &.is-selected::after {
          top: -11px;
          right: -60px;
          left: unset;
        }

        > .animaid-gallery__img-container {
          max-height: calc(100vh - 20px);
          overflow-y: scroll;
          scrollbar-width: none;

          > .animaid-gallery__img {
            max-width: 100%;
            max-height: unset;
          }
        }

        > .animaid-gallery__control-bar--top {
          display: none;
        }

        > .animaid-gallery__control-bar--bottom {
          position: absolute;
          top: 0;
          right: -52px;
          display: block;
          padding: 0;
          background-color: var(--anime-background-fill);

          .is-selected > & {
            background-color: var(--selected-color);
          }

          > .animaid-gallery__control {
            display: block;
            width: 48px;
            height: 48px;
            font-size: 32px;
            line-height: 48px;
          }

          > .animaid-gallery__control--timestamp {
            position: absolute;
            right: 60px;
            width: unset;
            text-shadow: 1px 1px var(--text-sub-color);
          }

          > .animaid-gallery__control--icon {
            font-size: 44px;
          }

          > :is(.animaid-gallery__control--pin, .animaid-gallery__control--view) {
            display: none;
          }
        }

        > .animaid-slider {
          visibility: visible;

          .is-slider-hidden > & {
            visibility: hidden;
          }
        }
      }
    `;

    document.body.append(style);
  }

  // #endregion
})();
