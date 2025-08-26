// ==UserScript==
// @name         BOOK☆WALKER - より速いキャンペーンスライダー
// @name:zh-TW   BOOK☆WALKER - 優惠活動輪播加速
// @namespace    Sayuki2123
// @version      1.1.0
// @description  キャンペーンスライダーの速度を上げます。また、マウスを前後ボタンの上に置いたときの動作を変更します
// @description:zh-TW  加快優惠活動的輪播速度，並修改滑鼠停留在左右按鈕上時的行為
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BookwalkerJP#優惠活動輪播加速
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://bookwalker.jp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bookwalker.jp
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const swiper = document.getElementById('js-top-banner-swiper');

  if (swiper == null) {
    return;
  }

  playSwiper(1000);

  swiper.addEventListener('mouseover', function (event) {
    switch (event.target.className) {
      case 'a-swiper-button__arrow--prev':
        playSwiper(500, true);
        break;

      case 'a-swiper-button__arrow--next':
        playSwiper(500);
        break;

      default:
    }
  });

  swiper.addEventListener('mouseleave', () => playSwiper(1000));

  function playSwiper(delay, reverseDirection = false) {
    const swiper = document.getElementById('js-top-banner-swiper');

    swiper.swiper.params.autoplay.delay = delay;
    swiper.swiper.params.autoplay.reverseDirection = reverseDirection;
    swiper.swiper.autoplay.start();
  }
})();
