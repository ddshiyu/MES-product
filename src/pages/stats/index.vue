<template>
  <view class="page">
    <view class="app-shell">
      <view class="sidebar tablet-only">
        <view class="brand">MES</view>
        <view class="nav-list">
          <view
            v-for="item in navItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: item.key === activeNav }"
            @tap="goPage(item.key)"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
        <view class="role-pill">{{ authStore.roleName }}</view>
      </view>

      <scroll-view scroll-y class="workspace">
        <view class="header">
          <view>
            <text class="eyebrow">统计看板 · {{ activePeriod }}</text>
            <text class="title">生产统计</text>
            <text class="desc">汇总生产状态、质检结果和异常追踪。</text>
          </view>
          <view class="header-actions">
            <view class="period-tabs">
              <view
                v-for="period in periods"
                :key="period"
                class="period-tab"
                :class="{ active: period === activePeriod }"
                @tap="setPeriod(period)"
              >
                {{ period }}
              </view>
            </view>
            <button class="logout-button" hover-class="button-hover" @tap="handleLogout">退出</button>
          </view>
        </view>

        <view class="metrics">
          <view v-for="metric in metrics" :key="metric.key" class="metric-card">
            <view class="metric-head">
              <text class="metric-label">{{ metric.label }}</text>
              <text class="metric-badge" :class="metric.tone">{{ metric.badge }}</text>
            </view>
            <text class="metric-value">{{ metric.value }}</text>
            <text class="metric-note">{{ metric.note }}</text>
          </view>
        </view>

        <view class="layout-grid">
          <view class="left-stack">
            <view class="panel">
              <text class="section-title">状态分布</text>
              <view class="bar-list">
                <view v-for="item in statusStats" :key="item.label" class="bar-row">
                  <text class="bar-label">{{ item.label }}</text>
                  <view class="bar-track">
                    <view class="bar-fill" :class="item.tone" :style="{ width: item.percent + '%' }"></view>
                  </view>
                  <text class="bar-value">{{ item.value }}</text>
                </view>
              </view>
            </view>

            <view class="panel">
              <view class="section-head">
                <view>
                  <text class="section-title">异常追踪</text>
                  <text class="section-desc">按责任角色和处理状态跟踪异常</text>
                </view>
                <text class="status-tag danger">{{ pendingExceptionTotal }} 待处理</text>
              </view>
              <view class="exception-list">
                <view
                  v-for="item in exceptions"
                  :key="item.id || item.orderNo"
                  class="exception-card"
                  @tap="goExceptionOrder(item.orderNo)"
                >
                  <view>
                    <text class="exception-id">{{ item.orderNo }}</text>
                    <text class="section-desc">{{ item.type }} · {{ item.owner }}</text>
                  </view>
                  <text class="status-tag" :class="item.tone">{{ item.status }}</text>
                </view>
                <view v-if="exceptions.length === 0" class="empty-state">暂无异常记录</view>
              </view>
            </view>
          </view>

          <view class="right-stack">
            <view class="panel">
              <text class="section-title">质检结果</text>
              <view class="quality-grid">
                <view v-for="item in qualityStats" :key="item.label" class="quality-card">
                  <text class="quality-value" :class="item.tone">{{ item.value }}</text>
                  <text class="section-desc">{{ item.label }}</text>
                </view>
              </view>
            </view>

            <view class="panel sync-panel">
              <view class="section-head">
                <text class="section-title">数据同步</text>
                <text class="status-tag info">接口</text>
              </view>
              <view class="sync-list">
                <text v-for="item in syncItems" :key="item">{{ item }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="bottom-nav mobile-only">
      <view
        v-for="item in navItems"
        :key="item.key"
        class="bottom-nav-item"
        :class="{ active: item.key === activeNav }"
        @tap="goPage(item.key)"
      >
        <text>{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getMesStatsDashboard,
  type MesStatsDashboard,
  type MesStatsExceptionItem,
  type MesStatsStatusItem,
} from '../../api/mes'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'

type Tone = 'info' | 'success' | 'warning' | 'danger'

interface Metric {
  key: string
  label: string
  value: string
  badge: string
  note: string
  tone: Tone
}

const activeNav = 'stats'
const appStore = useAppStore()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const activePeriod = ref('今日')

const allNavItems = [
  { key: 'stats', label: '统计', url: '/pages/stats/index' },
  { key: 'orders', label: '指令', url: '/pages/orders/index' },
  { key: 'inspection', label: '质检', url: '/pages/inspection/index' },
  { key: 'access', label: '权限', url: '/pages/access/index' },
]

const navItems = computed(() => allNavItems.filter((item) => authStore.canAccessPage(item.key)))

const periods = ['今日', '本周']

const metrics = ref<Metric[]>([
  { key: 'orders', label: '指令总数', value: '4', badge: '完成 1', note: '当前周期生产指令', tone: 'info' },
  { key: 'passRate', label: '质检合格率', value: '33%', badge: '按提交', note: '已提交质检记录', tone: 'success' },
  { key: 'exceptions', label: '异常订单', value: '1', badge: '1 待处理', note: '母材与质检异常', tone: 'danger' },
  { key: 'pending', label: '待处理', value: '3', badge: '生产中', note: '待上机与待质检', tone: 'warning' },
])

const statusStats = ref<MesStatsStatusItem[]>([
  { key: 'pending_load', label: '待上机', value: 1, percent: 25, tone: 'info' },
  { key: 'pending_inspection', label: '待质检', value: 1, percent: 25, tone: 'warning' },
  { key: 'done', label: '已完成', value: 1, percent: 25, tone: 'success' },
  { key: 'exception', label: '异常', value: 1, percent: 25, tone: 'danger' },
])

const qualityStats = ref([
  { label: '合格记录', value: '1', tone: 'success' as Tone },
  { label: '不合格记录', value: '0', tone: 'danger' as Tone },
  { label: '待复核', value: '0', tone: 'warning' as Tone },
  { label: '待录入', value: '1', tone: 'info' as Tone },
])

const exceptions = ref<MesStatsExceptionItem[]>([
  { createdAt: '', description: '母材宽度不符', id: 1, orderNo: 'SC-260707-032', owner: '班组长', status: '待确认', tone: 'danger', type: '母材不符' },
])

const generatedAt = ref('')
const rangeText = ref('2026-07-08')
const pendingExceptionTotal = ref(1)

const syncItems = computed(() => [
  `周期 ${activePeriod.value}`,
  `范围 ${rangeText.value}`,
  generatedAt.value ? `更新 ${generatedAt.value}` : '使用本地样例',
  `异常待处理 ${pendingExceptionTotal.value} 条`,
])

const periodValueMap: Record<string, 'today' | 'week'> = {
  今日: 'today',
  本周: 'week',
}

const periodNoteMap: Record<string, string> = {
  今日: '今日生产指令',
  本周: '本周生产指令',
}

function applyStats(data: MesStatsDashboard) {
  const pendingTotal = data.statusStats
    .filter((item) => ['pending_load', 'pending_inspection'].includes(item.key))
    .reduce((sum, item) => sum + item.value, 0)

  metrics.value = [
    {
      badge: `完成 ${data.metrics.doneTotal}`,
      key: 'orders',
      label: '指令总数',
      note: periodNoteMap[activePeriod.value],
      tone: 'info',
      value: String(data.metrics.orderTotal),
    },
    {
      badge: '按提交',
      key: 'passRate',
      label: '质检合格率',
      note: '已提交质检记录',
      tone: data.metrics.passRate >= 90 ? 'success' : data.metrics.passRate >= 70 ? 'warning' : 'danger',
      value: `${data.metrics.passRate}%`,
    },
    {
      badge: `${data.metrics.pendingExceptionTotal} 待处理`,
      key: 'exceptions',
      label: '异常订单',
      note: '母材与质检异常',
      tone: data.metrics.exceptionTotal > 0 ? 'danger' : 'success',
      value: String(data.metrics.exceptionTotal),
    },
    {
      badge: '生产中',
      key: 'pending',
      label: '待处理',
      note: '待上机与待质检',
      tone: pendingTotal > 0 ? 'warning' : 'success',
      value: String(pendingTotal),
    },
  ]

  statusStats.value = data.statusStats
  qualityStats.value = [
    { label: '合格记录', value: String(data.qualityStats.pass), tone: 'success' },
    { label: '不合格记录', value: String(data.qualityStats.fail), tone: 'danger' },
    { label: '待复核', value: String(data.qualityStats.review), tone: 'warning' },
    { label: '待录入', value: String(data.qualityStats.pending), tone: 'info' },
  ]
  exceptions.value = data.exceptions
  pendingExceptionTotal.value = data.metrics.pendingExceptionTotal
  generatedAt.value = formatTime(data.generatedAt)
  rangeText.value = data.range.startDate === data.range.endDate
    ? data.range.startDate
    : `${data.range.startDate} 至 ${data.range.endDate}`
}

function formatTime(value: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function loadStats() {
  try {
    const data = await getMesStatsDashboard(periodValueMap[activePeriod.value] || 'today')
    applyStats(data)
  } catch (error) {
    console.warn('load stats failed', error)
  }
}

function setPeriod(period: string) {
  activePeriod.value = period
  loadStats()
}

function goExceptionOrder(orderNo: string) {
  if (!orderNo) return

  orderStore.setSelectedOrder(orderNo, 'exception')
  orderStore.setCurrentTab('exception')
  uni.navigateTo({
    url: `/pages/orders/index?status=exception&orderNo=${encodeURIComponent(orderNo)}`,
  })
}

function goPage(key: string) {
  const target = navItems.value.find((item) => item.key === key)

  if (!target?.url || key === activeNav) {
    return
  }

  uni.navigateTo({ url: target.url })
}

function handleLogout() {
  uni.showModal({
    cancelText: '取消',
    confirmColor: '#c23b3b',
    confirmText: '退出',
    content: '确认退出当前账号？',
    title: '退出登录',
    success: (result) => {
      if (!result.confirm) return

      authStore.logout()
      uni.reLaunch({ url: '/pages/login/index' })
    },
  })
}

onMounted(() => {
  appStore.setActiveNav('stats')
  ensurePageAccess()
  loadStats()
})

function ensurePageAccess() {
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }

  if (!authStore.canAccessPage('stats')) {
    uni.showToast({ title: '当前角色无统计权限', icon: 'none' })
    uni.reLaunch({ url: '/pages/login/index' })
  }
}
</script>

<style scoped>
page {
  height: 100%;
  background: #eef2f7;
  overflow: hidden;
}

.page {
  height: 100vh;
  overflow: hidden;
  background: #eef2f7;
  color: #1b2430;
}

.app-shell {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 176rpx;
  height: 100vh;
  min-height: 0;
  padding: 28rpx 18rpx;
  box-sizing: border-box;
  flex-shrink: 0;
  background: #142033;
  color: #b8c5d7;
  display: flex;
  flex-direction: column;
}

.brand {
  height: 72rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  font-size: 28rpx;
  font-weight: 800;
}

.nav-list {
  flex: 1;
  margin-top: 28rpx;
}

.nav-item {
  min-height: 88rpx;
  border-radius: 14rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
}

.nav-item.active {
  color: #ffffff;
  background: #246bfe;
}


.role-pill {
  height: 48rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #142033;
  background: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
}

.workspace {
  flex: 1;
  min-width: 0;
  height: 100vh;
  padding: 28rpx;
  box-sizing: border-box;
}

.header,
.header-actions,
.metric-head,
.section-head,
.exception-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.header-actions {
  align-items: center;
}

.eyebrow,
.desc,
.section-desc,
.metric-note,
.bar-label {
  display: block;
  color: #647184;
  font-size: 24rpx;
  line-height: 1.58;
}

.title {
  display: block;
  margin-top: 12rpx;
  color: #1b2430;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.28;
}

.desc {
  margin-top: 12rpx;
}

.section-desc {
  margin-top: 10rpx;
}

.period-tabs {
  padding: 6rpx;
  border: 1rpx solid #d8dee8;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  gap: 6rpx;
}

.period-tab {
  min-width: 96rpx;
  height: 52rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #647184;
  font-size: 24rpx;
  font-weight: 800;
}

.period-tab.active {
  color: #ffffff;
  background: #246bfe;
}

.metrics {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18rpx;
}

.metric-card,
.panel,
.exception-card,
.quality-card {
  border: 1rpx solid #d8dee8;
  border-radius: 16rpx;
  background: #ffffff;
}

.metric-card {
  min-height: 154rpx;
  padding: 20rpx;
}

.metric-label {
  color: #647184;
  font-size: 24rpx;
  white-space: nowrap;
}

.metric-badge,
.status-tag {
  min-height: 40rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
}

.metric-value {
  display: block;
  min-height: 64rpx;
  margin-top: 20rpx;
  color: #1b2430;
  font-size: 52rpx;
  font-weight: 850;
  line-height: 1.28;
}

.metric-note {
  margin-top: 14rpx;
}

.layout-grid {
  margin-top: 22rpx;
  padding-bottom: 40rpx;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360rpx, 0.9fr);
  gap: 22rpx;
}

.left-stack,
.right-stack,
.bar-list,
.exception-list,
.sync-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.panel {
  padding: 22rpx;
}

.section-title {
  display: block;
  color: #1b2430;
  font-size: 30rpx;
  font-weight: 850;
  line-height: 1.35;
}

.bar-list {
  margin-top: 18rpx;
}

.bar-row {
  display: grid;
  grid-template-columns: 112rpx 1fr 52rpx;
  gap: 14rpx;
  align-items: center;
}

.bar-track {
  height: 14rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: #e6ecf4;
}

.bar-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #246bfe;
}

.bar-value {
  color: #243040;
  font-size: 24rpx;
  font-weight: 800;
  text-align: right;
}

.quality-card,
.exception-card {
  padding: 18rpx;
}

.exception-card {
  cursor: pointer;
}

.exception-id {
  display: block;
  color: #1b2430;
  font-size: 26rpx;
  font-weight: 850;
}

.quality-grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.quality-value {
  display: block;
  min-height: 52rpx;
  font-size: 42rpx;
  font-weight: 850;
  line-height: 1.28;
}

.sync-list {
  margin-top: 18rpx;
  flex-direction: row;
  flex-wrap: wrap;
}

.sync-list text {
  padding: 10rpx 14rpx;
  border-radius: 12rpx;
  color: #526072;
  background: #f3f6fb;
  font-size: 22rpx;
}

.empty-state {
  min-height: 96rpx;
  border: 1rpx dashed #cfd7e3;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #647184;
  font-size: 24rpx;
}

.info {
  color: #246bfe;
  background: #e8f0ff;
}

.success {
  color: #138a5b;
  background: #e7f7ef;
}

.warning {
  color: #b7791f;
  background: #fff4d8;
}

.danger {
  color: #c23b3b;
  background: #fde9e9;
}

.bar-fill.info {
  background: #246bfe;
}

.bar-fill.success {
  background: #138a5b;
}

.bar-fill.warning {
  background: #b7791f;
}

.bar-fill.danger {
  background: #c23b3b;
}

.mobile-only {
  display: none;
}

@media screen and (max-width: 1023px) {
  .page {
    padding-bottom: calc(112rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(112rpx + env(safe-area-inset-bottom));
  }

  .tablet-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .app-shell {
    display: block;
    min-height: auto;
  }

  .workspace {
    height: calc(100vh - 112rpx - constant(safe-area-inset-bottom));
    height: calc(100vh - 112rpx - env(safe-area-inset-bottom));
    padding: 24rpx;
  }

  .layout-grid {
    grid-template-columns: 1fr;
  }

  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .right-stack {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(112rpx + constant(safe-area-inset-bottom));
    height: calc(112rpx + env(safe-area-inset-bottom));
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
    box-sizing: border-box;
    border-top: 1rpx solid #d8dee8;
    background: #ffffff;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    z-index: 10;
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #647184;
    font-size: 22rpx;
  }

  .bottom-nav-item.active {
    color: #246bfe;
  }
}

@media screen and (min-width: 701px) and (max-width: 1023px) {
  .metric-value {
    min-height: 72rpx;
  }

  .quality-value {
    min-height: 60rpx;
  }
}

@media screen and (max-width: 700px) {
  .header {
    display: block;
  }

  .period-tabs {
    margin-top: 18rpx;
    width: fit-content;
  }

  .header-actions {
    margin-top: 18rpx;
    justify-content: space-between;
  }

  .header-actions .period-tabs {
    margin-top: 0;
  }

  .title {
    font-size: 40rpx;
  }

  .metrics,
  .right-stack,
  .quality-grid {
    grid-template-columns: 1fr;
  }

  .bar-row {
    grid-template-columns: 92rpx 1fr 44rpx;
  }
}

/* #ifdef MP */
.workspace {
  padding-top: calc(28rpx + var(--status-bar-height) + 88rpx);
}
/* #endif */
</style>
