// ==UserScript==
// @name         シーモア - ご来店ポイントを自動でゲットします
// @name:zh-TW   Cmoa - 自動取得訪問點數
// @namespace    Sayuki2123
// @version      1.0.0
// @description  シーモアにアクセスするとき、ご来店ポイントを自動でゲットします
// @description:zh-TW  進入 Cmoa 的時候會自動取得訪問點數
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Cmoa#自動取得訪問點數
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://www.cmoa.jp/*
// @icon         https://www.cmoa.jp/favicon.ico
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const today = new Date().toLocaleDateString('jp', { timeZone: 'Asia/Tokyo' });

  if (location.pathname === '/welcome_point/') {
    if (location.search === '?=2') {
      localStorage.setItem('sign_date', today);
    } else {
      document.getElementById('welcome_frm')?.submit();
    }

    return;
  }

  const signDate = localStorage.getItem('sign_date');

  if (signDate === today) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', '<iframe src="/welcome_point/" style="display: none;"></iframe>');
})();
