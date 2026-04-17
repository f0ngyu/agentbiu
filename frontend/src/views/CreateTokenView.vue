<template>
  <main class="page-shell">
    <header class="topbar panel">
      <div class="topbar-copy">
        <p class="eyebrow">FOUR.MEME / LAUNCHPAD</p>
        <h1>发币控制台</h1>
        <p class="topbar-lede">钱包、凭证、创建流程同页完成。</p>
      </div>

      <div class="topbar-side">
        <div class="token-mini-card">
          <TokenLogo
            :src="selectedRaisedToken?.logoUrl || selectedRaisedToken?.iconUrl || ''"
            :symbol="selectedRaisedToken?.symbol || 'BNB'"
            :size="48"
          />
          <div>
            <p>底池</p>
            <strong>{{ selectedRaisedToken?.symbol || 'BNB' }}</strong>
          </div>
        </div>
        <button class="ghost-button" type="button" @click="reloadBootstrap">刷新</button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="overview-card">
        <div class="stat-head">
          <FontAwesomeIcon :icon="walletMode === 'privateKey' ? 'key' : 'wallet'" class="stat-icon" />
          <span>钱包</span>
        </div>
        <strong>{{ walletMode === 'privateKey' ? '私钥模式' : '浏览器钱包' }}</strong>
        <p>连接方式</p>
      </article>

      <article class="overview-card">
        <div class="stat-head">
          <FontAwesomeIcon icon="globe" class="stat-icon" />
          <span>链</span>
        </div>
        <strong>{{ verification ? verification.networkName : '未加载' }}</strong>
        <p>链上环境</p>
      </article>

      <button
        class="overview-card overview-card-button"
        type="button"
        :disabled="!currentAddress"
        @click="currentAddress && copyText(currentAddress, '当前地址已复制')"
      >
        <div class="stat-head">
          <FontAwesomeIcon icon="copy" class="stat-icon" />
          <span>地址</span>
        </div>
        <strong class="mono-text">{{ currentAddress ? shortAddress(currentAddress) : '未连接' }}</strong>
        <p>点击复制</p>
      </button>

      <article class="overview-card">
        <div class="stat-head">
          <FontAwesomeIcon
            :icon="
              identityStatus === 'ready'
                ? 'circle-check'
                : identityStatus === 'error'
                  ? 'circle-exclamation'
                  : 'shield-halved'
            "
            class="stat-icon"
          />
          <span>凭证</span>
        </div>
        <strong>
          {{
            identityStatus === 'ready'
              ? '已就绪'
              : identityStatus === 'missing'
                ? '待申请'
                : identityStatus === 'registering'
                  ? '申请中'
              : '未检查'
          }}
        </strong>
        <p>默认凭证</p>
      </article>
    </section>

    <section class="control-grid">
      <div class="control-column">
        <WalletPanel
          v-model="walletMode"
          :session="sessionInfo"
          :browser-address="browserAddress"
          :browser-chain-id="browserChainId"
          @save-private-key="savePrivateKey"
          @clear-private-key="clearPrivateKey"
          @connect-browser="connectWallet"
          @switch-network="switchNetwork"
          @copy-address="copyText($event, '钱包地址已复制')"
        />

        <Nft8004Status
          :address="currentAddress"
          :status="identityStatus"
          :result="identityResult"
          :loading="busyIdentity"
          @check="checkIdentity"
          @ensure-identity="ensureIdentity"
          @copy-address="copyText($event, '地址已复制')"
        />
      </div>

      <section class="panel stack-panel compact-panel control-panel runtime-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">运行</p>
            <h2 class="panel-title">运行状态</h2>
          </div>
          <button class="ghost-button" type="button" @click="reloadBootstrap">刷新</button>
        </div>

        <div v-if="verification" class="runtime-grid">
          <div class="runtime-card">
            <div class="stat-head">
              <FontAwesomeIcon icon="globe" class="stat-icon" />
              <span>链</span>
            </div>
            <strong>{{ verification.networkName }}</strong>
            <p>链上环境</p>
          </div>
          <div class="runtime-card">
            <div class="stat-head">
              <FontAwesomeIcon icon="link" class="stat-icon" />
              <span>ID</span>
            </div>
            <strong>{{ verification.chainId }}</strong>
            <p>当前链标识</p>
          </div>
          <div class="runtime-card runtime-card-wide">
            <div class="stat-head">
              <FontAwesomeIcon icon="bolt" class="stat-icon" />
              <span>RPC</span>
            </div>
            <strong class="mono-text">{{ verification.rpcUrl }}</strong>
            <p>链上请求端点</p>
          </div>
          <div class="runtime-card">
            <div class="stat-head">
              <FontAwesomeIcon icon="key" class="stat-icon" />
              <span>密钥</span>
            </div>
            <strong>{{ verification.hasPrivateKey ? '已配置' : '未配置' }}</strong>
            <p>会话存储状态</p>
          </div>
        </div>
      </section>
    </section>

    <section class="panel launch-panel">
      <div class="panel-head launch-head">
        <div>
          <p class="eyebrow">创建</p>
          <h2 class="panel-title">创建信息</h2>
        </div>
      </div>

      <div class="workspace-grid">
        <div class="workspace-main">
          <section class="form-section">
            <div class="section-head">
              <p class="eyebrow">代币</p>
              <h3>基础</h3>
            </div>

            <div class="image-stage">
              <label class="field field-upload upload-card">
                <span>图片</span>
                <input type="file" accept="image/*" @change="handleImageChange" />
                <span class="helper-text">{{ imageFile?.name || 'PNG / JPG / WEBP / GIF' }}</span>
                <div class="future-tags">
                  <span class="tag">AI 预留</span>
                  <span class="tag">新闻流预留</span>
                </div>
              </label>

              <div class="preview-card">
                <div class="preview-frame">
                  <img
                    v-if="imagePreviewUrl"
                    class="preview-image"
                    :src="imagePreviewUrl"
                    alt="Token 预览"
                  />
                  <div v-else class="preview-empty">
                    <strong>预览</strong>
                    <p>选图后显示，后续可接 AI 生图。</p>
                  </div>
                </div>
                <div class="preview-meta">
                  <span>文件</span>
                  <strong>{{ imageFile?.name || '尚未选择图片' }}</strong>
                </div>
              </div>
            </div>

            <div class="form-grid form-grid-two">
              <label class="field">
                <span>名称</span>
                <input v-model="form.name" type="text" placeholder="代币名称" />
              </label>

              <label class="field">
                <span>符号</span>
                <input v-model="form.shortName" type="text" placeholder="如 GPEPE" />
              </label>

              <label class="field field-full">
                <span>描述</span>
                <textarea v-model="form.desc" rows="4" placeholder="简要描述" />
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head">
              <p class="eyebrow">链接</p>
              <h3>链接</h3>
            </div>

            <div class="form-grid form-grid-three">
              <label class="field">
                <span>网站</span>
                <input v-model="form.webUrl" type="url" placeholder="https://example.com" />
              </label>

              <label class="field">
                <span>Twitter</span>
                <input v-model="form.twitterUrl" type="url" placeholder="https://x.com/yourtoken" />
              </label>

              <label class="field">
                <span>Telegram</span>
                <input v-model="form.telegramUrl" type="url" placeholder="https://t.me/..." />
              </label>
            </div>
          </section>
        </div>

        <aside class="workspace-side">
          <section class="form-section">
            <div class="section-head">
              <p class="eyebrow">底池</p>
              <h3>底池</h3>
            </div>

            <div v-if="raisedTokens.length" class="token-grid">
              <button
                v-for="token in raisedTokens"
                :key="token.symbol"
                type="button"
                class="token-card"
                :class="{ active: form.raisedTokenSymbol === token.symbol }"
                @click="form.raisedTokenSymbol = token.symbol"
              >
                <TokenLogo :src="token.logoUrl || token.iconUrl || ''" :symbol="token.symbol" :size="26" />
                <div class="token-card-copy">
                  <strong>{{ token.symbol }}</strong>
                  <span>{{ token.symbolAddress ? shortAddress(token.symbolAddress) : '原生币' }}</span>
                </div>
                <FontAwesomeIcon
                  v-if="form.raisedTokenSymbol === token.symbol"
                  icon="circle-check"
                  class="token-active-icon"
                />
              </button>
            </div>
            <p v-else class="helper-text">正在读取 four.meme 官方底池配置。</p>

            <label class="field">
              <span>预买入 {{ form.raisedTokenSymbol }}</span>
              <input v-model="form.preSale" type="number" min="0" step="0.0001" />
              <span class="helper-text">
                0 为不买入。非 BNB 会先授权再创建。
              </span>
            </label>
          </section>

          <section class="credential-note" aria-label="8004 默认凭证说明">
            <FontAwesomeIcon icon="shield-halved" class="credential-icon" />
            <div class="credential-copy">
              <strong>8004 凭证</strong>
              <p>默认 NFT，只展示，不编辑。</p>
            </div>
          </section>

          <div class="status-stack">
            <p v-if="statusMessage" class="status-line">{{ statusMessage }}</p>
            <p v-if="errorMessage" class="status-line error">{{ errorMessage }}</p>
          </div>

          <section v-if="launchResult" class="result-card">
            <div class="section-head">
              <p class="eyebrow">Result</p>
              <h3>发币交易已提交</h3>
            </div>

            <div class="result-grid">
              <button
                v-if="launchResult.tokenAddress"
                type="button"
                class="copy-row mono-text"
                @click="copyText(launchResult.tokenAddress, 'CA 地址已复制')"
              >
                <span class="copy-row-label">CA</span>
                <span class="copy-row-value">{{ launchResult.tokenAddress }}</span>
                <FontAwesomeIcon icon="copy" class="copy-row-icon" />
              </button>
              <p v-else class="copy-row copy-row-static mono-text">
                <span class="copy-row-label">CA</span>
                <span class="copy-row-value">暂未从回执中解析到</span>
              </p>

              <button
                type="button"
                class="copy-row mono-text"
                :disabled="!(launchResult.walletAddress || browserAddress)"
                @click="copyText(launchResult.walletAddress || browserAddress || '', '钱包地址已复制')"
              >
                <span class="copy-row-label">Wallet</span>
                <span class="copy-row-value">{{ launchResult.walletAddress || browserAddress || '未提供' }}</span>
                <FontAwesomeIcon icon="copy" class="copy-row-icon" />
              </button>

              <button
                type="button"
                class="copy-row mono-text"
                @click="copyText(launchResult.txHash, '交易哈希已复制')"
              >
                <span class="copy-row-label">Tx</span>
                <span class="copy-row-value">{{ launchResult.txHash }}</span>
                <FontAwesomeIcon icon="copy" class="copy-row-icon" />
              </button>
            </div>

            <div class="result-meta">
              <span>底池</span>
              <strong>{{ launchResult.selectedRaisedToken.symbol }}</strong>
              <span>费用</span>
              <strong class="mono-text">{{ launchResult.creationFeeWei }} wei</strong>
            </div>

            <a
              class="result-link"
              :href="txLink(launchResult.txHash)"
              target="_blank"
              rel="noreferrer"
            >
              在 BscScan 查看交易
            </a>
          </section>
        </aside>
      </div>

      <div class="launch-footer">
        <p class="helper-text launch-hint">
          完成上方信息后提交。
        </p>
        <button class="primary-button launch-button launch-submit" :disabled="launching" @click="submitLaunch">
          <FontAwesomeIcon icon="rocket" />
          {{ launching ? '处理中...' : '检查并创建' }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import {
  appendLaunchFormFields,
  BSC_BLOCK_EXPLORER,
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
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
import TokenLogo from '../components/TokenLogo.vue';

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
const browserAccessTokenAddress = ref<string | null>(null);

const identityResult = ref<IdentityCheckResult | null>(null);
const identityStatus = ref<IdentityStatus>('unknown');
const busyIdentity = ref(false);
const launching = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');
const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref('');
const launchResult = ref<LaunchResult | null>(null);
const defaultIdentityProfile = {
  agentName: 'My Agent',
  agentImageUrl: '',
  agentDescription: '',
} as const;

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
  agentName: defaultIdentityProfile.agentName,
  agentImageUrl: defaultIdentityProfile.agentImageUrl,
  agentDescription: defaultIdentityProfile.agentDescription,
});

const currentAddress = computed(() =>
  walletMode.value === 'privateKey' ? sessionInfo.value.address : browserAddress.value,
);

const selectedRaisedToken = computed(() => {
  const options = raisedTokens.value;
  return options.find((item) => item.symbol === form.raisedTokenSymbol) || options[0] || null;
});

onMounted(reloadBootstrap);

watch(imageFile, (file) => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = '';
  }

  if (file) {
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
});

onBeforeUnmount(() => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
});

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
    if (browserAddress.value?.toLowerCase() !== result.address.toLowerCase()) {
      browserAccessToken.value = '';
      browserAccessTokenAddress.value = null;
    }
    browserAddress.value = result.address;
    browserChainId.value = result.chainId;
    statusMessage.value = `浏览器钱包已连接：${shortAddress(result.address)}`;
  } catch (error) {
    setError(error);
  }
}

async function switchNetwork() {
  try {
    clearMessages();
    await switchToBsc();
    const result = await connectBrowserWallet();
    if (browserAddress.value?.toLowerCase() !== result.address.toLowerCase()) {
      browserAccessToken.value = '';
      browserAccessTokenAddress.value = null;
    }
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
    errorMessage.value = '先连接钱包或配置私钥。';
    return;
  }

  busyIdentity.value = true;
  clearMessages(false);
  try {
    const result = await apiPostJson<IdentityCheckResult>('/api/identity/check', { address });
    identityResult.value = result;
    identityStatus.value = result.hasIdentity ? 'ready' : 'missing';
    statusMessage.value = result.hasIdentity ? '8004 通过。' : '未持有 8004。';
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
    errorMessage.value = '先连接钱包或配置私钥。';
    return false;
  }

  busyIdentity.value = true;
  clearMessages(false);
  try {
    const result = await apiPostJson<IdentityCheckResult>('/api/identity/check', { address });
    if (result.hasIdentity) {
      identityResult.value = result;
      identityStatus.value = 'ready';
      statusMessage.value = '8004 已就绪。';
      return true;
    }

    identityStatus.value = 'registering';
    statusMessage.value = '未持有 8004，申请中...';

    if (walletMode.value === 'privateKey') {
      await apiPostJson('/api/identity/register/private-key', {
        agentName: defaultIdentityProfile.agentName,
        imageUrl: defaultIdentityProfile.agentImageUrl,
        description: defaultIdentityProfile.agentDescription,
      });
    } else {
      await ensureBrowserLogin();
      const prepared = await apiPostJson<{ agentURI: string; contractAddress: string }>(
        '/api/identity/register/browser/prepare',
        {
          agentName: defaultIdentityProfile.agentName,
          imageUrl: defaultIdentityProfile.agentImageUrl,
          description: defaultIdentityProfile.agentDescription,
        },
      );
      await registerIdentityWithBrowser(browserAddress.value as `0x${string}`, prepared.agentURI);
    }

    const latest = await apiPostJson<IdentityCheckResult>('/api/identity/check', { address });
    identityResult.value = latest;
    identityStatus.value = latest.hasIdentity ? 'ready' : 'missing';
    statusMessage.value = latest.hasIdentity ? '8004 已申请。' : '申请后仍未检测到。';
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
  if (
    browserAccessToken.value &&
    browserAddress.value &&
    browserAccessTokenAddress.value?.toLowerCase() === browserAddress.value.toLowerCase()
  ) {
    return browserAccessToken.value;
  }

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
  browserAccessTokenAddress.value = browserAddress.value;
  return browserAccessToken.value;
}

async function submitLaunch() {
  if (!imageFile.value) {
    errorMessage.value = '先上传图片。';
    return;
  }

  launching.value = true;
  clearMessages(false);
  try {
    statusMessage.value = '检查 8004...';
    const identityReady = await ensureIdentity();
    if (!identityReady) {
      throw new Error('8004 未就绪。');
    }

    if (walletMode.value === 'privateKey') {
      statusMessage.value = '私钥模式创建中...';
      launchResult.value = await apiPostForm<LaunchResult>('/api/launch/private-key', buildFormData());
    } else {
      statusMessage.value = '浏览器钱包创建中...';
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

    statusMessage.value = '交易已提交。';
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

function shortAddress(value: string | null | undefined) {
  if (!value) return '未连接';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
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
