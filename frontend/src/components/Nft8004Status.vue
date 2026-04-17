<template>
  <section class="panel stack-panel compact-panel control-panel">
    <div class="panel-head">
      <div>
        <p class="eyebrow">凭证</p>
        <h2 class="panel-title">8004 状态</h2>
      </div>
      <button type="button" class="ghost-button" :disabled="!address || loading" @click="$emit('check')">
        检查
      </button>
    </div>

    <div class="identity-banner" :class="statusClass">
      <div class="identity-icon">
        <FontAwesomeIcon :icon="iconName" />
      </div>
      <div class="identity-copy">
        <p class="identity-title">{{ statusText }}</p>
        <div class="status-inline" :class="{ dim: !loading }">
          <FontAwesomeIcon :icon="loading ? 'bolt' : 'shield-halved'" />
          <span>{{ loading ? '查询中' : '凭证' }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="address"
      type="button"
      class="copy-row mono-text"
      @click="$emit('copy-address', address)"
    >
      <span class="copy-row-label">地址</span>
      <span class="copy-row-value">{{ address }}</span>
      <FontAwesomeIcon icon="copy" class="copy-row-icon" />
    </button>
    <div v-else class="status-inline">
      <FontAwesomeIcon icon="circle-exclamation" />
      <span>先连接钱包</span>
    </div>

    <div v-if="result" class="inline-meta">
      <span>NFT</span>
      <strong>{{ result.balance }}</strong>
    </div>

    <button
      class="ghost-button identity-action"
      :disabled="!address || loading"
      @click="$emit('ensure-identity')"
    >
      {{ result?.hasIdentity ? '已就绪' : '申请凭证' }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IdentityCheckResult, IdentityStatus } from '@agentbiu/shared';

const props = defineProps<{
  address: string | null;
  status: IdentityStatus;
  result: IdentityCheckResult | null;
  loading: boolean;
}>();

defineEmits<{
  check: [];
  'ensure-identity': [];
  'copy-address': [address: string];
}>();

const statusText = computed(() => {
  if (props.loading) return '处理中';
  switch (props.status) {
    case 'ready':
      return '已持有 8004';
    case 'missing':
      return '当前地址尚未认证';
    case 'registering':
      return '正在申请';
    case 'error':
      return '检查失败';
    default:
      return '尚未检查';
  }
});

const iconName = computed(() => {
  if (props.status === 'ready') return 'circle-check';
  if (props.status === 'error') return 'circle-exclamation';
  return 'shield-halved';
});

const statusClass = computed(() => ({
  success: props.status === 'ready',
  warning: props.status === 'missing' || props.status === 'registering',
  danger: props.status === 'error',
}));
</script>
