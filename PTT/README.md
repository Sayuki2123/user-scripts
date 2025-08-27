# PTT 網頁版 (ptt.cc)

* [固定搜尋文章位置](#固定搜尋文章位置)
* [統一文章格式](#統一文章格式)
* [圖片檢視器](#圖片檢視器)

## 固定搜尋文章位置

#### 安裝

[FixSearchBarPosition.user.js](FixSearchBarPosition.user.js?raw=true)

#### 功能

* 固定搜尋文章的位置，讓網頁下拉之後也可以使用搜尋

#### 預覽

![搜尋文章](assets/fix-search-bar-position.jpg?raw=true)

#### 更新日誌

* v1.0.0
  * 初版

## 統一文章格式

#### 安裝

[FormatPost.user.js](FormatPost.user.js?raw=true)

#### 功能

* 統一文章和推文的格式
* 顯示樓層數
* 標示作者發的推文
* 點擊推文可以標示相同帳號發的推文
* 在置頂區域加入文章標題，點擊可以搜尋同標題文章
* 隱藏底部的返回看板

#### 預覽

| 修改前 | 修改後 |
| ------ | ------ |
| ![修改前](assets/format-post_before.jpg?raw=true) | ![修改後](assets/format-post_after.jpg?raw=true) |

#### 更新日誌

* v1.2.0
  * 置頂區域加入文章標題，點擊可以搜尋相同標題的文章
* v1.1.0
  * 統一推文的 id 長度，讓推文內容對齊
  * 格式化並標示作者在推文之間的回覆
  * 修改格式化的檢查方式
* v1.0.1
  * 修正文章和簽名檔內引用的推文計入樓層數的錯誤
* v1.0.0
  * 初版

## 圖片檢視器

#### 安裝

[ImageViewer.user.js](ImageViewer.user.js?raw=true)

#### 功能

* 使用 PhotoSwipe 檢視圖片

#### 預覽

![圖片檢視器](assets/image-viewer.jpg?raw=true)

#### 更新日誌

* v1.1.1
  * 修改腳本執行時間，避免部分圖片讀取過久導致無法載入
* v1.1.0
  * 對文章、簽名檔和推文的圖片做分類
* v1.0.0
  * 初版
