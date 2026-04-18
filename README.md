# AgentBIU

一个给普通用户直接用的 four.meme 发币工具。

## 先看这个

如果你只是想把 token 发出去，不需要懂开发流程，按下面做就行：

1. 下载对应系统的发布包
2. 打开程序
3. 连接钱包
4. 填写 token 信息并上传图片
5. 点击创建，按钱包提示确认

## 怎么安装

### 方式一：下载发布包

推荐普通用户使用。

1. 打开 [GitHub Releases](https://github.com/f0ngyu/agentbiu/releases)
2. 下载对应系统的压缩包
3. 解压后运行：
   - macOS: 双击 `start.command`
   - Windows: 双击 `start.bat`

首次启动时，程序会自动准备本地配置文件并打开页面。

### 方式二：本地运行源码

如果你想自己跑最新版源码，可以看下面的开发者部分。

## 怎么使用

### 1. 连接钱包

- 浏览器钱包模式适合大多数人，例如 MetaMask、OKX Wallet
- 私钥模式适合本地测试或自动化

### 2. 填写发币信息

你需要准备：

- Token 图片
- Token 名称
- Token 符号
- 描述
- 网站、Twitter、Telegram（可选）

### 3. 选择底池

常见底池包括 `BNB`、`USDT`、`USDC` 等。

- 选 `BNB`：只需要准备少量 BNB 作为 gas
- 选其他币：钱包里还要有对应币种余额，发币前可能先做授权

### 4. 检查并创建

程序会先检查：

- 钱包是否可用
- 当前地址是否有 `8004` 凭证
- 图片和表单是否完整

然后再提交发币交易。

### 5. 查看结果

成功后你会看到：

- `CA` 地址
- 交易哈希
- 钱包地址
- 创建费用

也可以直接跳到 `BscScan` 查看交易。

## 使用前准备

- 一个支持 BSC 的浏览器钱包
- 少量 `BNB`
- 如果选非 BNB 底池，还需要对应底池币
- 一张 token 图片

## 常见问题

### 只看到交易哈希，没有看到 CA

系统会优先从链上回执解析 `TokenCreate` 事件。偶发没显示时，可以直接去 `BscScan` 查同一笔交易。

### 浏览器没自动打开

手动访问本地地址即可：

- 开发模式：`http://127.0.0.1:5173`
- 生产模式：`http://127.0.0.1:3000`

### 怎么停止

- macOS：双击 `stop.command`
- Windows：双击 `stop.bat`

更多普通用户说明见 [docs/user-guide.md](docs/user-guide.md)。

## 给开发者

### 环境要求

- `bun >= 1.3`
- Node.js 不需要单独安装

### 本地开发

```bash
bun install
cp .env.example .env
bun run doctor
bun run dev
```

前端默认会运行在 `http://127.0.0.1:5173`，后端默认是 `http://127.0.0.1:3000`。

### 常用命令

```bash
bun run dev
bun run check
bun run test
bun run build
bun run start:prod
```

### 打包发布

```bash
bun run package:macos
bun run package:windows
```

### 生产启动

```bash
bun run build
bun run start:prod
```

### 版本发布

推送以 `v` 开头的 tag 会触发 GitHub Actions Release，例如：

```bash
git tag v0.1.5
git push origin v0.1.5
```

## 参考资料

- [Four.meme Agentic 页面](https://four.meme/en/agentic)
- [Four.meme Protocol Integration](https://four-meme.gitbook.io/four.meme/protocol-integration)
- [@four-meme/four-meme-ai npm 文档](https://www.npmjs.com/package/@four-meme/four-meme-ai)
