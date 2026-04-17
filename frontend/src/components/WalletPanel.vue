<template>
  <section class="panel stack-panel compact-panel control-panel">
    <div class="panel-head">
      <div>
        <p class="eyebrow">钱包</p>
        <h2 class="panel-title">连接方式</h2>
      </div>
      <div class="segmented-control">
        <button
          type="button"
          class="segmented-button"
          :class="{ active: modelValue === 'privateKey' }"
          @click="$emit('update:modelValue', 'privateKey')"
        >
          <FontAwesomeIcon icon="key" />
          私钥
        </button>
        <button
          type="button"
          class="segmented-button"
          :class="{ active: modelValue === 'browser' }"
          @click="$emit('update:modelValue', 'browser')"
        >
          <FontAwesomeIcon icon="wallet" />
          浏览器钱包
        </button>
      </div>
    </div>

    <div v-if="modelValue === 'privateKey'" class="panel-body stack">
      <label class="field">
        <span>本地私钥</span>
        <input
          v-model="privateKeyInput"
          type="password"
          placeholder="输入 64 位十六进制私钥"
        />
      </label>

      <div class="button-row">
        <button class="primary-button" @click="emitSave">保存</button>
        <button class="ghost-button" @click="$emit('clear-private-key')">清除</button>
      </div>

      <button
        v-if="session.address"
        type="button"
        class="copy-row mono-text"
        @click="$emit('copy-address', session.address)"
      >
        <span class="copy-row-label">当前地址</span>
        <span class="copy-row-value">{{ session.address }}</span>
        <FontAwesomeIcon icon="copy" class="copy-row-icon" />
      </button>
      <div v-else class="status-inline">
        <FontAwesomeIcon icon="circle-exclamation" />
        <span>当前地址未配置</span>
      </div>
    </div>

    <div v-else class="panel-body stack">
      <div class="status-inline">
        <FontAwesomeIcon icon="wallet" />
        <span>连接钱包后即可签名</span>
      </div>

      <div class="button-row">
        <button class="primary-button" @click="$emit('connect-browser')">连接钱包</button>
        <button class="ghost-button" @click="$emit('switch-network')">切换到 BSC</button>
      </div>

      <button
        v-if="browserAddress"
        type="button"
        class="copy-row mono-text"
        @click="$emit('copy-address', browserAddress)"
      >
        <span class="copy-row-label">当前地址</span>
        <span class="copy-row-value">{{ browserAddress }}</span>
        <FontAwesomeIcon icon="copy" class="copy-row-icon" />
      </button>
      <div v-else class="status-inline">
        <FontAwesomeIcon icon="circle-exclamation" />
        <span>当前地址未连接</span>
      </div>

      <div class="inline-meta">
        <span>网络</span>
        <strong>{{ browserChainText }}</strong>
      </div>
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
  'copy-address': [address: string];
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
  return props.browserChainId === 56 ? 'BSC 已连接' : `链 ID ${props.browserChainId}`;
});

function emitSave() {
  emit('save-private-key', privateKeyInput.value);
}
</script>
