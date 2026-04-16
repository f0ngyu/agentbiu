<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">8004 认证</p>
        <h3>Agent 身份状态</h3>
      </div>
      <button class="ghost-button" :disabled="!address || loading" @click="$emit('check')">
        检查状态
      </button>
    </div>

    <div class="identity-box" :class="statusClass">
      <p class="identity-title">
        <FontAwesomeIcon :icon="iconName" />
        {{ statusText }}
      </p>
      <p class="helper-text mono-text">地址：{{ address || '请先连接或配置钱包' }}</p>
      <p v-if="result" class="helper-text mono-text">
        NFT 数量：{{ result.balance }} / 合约：{{ result.nftAddress }}
      </p>
    </div>

    <div class="actions">
      <button
        class="primary-button"
        :disabled="!address || loading"
        @click="$emit('ensure-identity')"
      >
        {{ result?.hasIdentity ? '已认证，可直接发币' : '检查并自动申请 8004' }}
      </button>
    </div>
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
}>();

const statusText = computed(() => {
  if (props.loading) return '处理中，请稍候...';
  switch (props.status) {
    case 'ready':
      return '已持有 8004 NFT，可直接进入发币流程';
    case 'missing':
      return '当前地址没有 8004 NFT，发币前会先申请';
    case 'registering':
      return '正在申请 8004 NFT...';
    case 'error':
      return '认证检查失败，请重试';
    default:
      return '尚未检查 8004 身份状态';
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
