# AgentBIU

面向 four.meme 的本地一键发币 WebUI。使用 `bun` 管理，前端基于 `Vue 3 + Vite`，服务端基于 `Bun + Hono`，不依赖 Cursor 或 OpenClaw。

## 当前能力

- 私钥模式发币
- 浏览器钱包模式发币
- 8004 NFT 检查
- 无 8004 时自动申请
- four.meme create-api / create-chain 流程封装
- BSC 环境与 raised token 基础校验

## 环境要求

- `bun >= 1.3`
- 浏览器钱包插件（如 MetaMask），用于浏览器钱包模式
- BSC RPC 可选，不填则使用默认公共节点

## 快速开始

```bash
bun install
cp .env.example .env
bun run doctor
bun run dev
```

前端会默认打开 `http://127.0.0.1:5173`，并代理到本地 API `http://127.0.0.1:3000`。

## .env 说明

```bash
PORT=3000
BSC_RPC_URL=https://bsc-dataseed.binance.org
# PRIVATE_KEY=0xyour_private_key_here
```

- `PRIVATE_KEY` 可选。如果不填，可以在 WebUI 中临时输入私钥，或直接切换到浏览器钱包模式。
- `.env` 不要提交到仓库。

## 常用命令

```bash
bun run dev
bun run start:prod
bun run check
bun run build
bun run test
bun run package:macos
```

## 生产启动

先构建，再由服务端直接托管前端静态页面：

```bash
bun run build
bun run start:prod
```

默认访问：

- `http://127.0.0.1:3000`

## GitHub Actions 发布

推送以 `v` 开头的 tag（例如 `v0.1.0`）会触发 [Release 工作流](.github/workflows/release.yml)，自动构建并上传：

- `AgentBIU-macos.zip`：解压后双击 `start.command`
- `AgentBIU-windows.zip`：解压后双击 `start.bat`

在仓库 **Actions** 里也可手动运行同一工作流（不上传 Release，仅保留本次运行的 Artifacts）。

## macOS 打包

生成面向普通用户的发布包：

```bash
bun run package:macos
```

打包完成后会输出到：

- `release/AgentBIU-macos`

普通用户只需要双击：

- `start.command`

停止时双击：

- `stop.command`

## 钱包模式

### 私钥模式

- 服务端在本地运行时会话中管理私钥
- 发币时会自动执行 8004 检查与申请
- 更适合批量或脚本化本地操作

### 浏览器钱包模式

- 前端通过 EIP-1193 钱包插件连接
- 登录签名、8004 申请、发币交易都由钱包弹窗确认
- 更适合普通用户按步骤点击操作

## 参考资料

- [Four.meme Agentic 页面](https://four.meme/en/agentic)
- [Four.meme Protocol Integration](https://four-meme.gitbook.io/four.meme/protocol-integration)
- [@four-meme/four-meme-ai npm 文档](https://www.npmjs.com/package/@four-meme/four-meme-ai)

## Python 约定

当前项目不依赖 Python。如果后续需要引入 Python 脚本或工具链，统一使用 `uv` 管理。
