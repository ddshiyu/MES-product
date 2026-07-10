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
            <text class="eyebrow">过程质检 · 质检员 李敏 · {{ inspectionStatusText }}</text>
            <text class="title">过程质检</text>
            <text class="desc">记录整条产品厚度，并按分切组录入宽度检测结果。</text>
          </view>
          <view class="header-actions">
            <text class="status-tag" :class="inspectionTone">{{ inspectionStatusText }}</text>
            <button class="logout-button" hover-class="button-hover" @tap="handleLogout">退出</button>
          </view>
        </view>

        <view class="summary-card">
          <view>
            <text class="order-id">{{ orderInfo.orderNo }}</text>
            <text class="muted">{{ orderInfo.customerName }} · {{ orderInfo.machineCode }} · {{ orderStatusText }}</text>
          </view>
          <view class="summary-specs">
            <view v-for="item in summary" :key="item.label" class="spec-item">
              <text class="spec-label">{{ item.label }}</text>
              <text class="spec-value">{{ item.value }}</text>
            </view>
          </view>
        </view>

        <view class="layout-grid">
          <view class="left-stack">
            <view class="panel">
              <view class="section-head">
                <view>
                  <text class="section-title">整条产品检测</text>
                  <text class="section-desc">厚度检测结果影响整单质检结论</text>
                </view>
                <text class="status-tag warning">待提交</text>
              </view>
              <view class="form-grid">
                <label class="field">
                  <text class="field-label">检测厚度</text>
                  <input
                    class="field-input"
                    :value="thicknessValue"
                    type="digit"
                    @input="thicknessValue = String($event.detail.value)"
                  />
                </label>
                <label class="field">
                  <text class="field-label">检测结果</text>
                  <input
                    class="field-input"
                    :value="thicknessResultText"
                    @input="setThicknessResult(String($event.detail.value))"
                  />
                </label>
              </view>
              <label class="field textarea-field">
                <text class="field-label">异常说明</text>
                <textarea
                  class="field-textarea"
                  :value="abnormalNote"
                  @input="abnormalNote = String($event.detail.value)"
                />
              </label>
            </view>

            <view class="panel">
              <view class="section-head">
                <view>
                  <text class="section-title">分组宽度记录</text>
                  <text class="section-desc">每组记录实际宽度、结果和状态</text>
                </view>
                <button class="ghost-button" hover-class="button-hover" @tap="addGroup">新增组</button>
              </view>
              <view class="group-list">
                <view v-for="group in groups" :key="group.group" class="group-card">
                  <view class="group-main">
                    <view>
                      <text class="group-title">{{ group.group }}</text>
                      <text class="muted">目标 {{ group.target }} · 实际 {{ group.actual || '--' }}</text>
                    </view>
                    <text class="status-tag" :class="group.tone">{{ group.result }}</text>
                  </view>
                  <view class="group-detail">
                    <view class="detail-box">
                      <text>偏差</text>
                      <text>{{ group.diff }}</text>
                    </view>
                    <label class="detail-box">
                      <text>实际宽度</text>
                      <input
                        class="group-input"
                        :value="group.actual"
                        type="digit"
                        @input="updateGroupActual(group.group, String($event.detail.value))"
                      />
                    </label>
                    <view class="detail-box">
                      <text>{{ group.status }}</text>
                      <text>{{ group.note }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="right-stack">
            <view class="panel">
              <text class="section-title">质检状态</text>
              <view class="segment">
                <view
                  v-for="status in statusOptions"
                  :key="status"
                  class="segment-item"
                  :class="{ active: status === activeStatus }"
                  @tap="activeStatus = status"
                >
                  {{ status }}
                </view>
              </view>
              <text class="section-desc status-desc">提交后会更新指令状态，并记录本次质检结果。</text>
            </view>

            <view class="panel">
              <text class="section-title">提交校验</text>
              <view class="check-list">
                <view v-for="item in checks" :key="item.label" class="check-row">
                  <text class="check-dot" :class="item.tone"></text>
                  <view>
                    <text class="check-title">{{ item.label }}</text>
                    <text class="muted">{{ item.desc }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="panel">
              <text class="section-title">操作</text>
              <view class="action-grid">
                <button
                  v-if="canSubmitInspection"
                  class="primary-button"
                  hover-class="button-hover"
                  @tap="submitInspection"
                >
                  提交质检
                </button>
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
import { onLoad } from '@dcloudio/uni-app'
import {
  getMesInspectionDetail,
  getMesOrders,
  submitMesInspection,
  type MesInspectionDetail,
  type MesInspectionFinalResult,
  type MesInspectionResult,
} from '../../api/mes'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'

type Tone = 'info' | 'success' | 'warning' | 'danger'

interface GroupRecord {
  actual: string
  diff: string
  group: string
  note: string
  result: string
  splitItemId?: number | null
  status: string
  target: string
  tone: Tone
}

interface OrderInfo {
  customerName: string
  machineCode: string
  material: string
  orderNo: string
  status: 'pending_load' | 'pending_inspection' | 'exception' | 'done'
  thickness: number
  width: number
}

const activeNav = 'inspection'
const appStore = useAppStore()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const activeStatus = ref('合格')
const abnormalNote = ref('')
const hasInspectionOrder = ref(false)
const routeOrderNo = ref('')
const thicknessResult = ref<MesInspectionResult>('pass')
const thicknessValue = ref('')
const latestFinalResult = ref<MesInspectionFinalResult | ''>('')
const orderInfo = ref<OrderInfo>({
  customerName: '请先在指令页确认上机',
  machineCode: '-',
  material: '-',
  orderNo: '暂无待质检指令',
  status: 'pending_inspection',
  thickness: 0,
  width: 0,
})

const allNavItems = [
  { key: 'stats', label: '统计', url: '/pages/stats/index' },
  { key: 'orders', label: '指令', url: '/pages/orders/index' },
  { key: 'inspection', label: '质检', url: '/pages/inspection/index' },
  { key: 'access', label: '权限', url: '/pages/access/index' },
]

const navItems = computed(() => allNavItems.filter((item) => authStore.canAccessPage(item.key)))
const canSubmitInspection = computed(() => authStore.can('inspection:submit'))

const groups = ref<GroupRecord[]>([])
const statusOptions = ['合格', '不合格', '返工']

const finalResultMap: Record<string, MesInspectionFinalResult> = {
  不合格: 'fail',
  合格: 'pass',
  返工: 'rework',
}

const finalResultTextMap: Record<MesInspectionFinalResult, string> = {
  fail: '不合格',
  pass: '合格',
  review: '复核',
  rework: '返工',
}

const orderStatusTextMap: Record<OrderInfo['status'], string> = {
  done: '已完成',
  exception: '异常',
  pending_inspection: '待质检',
  pending_load: '待上机',
}

const resultTextMap: Record<MesInspectionResult, string> = {
  fail: '不合格',
  pass: '合格',
  review: '复核',
}

const summary = computed(() => {
  if (!hasInspectionOrder.value) {
    return [
      { label: '材质', value: '-' },
      { label: '厚度', value: '-' },
      { label: '宽度', value: '-' },
      { label: '分切', value: '-' },
    ]
  }

  return [
    { label: '材质', value: orderInfo.value.material },
    { label: '厚度', value: `${formatNumber(orderInfo.value.thickness)}mm` },
    { label: '宽度', value: `${formatNumber(orderInfo.value.width)}mm` },
    { label: '分切', value: `${groups.value.length} 组` },
  ]
})

const thicknessResultText = computed(() => resultTextMap[thicknessResult.value])

const inspectionStatusText = computed(() => (
  latestFinalResult.value ? `已提交 · ${finalResultTextMap[latestFinalResult.value]}` : '待提交'
))

const inspectionTone = computed<Tone>(() => {
  if (!latestFinalResult.value) return 'warning'
  if (latestFinalResult.value === 'pass') return 'success'
  if (latestFinalResult.value === 'review') return 'warning'
  return 'danger'
})

const orderStatusText = computed(() => orderStatusTextMap[orderInfo.value.status])

const checks = computed(() => {
  const completedCount = groups.value.filter((group) => Boolean(group.actual)).length
  const abnormalCount = groups.value.filter((group) => group.tone === 'warning' || group.tone === 'danger').length

  return [
    {
      label: '厚度已录入',
      desc: thicknessValue.value ? `整条产品厚度为 ${thicknessValue.value}mm` : '请录入整条产品厚度',
      tone: thicknessValue.value ? 'success' : 'warning',
    },
    {
      label: '分组记录',
      desc: `${groups.value.length} 组中 ${completedCount} 组已完成检测`,
      tone: completedCount === groups.value.length ? 'success' : 'warning',
    },
    {
      label: '异常说明',
      desc: abnormalCount > 0 ? (abnormalNote.value || '存在异常组，请填写说明') : '暂无异常分组',
      tone: abnormalCount > 0 && !abnormalNote.value ? 'warning' : 'success',
    },
  ]
})

function formatNumber(value: number) {
  return Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)
}

function toNumber(value: string | number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resultToTone(result: MesInspectionResult): Tone {
  if (result === 'pass') return 'success'
  if (result === 'fail') return 'danger'
  return 'warning'
}

function normalizeGroupResult(target: number, actual: number | null) {
  if (actual === null) {
    return {
      diff: '--',
      note: '未完成',
      result: '待录入',
      status: '待录入',
      tone: 'info' as Tone,
    }
  }

  const diffValue = Number((actual - target).toFixed(1))
  const absDiff = Math.abs(diffValue)
  const result: MesInspectionResult = absDiff <= 0.4 ? 'pass' : absDiff <= 0.6 ? 'review' : 'fail'

  return {
    diff: `${diffValue > 0 ? '+' : ''}${diffValue.toFixed(1)}`,
    note: result === 'pass' ? '正常' : result === 'review' ? '接近上限' : '超差',
    result: resultTextMap[result],
    status: result === 'pass' ? '已检' : '待确认',
    tone: resultToTone(result),
  }
}

function createGroupRecord(data: {
  actualWidth?: number | null
  groupNo: string
  note?: string
  result?: MesInspectionResult
  splitItemId?: number | null
  targetWidth: number
}) {
  const actualWidth = data.actualWidth === undefined || data.actualWidth === null ? null : Number(data.actualWidth)
  const status = normalizeGroupResult(Number(data.targetWidth), actualWidth)
  const result = data.result ? {
    diff: status.diff,
    note: data.note || status.note,
    result: resultTextMap[data.result],
    status: data.result === 'pass' ? '已检' : '待确认',
    tone: resultToTone(data.result),
  } : status

  return {
    actual: actualWidth === null ? '' : String(actualWidth),
    diff: result.diff,
    group: data.groupNo,
    note: result.note,
    result: result.result,
    splitItemId: data.splitItemId,
    status: result.status,
    target: String(Number(data.targetWidth)),
    tone: result.tone,
  }
}

function applyInspectionDetail(detail: MesInspectionDetail) {
  hasInspectionOrder.value = true
  orderInfo.value = {
    customerName: detail.order.customerName,
    machineCode: detail.order.machineCode,
    material: detail.order.material,
    orderNo: detail.order.orderNo,
    status: detail.order.status,
    thickness: detail.order.thickness,
    width: detail.order.width,
  }

  if (detail.inspection) {
    thicknessValue.value = String(detail.inspection.thicknessValue)
    thicknessResult.value = detail.inspection.thicknessResult
    latestFinalResult.value = detail.inspection.finalResult
    activeStatus.value = finalResultTextMap[detail.inspection.finalResult] || '合格'
    abnormalNote.value = detail.inspection.abnormalNote || ''
    groups.value = detail.inspection.widthGroups.map((group) => createGroupRecord({
      actualWidth: group.actualWidth,
      groupNo: group.groupNo,
      note: group.note,
      result: group.result,
      splitItemId: group.splitItemId,
      targetWidth: group.targetWidth,
    }))
    return
  }

  latestFinalResult.value = ''
  thicknessValue.value = String(detail.order.thickness)
  groups.value = detail.order.splitItems.map((item) => createGroupRecord({
    actualWidth: null,
    groupNo: item.groupNo,
    splitItemId: item.id,
    targetWidth: item.targetWidth,
  }))
}

async function loadInspectionDetail() {
  try {
    const orderNo = await resolveInspectionOrderNo()
    if (!orderNo) {
      resetInspectionOrder()
      uni.showToast({ title: '暂无待质检指令', icon: 'none' })
      return
    }

    const detail = await getMesInspectionDetail(orderNo)
    applyInspectionDetail(detail)
  } catch (error) {
    resetInspectionOrder()
    console.warn('load inspection detail failed', error)
    uni.showToast({
      title: error instanceof Error ? error.message : '读取质检指令失败',
      icon: 'none',
    })
  }
}

async function resolveInspectionOrderNo() {
  if (routeOrderNo.value) return routeOrderNo.value
  if (orderStore.selectedPendingInspectionOrderNo) return orderStore.selectedPendingInspectionOrderNo

  const data = await getMesOrders({
    pageNum: 1,
    pageSize: 1,
    status: 'pending_inspection',
  })

  return data.row[0]?.orderNo || ''
}

function resetInspectionOrder() {
  hasInspectionOrder.value = false
  activeStatus.value = '合格'
  abnormalNote.value = ''
  thicknessResult.value = 'pass'
  thicknessValue.value = ''
  latestFinalResult.value = ''
  groups.value = []
  orderInfo.value = {
    customerName: '请先在指令页确认上机',
    machineCode: '-',
    material: '-',
    orderNo: '暂无待质检指令',
    status: 'pending_inspection',
    thickness: 0,
    width: 0,
  }
}

function setThicknessResult(value: string) {
  if (value.includes('不合格')) {
    thicknessResult.value = 'fail'
    return
  }
  if (value.includes('复核')) {
    thicknessResult.value = 'review'
    return
  }
  thicknessResult.value = 'pass'
}

function updateGroupActual(groupNo: string, value: string) {
  groups.value = groups.value.map((group) => {
    if (group.group !== groupNo) return group

    return {
      ...group,
      ...normalizeGroupResult(toNumber(group.target), value ? toNumber(value) : null),
      actual: value,
    }
  })
}

function addGroup() {
  const index = groups.value.length + 1
  groups.value = [
    ...groups.value,
    createGroupRecord({
      actualWidth: null,
      groupNo: `G${String(index).padStart(2, '0')}`,
      targetWidth: 0,
    }),
  ]
  uni.showToast({ title: '已新增分组', icon: 'none' })
}

async function submitInspection() {
  if (!canSubmitInspection.value) {
    uni.showToast({ title: '当前角色不能提交质检', icon: 'none' })
    return
  }

  if (!hasInspectionOrder.value) {
    uni.showToast({ title: '暂无可提交的质检指令', icon: 'none' })
    return
  }

  const completedGroups = groups.value.filter((group) => group.actual)
  if (!thicknessValue.value || completedGroups.length !== groups.value.length) {
    uni.showToast({ title: '请补全厚度和分组宽度', icon: 'none' })
    return
  }

  try {
    const detail = await submitMesInspection({
      abnormalNote: abnormalNote.value,
      finalResult: finalResultMap[activeStatus.value] || 'pass',
      orderId: orderInfo.value.orderNo,
      thicknessResult: thicknessResult.value,
      thicknessValue: toNumber(thicknessValue.value),
      widthGroups: groups.value.map((group) => ({
        actualWidth: toNumber(group.actual),
        groupNo: group.group,
        note: group.note,
        result: group.tone === 'danger' ? 'fail' : group.tone === 'warning' ? 'review' : 'pass',
        splitItemId: group.splitItemId || null,
        targetWidth: toNumber(group.target),
      })),
    })
    applyInspectionDetail(detail)
    orderStore.setSelectedOrder(
      detail.order.orderNo,
      detail.order.status === 'pending_inspection' ? 'pendingInspection' : detail.order.status === 'exception' ? 'exception' : detail.order.status === 'done' ? 'done' : 'pendingLoad',
    )
    uni.showToast({ title: '质检记录已提交', icon: 'none' })
  } catch (error) {
    console.warn('submit inspection failed', error)
    latestFinalResult.value = finalResultMap[activeStatus.value] || 'pass'
    uni.showToast({ title: '接口不可用，已本地标记提交', icon: 'none' })
  }
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

onLoad((options) => {
  routeOrderNo.value = typeof options?.orderNo === 'string'
    ? decodeURIComponent(options.orderNo)
    : ''
})

onMounted(() => {
  appStore.setActiveNav('inspection')
  if (!ensurePageAccess()) return
  loadInspectionDetail()
})

function ensurePageAccess() {
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return false
  }

  if (!authStore.canAccessPage('inspection')) {
    uni.showToast({ title: '当前角色无过程质检权限', icon: 'none' })
    uni.reLaunch({ url: '/pages/stats/index' })
    return false
  }

  return true
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
.section-head,
.group-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.header-actions {
  align-items: center;
  flex-shrink: 0;
}

.eyebrow,
.desc,
.muted,
.section-desc,
.spec-label,
.field-label,
.group-detail {
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

.muted,
.section-desc {
  margin-top: 10rpx;
}

.summary-card,
.panel,
.group-card {
  border: 1rpx solid #d8dee8;
  border-radius: 16rpx;
  background: #ffffff;
}

.summary-card {
  margin-top: 24rpx;
  padding: 20rpx;
  display: grid;
  grid-template-columns: minmax(260rpx, 0.55fr) 1fr;
  gap: 18rpx;
  align-items: center;
}

.order-id,
.section-title,
.group-title {
  display: block;
  color: #1b2430;
  font-size: 30rpx;
  font-weight: 850;
  line-height: 1.35;
}

.summary-specs,
.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
}

.form-grid {
  margin-top: 18rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.spec-item {
  min-height: 72rpx;
  padding: 10rpx 12rpx;
  border-radius: 12rpx;
  background: #f3f6fb;
}

.spec-value {
  display: block;
  margin-top: 8rpx;
  color: #243040;
  font-size: 24rpx;
  font-weight: 760;
  line-height: 1.45;
}

.layout-grid {
  margin-top: 22rpx;
  padding-bottom: 40rpx;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(340rpx, 0.8fr);
  gap: 22rpx;
}

.left-stack,
.right-stack,
.group-list,
.check-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.panel,
.group-card {
  padding: 20rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.field-input,
.field-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid #d8dee8;
  border-radius: 14rpx;
  background: #f8fafc;
  color: #1b2430;
  font-size: 24rpx;
  font-weight: 700;
}

.field-input {
  height: 64rpx;
  padding: 0 18rpx;
}

.textarea-field {
  margin-top: 16rpx;
}

.field-textarea {
  min-height: 124rpx;
  padding: 18rpx;
  line-height: 1.55;
}

.status-tag {
  min-height: 40rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 22rpx;
  font-weight: 800;
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

.group-detail {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.detail-box {
  min-height: 72rpx;
  padding: 10rpx;
  border-radius: 12rpx;
  background: #f3f6fb;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.detail-box text:first-child {
  color: #647184;
  font-size: 20rpx;
}

.detail-box text:last-child,
.group-input {
  margin-top: 8rpx;
  color: #243040;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.45;
}

.group-input {
  width: 100%;
  height: 32rpx;
  min-height: 32rpx;
}

.segment {
  margin-top: 18rpx;
  padding: 6rpx;
  border: 1rpx solid #d8dee8;
  border-radius: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6rpx;
}

.segment-item {
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #647184;
  font-size: 24rpx;
  font-weight: 800;
}

.segment-item.active {
  color: #ffffff;
  background: #246bfe;
}

.status-desc {
  margin-top: 18rpx;
}

.check-row {
  display: grid;
  grid-template-columns: 18rpx 1fr;
  gap: 14rpx;
}

.check-dot {
  width: 16rpx;
  height: 16rpx;
  margin-top: 10rpx;
  border-radius: 50%;
  background: #246bfe;
}

.check-title {
  display: block;
  color: #243040;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}

.action-grid {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12rpx;
}

.primary-button,
.ghost-button,
uni-button.primary-button,
uni-button.ghost-button {
  margin: 0;
  height: 64rpx;
  min-width: 132rpx;
  padding: 0 24rpx;
  border-radius: 14rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  overflow: visible;
}

.primary-button::after,
.ghost-button::after,
uni-button.primary-button::after,
uni-button.ghost-button::after {
  border: 0;
}

.primary-button {
  border: 1rpx solid #246bfe;
  color: #ffffff;
  background: #246bfe;
}

.ghost-button {
  border: 1rpx solid #d8dee8;
  color: #243040;
  background: #ffffff;
}

.button-hover {
  opacity: 0.78;
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

  .layout-grid,
  .summary-card {
    grid-template-columns: 1fr;
  }

  .right-stack {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .right-stack .panel:last-child {
    grid-column: 1 / -1;
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

@media screen and (max-width: 700px) {
  .header {
    display: block;
  }

  .header-actions {
    margin-top: 18rpx;
    justify-content: space-between;
  }

  .title {
    font-size: 40rpx;
  }

  .summary-specs,
  .form-grid,
  .right-stack {
    grid-template-columns: 1fr;
  }

  .group-detail {
    grid-template-columns: 1fr;
  }
}

/* #ifdef MP */
.workspace {
  padding-top: calc(28rpx + var(--status-bar-height) + 88rpx);
}
/* #endif */
</style>
