# payload-post

[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-npm%20test-brightgreen)](#開發)
[![Build](https://img.shields.io/badge/build-npm%20run%20build-blue)](#開發)
[![Payload CMS](https://img.shields.io/badge/Payload%20CMS-posts%20CLI-111827)](https://payloadcms.com/)

`payload-post` 是一個給 Payload CMS 使用的終端機 CLI，主打管理 `posts` 內容、支援腳本化操作，也支援帳密登入到任意專案。

## 特色

- 支援 `list`、`create`、`update`、`delete`、`publish` 指令
- 支援 `--config` 指定不同專案設定檔
- 支援 `--json`，方便管線處理與 `jq`
- 支援 `--verbose`，可顯示實際 HTTP request
- 支援三種認證方式：
  - `jwt`
  - `apiKey`
  - `login`（username/password 或 email/password）
- 內建一個 Ink TUI 預覽頁面：`tui`

## 安裝

### 全域安裝

```bash
npm install -g payload-post-cli
```

安裝完成後會提供 `payload-post` 指令：

```bash
payload-post --help
payload-post list
```

### 一次性執行

如果你只是想先試用，不需要全域安裝：

```bash
npx payload-post-cli --help
```

### 從原始碼開發

如果你是從這個 repo 本地開發：

```bash
npm install
```

## 開發

啟動開發模式：

```bash
npm run dev
```

建置專案：

```bash
npm run build
```

執行測試：

```bash
npm test
```

型別檢查：

```bash
npm run typecheck
```

## 使用方式

首次使用時，先建立設定檔：

```bash
payload-post config init
```

這會在目前目錄產生 `payload-post.config.ts`。

## 設定檔

預設會尋找以下其中一個檔案：

- `payload-post.config.ts`
- `payload-post.config.mts`
- `payload-post.config.js`
- `payload-post.config.mjs`
- `payload-post.config.cjs`
- `payload-post.config.json`

你也可以用 `--config` 指定路徑。

### 範例設定

```ts
import type { PayloadPostConfig } from 'payload-post-cli';

export default {
  baseUrl: 'http://localhost:3000',
  collection: 'posts',
  auth: {
    type: 'login',
    collection: 'users',
    username: 'writer',
    password: 'secret',
  },
  fields: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    status: 'status',
    excerpt: 'excerpt',
    content: 'content',
    updatedAt: 'updatedAt',
    publishedAt: 'publishedAt',
    author: 'author',
  },
} satisfies PayloadPostConfig;
```

### 認證方式

#### 1. JWT

```ts
auth: {
  type: 'jwt',
  token: 'replace-me',
}
```

#### 2. API Key

```ts
auth: {
  type: 'apiKey',
  key: 'replace-me',
  collection: 'users',
}
```

#### 3. 帳密登入

適合你想直接對某個專案登入使用時：

```ts
auth: {
  type: 'login',
  collection: 'users',
  username: 'writer',
  password: 'secret',
}
```

也可以改成 email：

```ts
auth: {
  type: 'login',
  collection: 'users',
  email: 'writer@example.com',
  password: 'secret',
}
```

> `login` 會先呼叫 Payload 的登入 API 取得 JWT，再用該 JWT 存取 posts collection。

## 指令

### 列出文章

```bash
payload-post list
payload-post list --status draft
payload-post list --search hello
payload-post list --limit 20 --page 2
```

### 建立文章

```bash
payload-post create --title "Hello" --slug hello
```

### 更新文章

```bash
payload-post update 123 --title "New title"
```

### 刪除文章

```bash
payload-post delete 123
payload-post delete 123 --yes
```

### 發佈 / 取消發佈

```bash
payload-post publish 123
payload-post publish 123 --unpublish
```

### 顯示 TUI 預覽

```bash
payload-post tui
payload-post tui --once
```

## 全域 flags

- `--config <path>`：指定設定檔
- `--verbose`：顯示 HTTP request
- `--json`：輸出原始 JSON，方便 pipe 到其他工具

## 範例

輸出 JSON 並交給 `jq`：

```bash
payload-post --json list | jq '.docs[0].title'
```

使用自訂設定檔：

```bash
payload-post --config ./configs/blog.config.json list
```

## Payload 相容性說明

這個 CLI 是為 Payload CMS 的 `posts` 流程設計，預設假設：

- 你的 Payload 專案有 `posts` collection
- `fields` 已經映射到你的實際欄位名稱
- 若你要用帳密登入，對應的 auth collection 必須允許登入

## 需求環境

- Node.js 18+
- Payload CMS 專案

## 升級與移除

升級到最新版：

```bash
npm install -g payload-post-cli@latest
```

解除安裝：

```bash
npm uninstall -g payload-post-cli
```

## 專案開發備註

- v0.1 以非互動式 CRUD 為主
- TUI 目前是預覽版，主要用來驗證 3 pane layout 與快捷鍵
