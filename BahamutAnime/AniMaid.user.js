// ==UserScript==
// @name         巴哈姆特動畫瘋 - AniMaid
// @namespace    Sayuki2123
// @version      1.4.0
// @description  在動畫瘋加入額外的功能和快捷鍵
// @author       Sayuki2123
// @homepage     https://github.com/Sayuki2123/user-scripts/tree/main/BahamutAnime#animaid
// @supportURL   https://github.com/Sayuki2123/user-scripts/issues
// @match        https://ani.gamer.com.tw/animeVideo.php?sn=*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(() => {
  'use strict';

  const aniVideo = document.getElementById('ani_video');
  const videoElement = document.getElementById('ani_video_html5_api');

  window.addEventListener('load', () => {
    const descriptions = [
      ['Alt + ⮂', '快進 / 後退 1 幀'],
      ['Shift + ⮂', '快進 / 後退 1 秒'],
      ['Ctrl + ⮂', '快進 / 後退 30 秒'],
      ['PageDown', '快進 88 秒'],
      ['PageUp', '後退 90 秒'],
      ['C', '隱藏控制介面'],
      ['D', '更新彈幕列表'],
      ['R', '畫面垂直翻轉'],
      ['S', '恢復正常速度'],
      ['Ctrl + S', '加快影片速度 (最快 8 倍)'],
      ['Shift + S', '減慢影片速度 (最慢 0.125 倍)'],
      ['Z', '記住現在的播放時間'],
      ['X', '回到上次記住的時間'],
      ['[', '設定或解除區間重複播放的起點'],
      [']', '設定或解除區間重複播放的終點'],
      ['\\', '解除並結束區間重複播放']
    ];

    loadSettings(descriptions);
    addHintElement();
    addStyle();

    // 劇院模式時自動隱藏上方選單
    setTimeout(() => {
      document.querySelector('.top_sky').classList.add('fullwindow-unlock');
    }, document.hasFocus() ? 0 : 1000);

    // 切換到進階設定以隱藏彈幕列表
    document.getElementById('setting-danmu').firstElementChild.click();

    document.addEventListener('keydown', focusVideoPlayer);
  });

  videoElement.addEventListener('play', () => {
    document.addEventListener('fullscreenchange', onFullscreenChange);
    aniVideo.addEventListener('keydown', onHotkeyDown, true);
    aniVideo.addEventListener('click', onVideoClick);
    videoElement.addEventListener('loadeddata', () => {
      if (aniVideo.classList.contains('vjs-ad-playing')) {
        return;
      }

      if (userSettings.autoFullscreen.enabled) {
        aniMaid.requestFullscreen();
      }

      const savePoint = getSaveTime();

      if (!isNaN(savePoint)) {
        setProgressMark(document.querySelector('.animaid-save-point'), savePoint);
      }
    });
  }, { once: true });

  // main program end

  /**
   * userSetting type definition
   * @property {Object} userSetting             - 設定的名稱
   * @property {string} userSetting.title       - 設定的顯示名稱
   * @property {string} userSetting.id          - checkbox 的 id
   * @property {boolean} userSetting.enabled    - 設定的啟用狀態
   * @property {string} [userSetting.desc]      - 設定的詳細說明
   * @property {string} [userSetting.subId]     - sub span 的 id，顯示 rangr slider 的數值用
   * @property {string} [userSetting.rangeId]   - range slider 的 id
   * @property {number} [userSetting.rangeMin]  - range slider 的最小值，預設值 0
   * @property {number} [userSetting.rangeMax]  - range slider 的最大值，預設值 100
   * @property {number} [userSetting.rangeStep] - range slider 的間距值，預設值 1
   * @property {number} [userSetting.value]     - range slider 的設定值
   */
  const userSettings = new Proxy({
    autoFullscreen: {
      title: '播放後自動全螢幕',
      desc: '第一次播放後自動進入全螢幕',
      id: 'animaidAutoFullscreen',
      enabled: GM_getValue('autoFullscreen', false)
    },
    autoPlay: {
      title: '進入全螢幕時播放',
      id: 'animaidAutoPlay',
      enabled: GM_getValue('autoPlay', false)
    },
    autoPause: {
      title: '離開全螢幕時暫停',
      desc: '只有使用 Esc 離開全螢幕時才會自動暫停',
      id: 'animaidAutoPause',
      enabled: GM_getValue('autoPause', false)
    },
    focusControl: {
      title: '焦點控制',
      desc: '在不能打字的地方按下 F、T 或 Tab 都可以使影片播放器取得焦點',
      id: 'animaidFocusControl',
      enabled: GM_getValue('focusControl', false)
    },
    volumeControl: {
      title: '音量控制',
      id: 'animaidVolumeControl',
      subId: 'animaidVolumeText',
      rangeId: 'animaidVolumeRange',
      rangeMin: 1,
      rangeMax: 25,
      enabled: GM_getValue('volumeControl', false),
      value: GM_getValue('volumeControlValue', 5)
    }
  }, {
    set(target, key, value) {
      if (!(key in target)) {
        return false;
      }

      switch (typeof value) {
        case 'boolean':
          target[key].enabled = value;
          GM_setValue(key, value);
          break;

        case 'number':
          target[key].value = value;
          GM_setValue(`${key}Value`, value);
          break;

        default:
          return false;
      }

      return true;
    }
  });

  const aniMaid = {
    videoSn: unsafeWindow.animefun.videoSn,
    player: aniVideo.player,
    playbackRates: [0.125, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4, 6, 8],
    repeatIntervalStart: -1,
    repeatIntervalEnd: -1,
    exitFullscreenByEsc: true,
    getDuration() {
      return this.player.duration();
    },
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
    requestFullscreen() {
      this.player.requestFullscreen();
    },
    isFullscreen() {
      return this.player.isFullscreen();
    },
    fastForward(value) {
      this.player.currentTime(this.getCurrentTime() + value);
      this._setRightHint(value < 1 ? '1f' : `${value}s`);
    },
    rewind(value) {
      this.player.currentTime(this.getCurrentTime() - value);
      this._setLeftHint(value < 1 ? '1f' : `${value}s`);
    },
    setVolume(diff) {
      let newValue = Math.round(this.player.volume() * 100) + diff;

      if (newValue < 0) {
        newValue = 0;
      } else if (newValue > 100) {
        newValue = 100;
      }

      this.player.muted(false);
      this.player.volume(newValue / 100);

      if (newValue === 0) {
        this._setCenterHint('hotkey-hint-volume-mute', '靜音');
      } else {
        this._setCenterHint(`hotkey-hint-volume-${diff > 0 ? 'up' : 'down'}`, `${newValue}%`);
      }
    },
    setPlaybackRate(increase = 0) {
      if (increase === 0) {
        this.player.resetPlaybackRate_();
        this._setCenterHint('hotkey-hint-speed-normal', '1x');
        return;
      }

      const index = this.playbackRates.indexOf(this.player.playbackRate()) + increase;
      const value = this.playbackRates[index];

      if (value === undefined) {
        return;
      }

      this.player.playbackRate(value);
      this._setCenterHint(`hotkey-hint-speed-${increase > 0 ? 'up' : 'down'}`, `${value}x`);
    },
    toggleDanmu() {
      // 這裡是按下按鍵前的狀態，所以判斷要反過來
      if (document.getElementById('danmu-show').checked) {
        this._setCenterHint('hotkey-hint-danmu_close');
      } else {
        unsafeWindow.animefun.refreshdanmu();
        this._setCenterHint('hotkey-hint-danmu_on');
      }
    },
    _setCenterHint(className, text = '') {
      const centerHint = document.getElementById('animaidHotkeyHintCenter');

      centerHint.className = `hotkey-hint-center ${className}`;
      centerHint.lastElementChild.textContent = text;

      this._showHint(centerHint);
    },
    _setLeftHint(text) {
      const leftHint = document.getElementById('animaidHotkeyHintLeft');

      leftHint.lastElementChild.textContent = text;

      this._showHint(leftHint);
    },
    _setRightHint(text) {
      const rightHint = document.getElementById('animaidHotkeyHintRight');

      rightHint.lastElementChild.textContent = text;

      this._showHint(rightHint);
    },
    _showHint(elem) {
      elem.classList.remove('hotkey-hint-show');
      elem.offsetWidth;
      elem.classList.add('hotkey-hint-show');
    }
  };

  // #region event handlers

  const keyDownEvents = {
    ArrowUp: volumeUp,
    ArrowDown: volumeDown,
    ArrowLeft: rewind,
    ArrowRight: fastForward,
    PageUp: jumpBackward,
    PageDown: jumpForward,
    C: toggleControlBar,
    D: toggleDanmu,
    F: toggleFullscreen,
    T: toggleFullscreen,
    R: toggleFlip,
    S: changePlaybackRate,
    X: jumpToSaveTime,
    Z: saveCurrentTime,
    '[': setRepeatIntervalStart,
    ']': setRepeatIntervalEnd,
    '\\': clearRepeatEvent
  };

  function onHotkeyDown(event) {
    if (document.activeElement.id === 'danmutxt') {
      return;
    }

    const modifierKeys = Number(event.ctrlKey) + Number(event.shiftKey) + Number(event.altKey);

    if (modifierKeys > 0) {
      // 因為動畫瘋預設的快捷鍵沒有用到修飾鍵，也沒有額外做處理
      // 這可以讓瀏覽器本身的快捷鍵 (例如: ctrl + 0 ~ 9) 正常運作
      event.stopImmediatePropagation();

      if (modifierKeys > 1) {
        return;
      }
    }

    const key = event.key.length > 1 ? event.key : event.key.toUpperCase();

    if (key in keyDownEvents) {
      event.preventDefault();
      keyDownEvents[key](event, modifierKeys);
    }
  }

  function onVideoClick(event) {
    if (event.target.classList.contains('vjs-fullscreen-control')) {
      toggleFullscreen();
    }

    // 動漫通結束後，焦點會變成 body，讓焦點回到播放器
    if (event.target.nodeName === 'A') {
      aniVideo.focus();
    }
  }

  function onFullscreenChange() {
    if (aniMaid.isFullscreen()) {
      if (userSettings.autoPlay.enabled && !aniVideo.classList.contains('vjs-ended')) {
        aniMaid.play();
      }
    } else {
      if (userSettings.autoPause.enabled && aniMaid.exitFullscreenByEsc) {
        aniMaid.pause();
      }
    }

    aniMaid.exitFullscreenByEsc = true;
  }

  function focusVideoPlayer(event) {
    if (
      !userSettings.focusControl.enabled
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || document.activeElement === aniVideo
      || event.target.getAttribute('type') === 'text'
      || event.target.getAttribute('contenteditable') === 'true'
    ) {
      return;
    }

    const key = event.key.length > 1 ? event.key : event.key.toUpperCase();

    if (['F', 'T', 'Tab'].includes(key)) {
      event.preventDefault();

      aniVideo.focus();
      aniVideo.dispatchEvent(new KeyboardEvent('keydown', event));
    }
  }

  // #endregion

  // #region keydown event functions

  function volumeUp(event) {
    if (!userSettings.volumeControl.enabled) {
      return;
    }

    event.stopImmediatePropagation();
    aniMaid.setVolume(userSettings.volumeControl.value);
  }

  function volumeDown(event) {
    if (!userSettings.volumeControl.enabled) {
      return;
    }

    event.stopImmediatePropagation();
    aniMaid.setVolume(userSettings.volumeControl.value * -1);
  }

  function rewind(event, modifierKeys) {
    if (modifierKeys === 0) {
      return;
    }

    switch (true) {
      case event.ctrlKey:
        aniMaid.rewind(30);
        break;

      case event.shiftKey:
        aniMaid.rewind(1);
        break;

      case event.altKey:
        aniMaid.rewind(0.0417);
        break;

      default:
    }
  }

  function fastForward(event, modifierKeys) {
    if (modifierKeys === 0) {
      return;
    }

    switch (true) {
      case event.ctrlKey:
        aniMaid.fastForward(30);
        break;

      case event.shiftKey:
        aniMaid.fastForward(1);
        break;

      case event.altKey:
        aniMaid.fastForward(0.0417);
        break;

      default:
    }
  }

  function jumpBackward() {
    aniMaid.rewind(90);
  }

  function jumpForward() {
    aniMaid.fastForward(88);
  }

  function toggleControlBar() {
    if (!aniMaid.isPaused()) {
      return;
    }

    aniVideo.classList.toggle('vjs-playing');
    document.querySelector('.vjs-big-play-button').classList.toggle('vjs-hidden');
  }

  function toggleDanmu() {
    aniMaid.toggleDanmu();
  }

  function toggleFullscreen() {
    aniMaid.exitFullscreenByEsc = false;
  }

  function toggleFlip(event, modifierKeys) {
    if (modifierKeys === 0) {
      videoElement.classList.remove('animaid-flip-vertical', 'animaid-flip-horizontal');
      return;
    }

    switch (true) {
      case event.ctrlKey:
        videoElement.classList.toggle('animaid-flip-vertical');
        break;

      case event.shiftKey:
        videoElement.classList.toggle('animaid-flip-horizontal');
        break;

      default:
    }
  }

  function changePlaybackRate(event, modifierKeys) {
    if (modifierKeys === 0) {
      aniMaid.setPlaybackRate(0);
      return;
    }

    switch (true) {
      case event.ctrlKey:
        aniMaid.setPlaybackRate(1);
        break;

      case event.shiftKey:
        aniMaid.setPlaybackRate(-1);
        break;

      default:
    }
  }

  function jumpToSaveTime() {
    const savePoint = getSaveTime();

    if (isNaN(savePoint)) {
      return;
    }

    aniMaid.setCurrentTime(savePoint);
    aniMaid.play();
  }

  function getSaveTime() {
    return parseFloat(sessionStorage.getItem(`AniMaidSavePoint_${aniMaid.videoSn}`));
  }

  function saveCurrentTime() {
    const time = aniMaid.getCurrentTime();

    setProgressMark(document.querySelector('.animaid-save-point'), time);
    sessionStorage.setItem(`AniMaidSavePoint_${aniMaid.videoSn}`, time);
  }

  function setRepeatIntervalStart() {
    setRepeatInterval('Start');
  }

  function setRepeatIntervalEnd() {
    setRepeatInterval('End');
  }

  function clearRepeatEvent() {
    videoElement.removeEventListener('timeupdate', RepeatVideo);

    aniMaid.repeatIntervalStart = -1;
    aniMaid.repeatIntervalEnd = -1;

    aniVideo.classList.remove('animaid-repeat-on');
    document.querySelector('.animaid-repeat-start').classList.remove('animaid-progress-mark');
    document.querySelector('.animaid-repeat-end').classList.remove('animaid-progress-mark');
  }

  // #endregion

  // #region sub functions

  function setProgressMark(elem, seconds) {
    const timeText = new Date(Math.round(seconds * 1000)).toISOString().substring(seconds > 3600 ? 11 : 14, 19);

    elem.style.left = `${Math.round(seconds / aniMaid.getDuration() * 100 * 100) / 100}%`;
    elem.firstElementChild.textContent = timeText;
    elem.classList.add('animaid-progress-mark');
  }

  function setRepeatInterval(position) {
    const markElement = document.querySelector(`.animaid-repeat-${position.toLowerCase()}`);
    const name = `repeatInterval${position}`;
    const time = aniMaid[name] > -1 ? -1 : aniMaid.getCurrentTime();
    aniMaid[name] = time;

    if (time > -1) {
      setProgressMark(markElement, time);
    } else {
      markElement.classList.remove('animaid-progress-mark');
    }

    if (aniMaid.repeatIntervalStart > -1 && aniMaid.repeatIntervalStart < aniMaid.repeatIntervalEnd) {
      aniVideo.classList.add('animaid-repeat-on');
      videoElement.addEventListener('timeupdate', RepeatVideo);
    } else {
      aniVideo.classList.remove('animaid-repeat-on');
      videoElement.removeEventListener('timeupdate', RepeatVideo);
    }
  }

  function RepeatVideo() {
    if (aniMaid.getCurrentTime() >= aniMaid.repeatIntervalEnd) {
      aniMaid.setCurrentTime(aniMaid.repeatIntervalStart);
    }
  }

  // #endregion

  // #region other functions

  function loadSettings(descriptions) {
    const settingItems = Object.entries(userSettings);

    document.getElementById('ani-tab-content-2').insertAdjacentHTML('afterbegin', `
      <div class="ani-setting-section is-seperate">
        <h4 class="ani-setting-title">AniMaid 設定</h4>
        ${generateSettingItems(settingItems)}
        <div class="animaid-setting-expand-item" title="鍵盤快捷鍵">
          <div class="animaid-setting-expand-button"></div>
          <div style="display: none;">
            ${generateDescriptionItems(descriptions)}
          </div>
        </div>
      </div>
    `);

    settingItems.forEach(([_, props]) => {
      const checkBox = document.getElementById(props.id);

      checkBox.checked = props.enabled;

      checkBox.addEventListener('click', function () {
        userSettings[this.name] = this.checked;
      });

      if (props.rangeId === undefined) {
        return;
      }

      const rangeSlider = document.getElementById(props.rangeId);
      rangeSlider.labelElem = document.getElementById(props.subId);

      rangeSlider.value = props.value;
      rangeSlider.labelElem.textContent = `${rangeSlider.value}%`;

      rangeSlider.addEventListener('input', function () {
        this.labelElem.textContent = `${this.value}%`;
      });

      rangeSlider.addEventListener('change', function () {
        userSettings[this.name] = parseInt(this.value);
      });
    });

    document.querySelector('.animaid-setting-expand-item').addEventListener('click', function () {
      this.classList.toggle('opening');
      this.firstElementChild.classList.toggle('opening');
      $(this.lastElementChild).toggle(400);
    });

    function generateSettingItems(settingItems) {
      return settingItems.reduce((html, [name, item]) => (`
        ${html}
        <div class="ani-setting-item ani-flex">
          <div class="ani-setting-label">
            <span class="ani-setting-label__mian">${item.title}</span>
        ${item.subId ? `<span class="ani-setting-label__sub" id="${item.subId}"></span>` : ''}
        ${item.desc
          ? `<span class="qa-icon is-tip" tip-content="${item.desc}">
              <img src="https://i2.bahamut.com.tw/anime/smallQAicon.svg">
            </span>`
          : ''
        }
          </div>
          <div class="ani-setting-value ani-set-flex-right">
            <div class="ani-checkbox">
              <label class="ani-checkbox__label">
                <input id="${item.id}" type="checkbox" name="${name}">
                <div class="ani-checkbox__button"></div>
              </label>
            </div>
        ${item.rangeId
          ? `<div class="ani-range">
              <input type="range"
                name="${name}"
                id="${item.rangeId}"
                min="${item.rangeMin || 0}"
                max="${item.rangeMax || 100}"
                step="${item.rangeStep || 1}">
            </div>`
          : ''
        }
          </div>
        </div>
      `), '');
    }

    function generateDescriptionItems(descriptionItems) {
      return descriptionItems.reduce((html, [hotkey, desc]) => (`
        ${html}
        <div class="ani-setting-item ani-flex">
          <div class="ani-setting-label">
            <span class="ani-setting-label__mian">${desc}</span>
          </div>
          <div class="ani-setting-label ani-set-flex-right">
            <span class="ani-setting-label__mian">${hotkey}</span>
          </div>
        </div>
      `), '');
    }
  }

  function addHintElement() {
    if (document.querySelector('.vjs-hotkey-hint > .hotkey-hint-center') == null) {
      setTimeout(addHintElement, 1000);
      return;
    }

    const name = 'animaidHotkeyHintCenter';

    if (document.getElementById(name) != null) {
      return;
    }

    document.querySelector('.vjs-hotkey-hint').insertAdjacentHTML('beforeend', `
      <div id="${name}" class="hotkey-hint-center">
        <img class="volume-up" src="https://i2.bahamut.com.tw/anime/sound_up.svg">
        <img class="volume-down" src="https://i2.bahamut.com.tw/anime/sound_down.svg">
        <img class="mute" src="https://i2.bahamut.com.tw/anime/mute.svg">
        <img class="danmu-on" src="https://i2.bahamut.com.tw/anime/control-bar/danmu.svg">
        <img class="danmu-close" src="https://i2.bahamut.com.tw/anime/control-bar/danmu_close.svg">
        <img class="speed-up" src="https://i2.bahamut.com.tw/anime/control-bar/fullwindow_close.svg">
        <img class="speed-down" src="https://i2.bahamut.com.tw/anime/control-bar/fullwindow.svg">
        <img class="speed-normal" src="https://i2.bahamut.com.tw/anime/control-bar/fullscreen.svg">
        <div></div>
      </div>
      <div id="animaidHotkeyHintRight" class="hotkey-hint-right">
        <img src="https://i2.bahamut.com.tw/anime/forward.svg">
        <div></div>
      </div>
      <div id="animaidHotkeyHintLeft" class="hotkey-hint-left">
        <img src="https://i2.bahamut.com.tw/anime/backward.svg">
        <div></div>
      </div>
    `);

    document.querySelector('.vjs-progress-holder').insertAdjacentHTML('afterbegin',
      ['save-point', 'repeat-start', 'repeat-end'].reduce((html, name) => {
        return (`
          ${html}
          <div class="vjs-mouse-display animaid-${name}" style="left: -10%;">
            <div class="vjs-time-tooltip" aria-hidden="true" style="right: -23px;"></div>
          </div>
        `);
      }, '')
    );
  }

  // #endregion

  // #region style

  function addStyle() {
    const style = document.createElement('style');

    style.id = 'styleAniMaid';
    style.textContent = `
      .hotkey-hint-center img {
        display: none;
      }

      .hotkey-hint-danmu_on img.danmu-on, .hotkey-hint-danmu_close img.danmu-close,
      .hotkey-hint-speed-up img.speed-up, .hotkey-hint-speed-down img.speed-down,
      .hotkey-hint-speed-normal img.speed-normal {
        display: block;
      }

      .animaid-flip-vertical {
        rotate: 180deg;
      }

      .animaid-flip-horizontal {
        scale: -1 1;
      }

      .video-js .vjs-progress-control .vjs-mouse-display.animaid-progress-mark {
        display: block;
        visibility: visible;
        width: 1px;
        background-color: red;
        opacity: 1;
      }

      .animaid-progress-mark > .vjs-time-tooltip {
        visibility: visible;
        background-color: rgba(0, 0, 0, 0.5);
      }

      .animaid-save-point > .vjs-time-tooltip {
        background-color: rgba(32, 192, 32, 0.5);
      }

      .animaid-repeat-end > .vjs-time-tooltip {
        top: 1em;
      }

      .animaid-repeat-on .animaid-repeat-start > .vjs-time-tooltip,
      .animaid-repeat-on .animaid-repeat-end > .vjs-time-tooltip {
        background-color: rgba(255, 0, 0, 0.5);
      }

      /* 將進度條和暫停時的動畫瘋圖示的位置調高，時間提示才不會跟下面的控制項重疊  */
      #video-container > #ani_video > .vjs-big-play-button {
        bottom: 70px;
      }

      #video-container > #ani_video > .vjs-control-bar > .vjs-progress-control {
        bottom: 60px;
      }

      .qa-icon:after {
        transform: translate(-40%, 0);
      }

      .animaid-setting-expand-item {
        width: 40%;
        margin: auto;
        cursor: pointer;
        border: 1px solid var(--border-divid-line);
        border-radius: 4px;
      }

      .animaid-setting-expand-item:hover {
        background-color: var(--btn-background-hover-color);
      }

      .animaid-setting-expand-button {
        width: 0px;
        margin: 8px auto 0;
        border: 8px solid transparent;
        border-top-color: var(--anime-primary-color);
      }

      .animaid-setting-expand-item.opening {
        width: 95%;
      }

      .animaid-setting-expand-button.opening {
        margin: 0 auto 8px;
        border-top-color: transparent;
        border-bottom-color: var(--anime-primary-color);
      }
    `;

    document.body.append(style);
  }

  // #endregion
})();
