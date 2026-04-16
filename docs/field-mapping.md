# Four.meme 字段映射

本项目的 UI 字段与 four.meme 官方创建参数一一对应，便于后续排查接口变化。

## Token 基础字段

| UI 字段 | four.meme 字段 | 说明 |
| --- | --- | --- |
| `Token Name` | `name` | 代币名称 |
| `Ticker Symbol` | `shortName` | 代币简称 |
| `Description` | `desc` | 项目描述 |
| `Token 图片` | `imgUrl` | 本地上传后再转成 four.meme 托管地址 |
| `分类` | `label` | `Meme / AI / Defi / Games / ...` |
| `Raised Token` | `raisedToken` | 从 `/public/config` 获取并回填完整对象 |
| `创建时预买入 BNB` | `preSale` | 以 BNB 单位传给 create API，用于创建时顺带打一笔首购资金 |

## 社交字段

| UI 字段 | four.meme 字段 |
| --- | --- |
| 官网 | `webUrl` |
| Twitter | `twitterUrl` |
| Telegram | `telegramUrl` |

## 8004 认证字段

| UI 字段 | 用途 |
| --- | --- |
| `8004 Agent 名称` | 用于构造 `agentURI.name` |
| `8004 图片链接` | 用于构造 `agentURI.image` |
| `8004 描述` | 用于构造 `agentURI.description` |

## 本地实现说明

- 私钥模式：服务端自动执行 `nonce -> login -> upload -> create-api -> 8004 check/register -> create-chain`
- 浏览器钱包模式：前端签名登录 + 前端链上提交交易，服务端仅负责 four.meme API 编排和参数生成
- 创建费：服务端根据 `TokenManager2._launchFee()` 与 `_tradingFeeRate()` 估算
