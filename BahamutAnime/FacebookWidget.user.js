// ==UserScript==
// @name         巴哈姆特動畫瘋 - Facebook 粉絲專頁內嵌
// @namespace    Sayuki2123
// @version      1.0.1
// @description  在動畫瘋上方選單增加粉絲專頁的按鈕
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BahamutAnime#facebook-粉絲專頁內嵌
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://ani.gamer.com.tw/*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const link = document.createElement('a');

  link.textContent = '粉絲專頁';
  link.href = '#';

  link.addEventListener('click', (event) => {
    event.preventDefault();

    const iframe = '<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fanimategamer&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=false&hide_cover=false&show_facepile=false&appId" width="500" height="600" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>';

    window.Dialogify.alert(iframe);
  });

  const item = document.createElement('li');

  item.append(link);
  document.querySelector('.mainmenu ul').insertBefore(item, document.querySelector('.btn-app-download'));
})();
