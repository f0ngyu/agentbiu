<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">钱包模式</p>
        <h3>连接方式</h3>
      </div>
      <div class="mode-switch">
        <button
          class="mode-button"
          :class="{ active: modelValue === 'privateKey' }"
          @click="$emit('update:modelValue', 'privateKey')"
        >
          <FontAwesomeIcon icon="key" />
          私钥模式
        </button>
        <button
          class="mode-button"
          :class="{ active: modelValue === 'browser' }"
          @click="$emit('update:modelValue', 'browser')"
        >
          <FontAwesomeIcon icon="wallet" />
          浏览器钱包
        </button>
      </div>
    </div>

    <div v-if="modelValue === 'privateKey'" class="wallet-content">
      <label class="field">
        <span>本地私钥</span>
        <input
          v-model="privateKeyInput"
          type="password"
          placeholder="输入 64 位十六进制私钥，不会写入仓库"
        />
      </label>

      <div class="actions">
        <button class="secondary-button" @click="emitSave">保存到本地会话</button>
        <button class="ghost-button" @click="$emit('clear-private-key')">清除</button>
      </div>

      <p class="helper-text mono-text">
        当前地址：{{ session.address || '未配置' }}
      </p>
    </div>

    <div v-else class="wallet-content">
      <p class="helper-text">
        使用 MetaMask、OKX Wallet 等 EIP-1193 插件钱包完成链上签名。
      </p>
      <div class="actions">
        <button class="secondary-button" @click="$emit('connect-browser')">连接钱包</button>
        <button class="ghost-button" @click="$emit('switch-network')">切换到 BSC</button>
      </div>
      <p class="helper-text mono-text">
        当前地址：{{ browserAddress || '未连接' }}
      </p>
      <p class="helper-text">
        网络状态：{{ browserChainText }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SessionInfo, WalletMode } from '@agentbiu/shared';

const props = defineProps<{
  modelValue: WalletMode;
  session: SessionInfo;
  browserAddress: string | null;
  browserChainId: number | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [mode: WalletMode];
  'save-private-key': [privateKey: string];
  'clear-private-key': [];
  'connect-browser': [];
  'switch-network': [];
}>();

const privateKeyInput = ref('');

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue !== 'privateKey') {
      privateKeyInput.value = '';
    }
  },
);

const browserChainText = computed(() => {
  if (!props.browserChainId) return '未连接';
  return props.browserChainId === 56 ? '已连接 BSC' : `当前链 ID: ${props.browserChainId}`;
});

function emitSave() {
  emit('save-private-key', privateKeyInput.value);
}
</script>
