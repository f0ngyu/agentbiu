# UI 文案调整记录

日期：2026-04-17

## 目标
- 把前端文案收成更短、更克制的控制台语言
- 减少说明式表达，让图标、短标签、数字承担状态展示
- 保持现有功能不变

## 本次调整
- 顶栏文案改为更短的控制台表达
- 摘要区统一为短标签：钱包、链、地址、凭证
- 控制区按钮和状态提示统一收短
- 创建区的图片、名称、符号、描述、链接、底池等字段文案压缩
- 8004 说明改为简短默认凭证提示
- 提交过程中的状态提示改为短句

## 影响文件
- `frontend/src/views/CreateTokenView.vue`
- `frontend/src/components/WalletPanel.vue`
- `frontend/src/components/Nft8004Status.vue`
- `frontend/src/components/TokenLogo.vue`
- `frontend/src/styles/main.css`
- `frontend/src/main.ts`
- `shared/src/types.ts`

## 验证
- `bun run --cwd frontend check`
- `bun run --cwd frontend build`
