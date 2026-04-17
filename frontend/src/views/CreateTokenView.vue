<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Four.meme Agent Launchpad</p>
      <h1>本地一键发币 WebUI</h1>
      <p class="hero-copy">
        不依赖 Cursor 或 OpenClaw。配置本地私钥，或连接浏览器钱包后，即可自动检查 8004 NFT 并完成
        four.meme 发币。
      </p>
      <div class="hero-meta">
        <span class="meta-pill">BSC Only</span>
        <span class="meta-pill">Bun + Vue3</span>
        <span class="meta-pill">自动打开浏览器</span>
      </div>
    </section>

    <section class="layout-grid">
      <div class="left-column">
        <WalletPanel
          v-model="walletMode"
          :session="sessionInfo"
          :browser-address="browserAddress"
          :browser-chain-id="browserChainId"
          @save-private-key="savePrivateKey"
          @clear-private-key="clearPrivateKey"
          @connect-browser="connectWallet"
          @switch-network="switchNetwork"
        />

        <Nft8004Status
          :address="currentAddress"
          :status="identityStatus"
          :result="identityResult"
          :loading="busyIdentity"
          @check="checkIdentity"
          @ensure-identity="ensureIdentity"
        />

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">运行校验</p>
              <h3>环境状态</h3>
            </div>
            <button class="ghost-button" @click="reloadBootstrap">刷新</button>
          </div>

          <div class="verify-grid" v-if="verification">
            <div class="verify-card">
              <span>网络</span>
              <strong>{{ verification.networkName }}</strong>
            </div>
            <div class="verify-card">
              <span>Chain ID</span>
              <strong>{{ verification.chainId }}</strong>
            </div>
            <div class="verify-card">
              <span>RPC</span>
              <strong class="small">{{ verification.rpcUrl }}</strong>
            </div>
            <div class="verify-card">
              <span>私钥模式</span>
              <strong>{{ verification.hasPrivateKey ? '已配置' : '未配置' }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section class="panel launch-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Create Token</p>
            <h3>发币信息</h3>
          </div>
          <button class="primary-button" :disabled="launching" @click="submitLaunch">
            <FontAwesomeIcon icon="rocket" />
            {{ launching ? '处理中...' : '检查并发币' }}
          </button>
        </div>

        <div class="form-grid">
          <label class="field upload-field">
            <span>Token 图片</span>
            <input type="file" accept="image/*" @change="handleImageChange" />
            <span class="helper-text">{{ imageFile?.name || '支持 PNG / JPG / WEBP / GIF' }}</span>
          </label>

          <label class="field">
            <span>Token Name</span>
            <input v-model="form.name" type="text" placeholder="输入代币名称" />
          </label>

          <label class="field">
            <span>Ticker Symbol</span>
            <input v-model="form.shortName" type="text" placeholder="例如 GPEPE" />
          </label>

          <label class="field field-full">
            <span>Description</span>
            <textarea v-model="form.desc" rows="5" placeholder="填写代币描述" />
          </label>

          <label class="field">
            <span>分类</span>
            <select v-model="form.label">
              <option v-for="label in tokenLabels" :key="label" :value="label">
                {{ label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>创建时预买入 {{ form.raisedTokenSymbol }}</span>
            <input v-model="form.preSale" type="number" min="0" step="0.0001" />
            <span class="helper-text">
              创建 token 时一起打入的首购资金，接近 dev 首购；填 0 表示不预先买入。非 BNB
              底池会先请求授权对应代币，再发起创建交易。
            </span>
          </label>

          <label class="field">
            <span>官网</span>
            <input v-model="form.webUrl" type="url" placeholder="https://example.com" />
          </label>

          <label class="field">
            <span>Twitter</span>
            <input v-model="form.twitterUrl" type="url" placeholder="https://x.com/yourtoken" />
          </label>

          <label class="field">
            <span>Telegram</span>
            <input v-model="form.telegramUrl" type="url" placeholder="https://t.me/yourtoken" />
          </label>

          <label class="field">
            <span>8004 Agent 名称</span>
            <input v-model="form.agentName" type="text" placeholder="建议与项目名一致" />
          </label>

          <label class="field">
            <span>8004 图片链接</span>
            <input v-model="form.agentImageUrl" type="url" placeholder="可选，用于 8004 元数据" />
          </label>

          <label class="field field-full">
            <span>8004 描述</span>
            <input
              v-model="form.agentDescription"
              type="text"
              placeholder="可选，默认会使用内置 agent 描述"
            />
          </label>

          <div class="field field-full">
            <span>Raised Token</span>
            <div class="pill-group">
              <button
                v-for="token in raisedTokens"
                :key="token.symbol"
                type="button"
                class="chip-button"
                :class="{ active: form.raisedTokenSymbol === token.symbol }"
                @click="form.raisedTokenSymbol = token.symbol"
              >
                {{ token.symbol }}
              </button>
            </div>
          </div>
        </div>

        <div class="status-stack">
          <p v-if="statusMessage" class="status-line">{{ statusMessage }}</p>
          <p v-if="errorMessage" class="status-line error">{{ errorMessage }}</p>
        </div>

        <section v-if="launchResult" class="result-card">
          <p class="eyebrow">最近一次结果</p>
          <h4>发币交易已提交</h4>
          <p class="mono-text">CA 地址：{{ launchResult.tokenAddress || '暂未从回执中解析到' }}</p>
          <p class="mono-text">钱包地址：{{ launchResult.walletAddress || browserAddress }}</p>
          <p>Raised Token：{{ launchResult.selectedRaisedToken.symbol }}</p>
          <p class="mono-text">创建费：{{ launchResult.creationFeeWei }} wei</p>
          <p class="mono-text">交易哈希：{{ launchResult.txHash }}</p>
          <div class="result-actions">
            <button
              v-if="launchResult.tokenAddress"
              class="secondary-button"
              type="button"
              @click="copyText(launchResult.tokenAddress, 'CA 地址已复制')"
            >
              复制 CA
            </button>
            <button
              class="ghost-button"
              type="button"
              @click="copyText(launchResult.txHash, '交易哈希已复制')"
            >
              复制哈希
            </button>
            <a class="result-link mono-text" :href="txLink(launchResult.txHash)" target="_blank" rel="noreferrer">
              在 BscScan 查看交易
            </a>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import {
  appendLaunchFormFields,
  BSC_BLOCK_EXPLORER,
  TOKEN_LABELS,
  type IdentityCheckResult,
  type IdentityStatus,
  type LaunchFormInput,
  type LaunchPreparation,
  type LaunchResult,
  type SessionInfo,
  type VerificationInfo,
  type WalletLoginResult,
  type WalletMode,
  type WalletNonceResponse,
} from '@agentbiu/shared';
import { onMounted, reactive, ref, computed } from 'vue';
import { apiDelete, apiGet, apiPostForm, apiPostJson } from '../lib/api';
import {
  connectBrowserWallet,
  createTokenWithBrowser,
  isBscChain,
  registerIdentityWithBrowser,
  signLoginMessage,
  switchToBsc,
} from '../lib/browser-wallet';
import WalletPanel from '../components/WalletPanel.vue';
import Nft8004Status from '../components/Nft8004Status.vue';

const tokenLabels = [...TOKEN_LABELS];

const walletMode = ref<WalletMode>('privateKey');
const sessionInfo = ref<SessionInfo>({
  mode: 'privateKey',
  address: null,
  hasPrivateKey: false,
});
const verification = ref<VerificationInfo | null>(null);
const raisedTokens = computed(() => verification.value?.raisedTokens || []);

const browserAddress = ref<string | null>(null);
const browserChainId = ref<number | null>(null);
const browserAccessToken = ref('');

const identityResult = ref<IdentityCheckResult | null>(null);
const identityStatus = ref<IdentityStatus>('unknown');
const busyIdentity = ref(false);
const launching = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');
const imageFile = ref<File | null>(null);
const launchResult = ref<LaunchResult | null>(null);

const form = reactive<LaunchFormInput>({
  name: '',
  shortName: '',
  desc: '',
  label: 'Meme',
  webUrl: '',
  twitterUrl: '',
  telegramUrl: '',
  preSale: '0',
  feePlan: false,
  raisedTokenSymbol: 'BNB',
  agentName: 'My Agent',
  agentImageUrl: '',
  agentDescription: '',
});

const currentAddress = computed(() =>
  walletMode.value === 'privateKey' ? sessionInfo.value.address : browserAddress.value,
);

onMounted(reloadBootstrap);

async function reloadBootstrap() {
  try {
    const [session, verify] = await Promise.all([
      apiGet<SessionInfo>('/api/session'),
      apiGet<VerificationInfo>('/api/verify'),
    ]);
    sessionInfo.value = session;
    verification.value = verify;

    if (verify.raisedTokens[0] && !verify.raisedTokens.some((item) => item.symbol === form.raisedTokenSymbol)) {
      form.raisedTokenSymbol = verify.raisedTokens[0].symbol;
    }
  } catch (error) {
    setError(error);
  }
}

async function savePrivateKey(privateKey: string) {
  try {
    clearMessages();
    sessionInfo.value = await apiPostJson<SessionInfo>('/api/session/private-key', { privateKey });
    verification.value = await apiGet<VerificationInfo>('/api/verify');
    statusMessage.value = '私钥已保存到本地运行时会话。';
  } catch (error) {
    setError(error);
  }
}

async function clearPrivateKey() {
  try {
    clearMessages();
    sessionInfo.value = await apiDelete<SessionInfo>('/api/session/private-key');
    verification.value = await apiGet<VerificationInfo>('/api/verify');
    statusMessage.value = '已清除本地私钥会话。';
  } catch (error) {
    setError(error);
  }
}

async function connectWallet() {
  try {
    clearMessages();
    const result = await connectBrowserWallet();
    browserAddress.value = result.address;
    browserChainId.value = result.chainId;
    statusMessage.value = `浏览器钱包已连接：${result.address}`;
  } catch (error) {
    setError(error);
  }
}

async function switchNetwork() {
  try {
    clearMessages();
    await switchToBsc();
    const result = await connectBrowserWallet();
    browserAddress.value = result.address;
    browserChainId.value = 56;
    statusMessage.value = '已切换到 BSC 网络。';
  } catch (error) {
    setError(error);
  }
}

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement;
  imageFile.value = target.files?.[0] || null;
}

async function checkIdentity() {
  const address = currentAddress.value;
  if (!address) {
    errorMessage.value = '请先连接钱包或配置私钥。';
    return;
  }

  busyIdentity.value = true;
  clearMessages(false);
  try {
    const result = await apiPostJson<IdentityCheckResult>('/api/identity/check', { address });
    identityResult.value = result;
    identityStatus.value = result.hasIdentity ? 'ready' : 'missing';
    statusMessage.value = result.hasIdentity ? '8004 检查通过。' : '当前钱包还没有 8004 NFT。';
  } catch (error) {
    identityStatus.value = 'error';
    setError(error);
  } finally {
    busyIdentity.value = false;
  }
}

async function ensureIdentity() {
  const address = currentAddress.value;
  if (!address) {
    errorMessage.value = '请先连接钱包或配置私钥。';
    return false;
  }

  busyIdentity.value = true;
  clearMessages(false);
  try {
    const result = await apiPostJson<IdentityCheckResult>('/api/identity/check', { address });
    if (result.hasIdentity) {
      identityResult.value = result;
      identityStatus.value = 'ready';
      statusMessage.value = '当前钱包已持有 8004 NFT。';
      return true;
    }

    identityStatus.value = 'registering';
    statusMessage.value = '未检测到 8004 NFT，正在自动申请...';

    if (walletMode.value === 'privateKey') {
      await apiPostJson('/api/identity/register/private-key', {
        agentName: form.agentName,
        imageUrl: form.agentImageUrl,
        description: form.agentDescription,
      });
    } else {
      await ensureBrowserLogin();
      const prepared = await apiPostJson<{ agentURI: string; contractAddress: string }>(
        '/api/identity/register/browser/prepare',
        {
          agentName: form.agentName,
          imageUrl: form.agentImageUrl,
          description: form.agentDescription,
        },
      );
      await registerIdentityWithBrowser(browserAddress.value as `0x${string}`, prepared.agentURI);
    }

    const latest = await apiPostJson<IdentityCheckResult>('/api/identity/check', { address });
    identityResult.value = latest;
    identityStatus.value = latest.hasIdentity ? 'ready' : 'missing';
    statusMessage.value = latest.hasIdentity ? '8004 NFT 申请成功。' : '8004 NFT 申请后仍未检测到，请稍后刷新。';
    return latest.hasIdentity;
  } catch (error) {
    identityStatus.value = 'error';
    setError(error);
    return false;
  } finally {
    busyIdentity.value = false;
  }
}

async function ensureBrowserLogin() {
  if (browserAccessToken.value) return browserAccessToken.value;
  if (!browserAddress.value) {
    await connectWallet();
  }
  if (!browserAddress.value) {
    throw new Error('浏览器钱包未连接');
  }
  if (!isBscChain(browserChainId.value)) {
    await switchNetwork();
  }

  const nonceInfo = await apiPostJson<WalletNonceResponse>('/api/wallet/nonce', {
    address: browserAddress.value,
  });
  const signature = await signLoginMessage(browserAddress.value as `0x${string}`, nonceInfo.message);
  const login = await apiPostJson<WalletLoginResult>('/api/wallet/login', {
    address: browserAddress.value,
    signature,
  });

  browserAccessToken.value = login.accessToken;
  return browserAccessToken.value;
}

async function submitLaunch() {
  if (!imageFile.value) {
    errorMessage.value = '请先上传 token 图片。';
    return;
  }

  launching.value = true;
  clearMessages(false);
  try {
    statusMessage.value = '正在检查 8004 身份...';
    const identityReady = await ensureIdentity();
    if (!identityReady) {
      throw new Error('8004 NFT 尚未准备完成，无法继续发币。');
    }

    if (walletMode.value === 'privateKey') {
      statusMessage.value = '私钥模式发币中，正在提交 four.meme 创建交易...';
      launchResult.value = await apiPostForm<LaunchResult>('/api/launch/private-key', buildFormData());
    } else {
      statusMessage.value = '浏览器钱包模式发币中，正在生成 createArg 并发起钱包签名...';
      const accessToken = await ensureBrowserLogin();
      const prepared = await apiPostForm<LaunchPreparation>(
        '/api/launch/browser/prepare',
        buildFormData(accessToken),
      );
      const tx = await createTokenWithBrowser(
        browserAddress.value as `0x${string}`,
        prepared,
        form.preSale,
      );
      launchResult.value = {
        ...prepared,
        txHash: tx.txHash,
        walletAddress: tx.address,
        tokenAddress: tx.tokenAddress,
      };
    }

    statusMessage.value = '发币交易已提交，请前往 BscScan 或 four.meme 查看后续状态。';
  } catch (error) {
    setError(error);
  } finally {
    launching.value = false;
  }
}

function buildFormData(accessToken?: string) {
  const data = new FormData();
  data.set('image', imageFile.value as File);
  appendLaunchFormFields(data, form);
  if (accessToken) data.set('accessToken', accessToken);
  return data;
}

function txLink(hash: string) {
  return `${BSC_BLOCK_EXPLORER}/tx/${hash}`;
}

async function copyText(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    statusMessage.value = successMessage;
  } catch {
    errorMessage.value = '复制失败，请手动复制';
  }
}

function clearMessages(clearResult = true) {
  statusMessage.value = '';
  errorMessage.value = '';
  if (clearResult) {
    launchResult.value = null;
  }
}

function setError(error: unknown) {
  errorMessage.value = error instanceof Error ? error.message : '出现未知错误';
}
</script>
