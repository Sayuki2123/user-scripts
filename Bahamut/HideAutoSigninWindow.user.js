// ==UserScript==
// @name         巴哈姆特 - 隱藏自動簽到視窗
// @namespace    Sayuki2123
// @version      1.0.0
// @description  隱藏自動簽到的彈出視窗
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/Bahamut#隱藏自動簽到視窗
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://*.gamer.com.tw/*
// @icon         https://i2.bahamut.com.tw/favicon.svg
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (location.href === 'https://api.gamer.com.tw/worker/signin.html') {
    window.addEventListener('message', (event) => {
      if (event.data.action !== 'finish') {
        return;
      }

      console.log('已完成自動簽到');
    });

    return;
  }

  if (window.self !== window.top) {
    return;
  }

  if (!('Signin' in window)) {
    return;
  }

  window.Signin._auto = window.Signin.auto;

  window.Signin.auto = function (t = !1) {
    const openSigninMap = this.openSigninMap;
    const signinSuccessAnime = this.signinSuccessAnime;
    const showBonusCard = this.showBonusCard;

    this.openSigninMap = () => { this.openSigninMap = openSigninMap; };
    this.signinSuccessAnime = () => { this.signinSuccessAnime = signinSuccessAnime; };
    this.showBonusCard = () => { this.showBonusCard = showBonusCard; };

    this._auto(t);
  };
})();
