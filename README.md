# CPBL Draft Simulator（MVP 0.1）

非 CPBL 官方產品。這是可在本機執行、可部署至 GitHub Pages 的 React + Vite 前端原型。

## 目前功能
- 六支 CPBL 球團可選擇玩家隊伍
- 選秀年度選擇（目前內附 2024 示範資料槽）
- 1–5 輪模擬選秀
- 玩家手動選秀、其餘球團由簡易 AI 選擇
- 以輸入成績計算描述性數據分數
- 搜尋、依守位篩選、匯出選秀結果 JSON
- 支援匯入自訂 JSON 球員池

## 重要：內附資料不是正式資料
`public/data/players.json` 的球員姓名與數據均為合成示範資料，目的只是讓 UI 和選秀流程可立即操作。它不是 2024 年真實候選名單，也不能用來評價真實球員。正式歷史選秀資料尚待匯入與逐筆核對。

## 本機執行
需要 Node.js 18 或更新版本。

```bash
npm install
npm run dev
```

依照終端機顯示的網址開啟（通常是 http://localhost:5173）。

正式建置：
```bash
npm run build
npm run preview
```

## 匯入資料格式
在首頁按「匯入資料」，選擇 JSON。格式請參考 `public/data/players.schema.example.json`。

- `players[].id` 必須唯一。
- `role` 目前建議使用 `投手`、`內野手`、`外野手`、`捕手`。
- 打者 `stats` 可提供 `avg`、`ops`、`hr`、`sb`。
- 投手 `stats` 可提供 `era`、`whip`、`k9`、`bb9`。
- `drafts[].playerPool` 是該年度可選球員的 ID 清單。
- 請勿將職棒生涯成績冒充為選秀當下已知數據；如要做歷史重選，應在資料中標明統計截止年度。

## 數據評分規則
這版是簡單、透明的描述性分數，不是預測模型：
- 打者：OPS、AVG、HR、SB 組合
- 投手：ERA、WHIP、K/9、BB/9 組合
- 分數限制在 1–99
- AI 球團先加權符合球團位置需求的球員，再依分數排序

正式版應按年度／聯盟環境做標準化（例如 z-score 或百分位），並為打者與投手建立不同模型，不能直接將跨年度原始成績混在一起比較。

## 公開資料建議
- CPBL 官方網站：https://www.cpbl.com.tw/
- CPBL Opendata（社群整理歷年逐年成績）：https://github.com/ldkrsi/cpbl-opendata
- CPBL Stats 進階數據爬蟲專案：https://github.com/lin-junyou/cpbl-savant-py-app

資料限制提醒：
- 社群整理資料並非聯盟官方 API 保證服務，需核對 LICENSE、欄位定義及更新狀態。
- CPBL 官網 2021 年改版前後球員 ID 系統不同，跨年度合併需建立 ID 對照。
- 新版進階數據網站的歷史涵蓋範圍可能有限，不能假設可提供完整歷年資料。
- 選秀候選名單、實際選秀順位／結果與球員職棒成績需分開維護。
- 使用球員照片、球隊 Logo 前，先確認授權。

## GitHub Pages 部署
1. 建立 GitHub repository，例如 `cpbl-draft-simulator`。
2. 將本專案內容 push 到 repository。
3. 到 repository → Settings → Pages，選擇 GitHub Actions。
4. 新增 `.github/workflows/deploy.yml`（範本如下），push 後會自動部署。

```yaml
name: Deploy Vite site to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

如果 repository 名稱不是 `<username>.github.io`，請在 `vite.config.js` 將 `base: './'` 改成 `base: '/repository-name/'` 後再部署；若採用上述相對路徑設定，請先確認 GitHub Pages 資產路徑正確。

## 下一階段
1. 匯入經核對的歷年選秀候選名單與實際選秀結果。
2. 匯入球員逐年 CPBL 一軍成績，建立球員 ID 對照表。
3. 增加「當年可知資料」與「職棒生涯結果」兩種視角，避免時間穿越偏差。
4. 依真實歷史選秀規則還原順位、輪次、放棄選秀與擴編隊伍等特殊情況。
