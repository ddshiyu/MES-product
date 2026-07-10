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
            <text class="eyebrow">生产指令 · 今日 · 全部机台</text>
            <text class="title">生产指令</text>
            <text class="desc">按状态、交期、客户和材质快速定位生产任务。</text>
          </view>
          <view class="header-actions">
            <button
              v-if="canLoadOrder"
              class="ghost-button"
              hover-class="button-hover"
              @tap="addRandomOrder"
            >
              新增订单
            </button>
            <button
              v-if="canLoadOrder"
              class="primary-button"
              hover-class="button-hover"
              @tap="simulateScan"
            >
              QR 扫码
            </button>
            <button class="logout-button" hover-class="button-hover" @tap="handleLogout">退出</button>
          </view>
        </view>

        <view class="filter-panel">
          <view class="search-box">
            <input
              class="search-input"
              :value="searchKeyword"
              confirm-type="search"
              placeholder="搜索指令号 / 客户 / 母卷码"
              placeholder-class="search-placeholder"
              @confirm="handleSearchInput"
              @input="handleSearchInput"
            />
          </view>
          <view class="filter-row">
            <view class="filter-chip">状态：{{ currentTabLabel }}</view>
            <view class="filter-chip">交期：本周</view>
            <view class="filter-chip">材质：全部</view>
          </view>
          <scroll-view scroll-x class="tabs">
            <view class="tab-row">
              <view
                v-for="tab in tabs"
                :key="tab.key"
                class="tab"
                :class="{ active: tab.key === currentTab }"
                @click.stop="setCurrentTab(tab.key)"
                @tap.stop="setCurrentTab(tab.key)"
              >
                {{ tab.label }}
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="layout-grid">
          <view class="order-list">
            <view
              v-for="order in filteredOrders"
              :key="order.id"
              class="order-card"
              :class="{ selected: order.id === selectedOrder?.id }"
              @tap="selectOrder(order.id)"
            >
              <view class="order-head">
                <view>
                  <text class="order-id">{{ order.id }}</text>
                  <text class="order-meta">{{ order.customer }} · {{ order.machine }} · 交期 {{ order.dueDate }}</text>
                </view>
                <text class="status-tag" :class="order.tone">{{ order.status }}</text>
              </view>
              <view class="spec-grid">
                <view class="spec-item">
                  <text class="spec-label">材质</text>
                  <text class="spec-value">{{ order.material }}</text>
                </view>
                <view class="spec-item">
                  <text class="spec-label">厚度</text>
                  <text class="spec-value">{{ order.thickness }}</text>
                </view>
                <view class="spec-item">
                  <text class="spec-label">宽度</text>
                  <text class="spec-value">{{ order.width }}</text>
                </view>
                <view class="spec-item">
                  <text class="spec-label">重量</text>
                  <text class="spec-value">{{ order.weight }}</text>
                </view>
              </view>
            </view>
            <view v-if="filteredOrders.length === 0" class="empty-state">暂无该状态指令</view>
          </view>

          <view v-if="selectedOrder" class="detail-stack">
            <view class="panel">
              <view class="section-head">
                <view>
                  <text class="section-title">指令详情</text>
                  <text class="section-desc">{{ selectedOrder.customer }} · {{ selectedOrder.id }}</text>
                </view>
                <text class="status-tag" :class="selectedOrder.tone">{{ selectedOrder.status }}</text>
              </view>
              <view class="detail-grid">
                <view v-for="item in detailItems" :key="item.label" class="detail-item">
                  <text class="spec-label">{{ item.label }}</text>
                  <text class="detail-value">{{ item.value }}</text>
                </view>
              </view>
              <view class="detail-split">
                <view class="split-head">
                  <view>
                    <text class="split-title">分切方案</text>
                    <text class="section-desc">随指令一起确认宽度、数量和公差</text>
                  </view>
                  <text class="status-tag info">{{ selectedOrder.splitPlan.length }} 组</text>
                </view>
                <view class="split-list">
                  <view v-for="plan in selectedOrder.splitPlan" :key="plan.group" class="split-row">
                    <text>{{ plan.group }}</text>
                    <text>{{ plan.width }}</text>
                    <text>{{ plan.qty }}</text>
                    <text>{{ plan.tolerance }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="panel">
              <view class="section-head">
                <view>
                  <text class="section-title">母材校验</text>
                  <text class="section-desc">扫码后逐项比对指令要求</text>
                </view>
                <text class="status-tag" :class="selectedOrder.validationTone">{{ selectedOrder.validationText }}</text>
              </view>
              <view class="check-list">
                <view v-for="item in selectedOrder.validation" :key="item.label" class="check-row">
                  <text class="check-label">{{ item.label }}</text>
                  <text class="check-value">要求 {{ item.expected }}</text>
                  <text class="check-result" :class="item.ok ? 'success' : 'danger'">{{ item.actual }}</text>
                </view>
              </view>
              <view class="action-row">
                <button
                  v-if="selectedOrder.statusKey === 'exception' && canRecordException"
                  class="ghost-button"
                  hover-class="button-hover"
                  @tap="clearException"
                >
                  清除异常
                </button>
                <button
                  v-if="canRecordException"
                  class="ghost-button"
                  hover-class="button-hover"
                  @tap="recordException"
                >
                  记录异常
                </button>
                <button
                  v-if="canLoadOrder"
                  class="primary-button"
                  hover-class="button-hover"
                  @tap="confirmLoad"
                >
                  确认上机
                </button>
              </view>
            </view>
          </view>
          <view v-else class="detail-stack">
            <view class="panel empty-detail">
              <text class="section-title">暂无生产指令</text>
              <text class="section-desc">点击右上角“新增订单”创建第一条生产指令。</text>
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
import { storeToRefs } from 'pinia'

import {
  closeMesOrderException,
  confirmMesOrderLoad,
  createMesOrder,
  createMesOrderException,
  getMesOrders,
  type MesOrder,
} from '@/api/mes'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'

type Tone = 'info' | 'success' | 'warning' | 'danger'
type TabKey = 'all' | 'pendingLoad' | 'pendingInspection' | 'exception' | 'done'

interface ValidationItem {
  label: string
  expected: string
  actual: string
  ok: boolean
}

interface SplitPlan {
  group: string
  width: string
  qty: string
  tolerance: string
}

interface ScannedMaterial {
  coilCode: string
  material: string
  thickness: number
  weight: number
  width: number
}

interface Order {
  backendId: number | string
  id: string
  customer: string
  machine: string
  material: string
  thickness: string
  width: string
  weight: string
  dueDate: string
  status: string
  statusKey: string
  tone: Tone
  validationText: string
  validationTone: Tone
  validation: ValidationItem[]
  splitPlan: SplitPlan[]
  scannedMaterial?: ScannedMaterial
}

const activeNav = 'orders'
const appStore = useAppStore()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const {
  currentTab,
  searchKeyword,
  selectedOrderNo: selectedOrderId,
} = storeToRefs(orderStore)

const allNavItems = [
  { key: 'stats', label: '统计', url: '/pages/stats/index' },
  { key: 'orders', label: '指令', url: '/pages/orders/index' },
  { key: 'inspection', label: '质检', url: '/pages/inspection/index' },
  { key: 'access', label: '权限', url: '/pages/access/index' },
]

const navItems = computed(() => allNavItems.filter((item) => authStore.canAccessPage(item.key)))
const canLoadOrder = computed(() => authStore.can('orders:load'))
const canRecordException = computed(() => authStore.can('orders:exception'))

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pendingLoad', label: '待上机' },
  { key: 'pendingInspection', label: '待质检' },
  { key: 'exception', label: '异常' },
  { key: 'done', label: '已完成' },
]

const orders = ref<Order[]>([])
const routeTarget = ref<{ orderNo?: string; status?: TabKey }>({})

onMounted(() => {
  appStore.setActiveNav('orders')
  if (!ensurePageAccess()) return
  loadOrders()
})

function ensurePageAccess() {
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return false
  }

  if (!authStore.canAccessPage('orders')) {
    uni.showToast({ title: '当前角色无生产指令权限', icon: 'none' })
    uni.reLaunch({ url: '/pages/stats/index' })
    return false
  }

  return true
}

onLoad((options) => {
  routeTarget.value = {
    orderNo: typeof options?.orderNo === 'string' ? decodeURIComponent(options.orderNo) : undefined,
    status: normalizeTabKey(options?.status),
  }

  if (routeTarget.value.status) {
    orderStore.setCurrentTab(routeTarget.value.status)
  }
})

async function loadOrders() {
  try {
    const data = await getMesOrders({ pageNum: 1, pageSize: 50 })
    if (data.row.length > 0) {
      orders.value = data.row.map(mapApiOrder)
      applyRouteOrFilterSelection()
    } else {
      applyRouteOrFilterSelection()
    }
  } catch (error) {
    applyRouteOrFilterSelection()
    uni.showToast({
      title: error instanceof Error ? error.message : '读取指令接口失败',
      icon: 'none',
    })
  }
}

const filteredOrders = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const tabFilteredOrders = currentTab.value === 'all'
    ? orders.value
    : orders.value.filter((order) => order.statusKey === currentTab.value)

  if (!keyword) return tabFilteredOrders

  return tabFilteredOrders.filter((order) => getOrderSearchText(order).includes(keyword))
})

const selectedOrder = computed(() => {
  return filteredOrders.value.find((order) => order.id === selectedOrderId.value) || filteredOrders.value[0]
})

const detailItems = computed(() => [
  { label: '客户', value: selectedOrder.value?.customer || '-' },
  { label: '机台', value: selectedOrder.value?.machine || '-' },
  { label: '材质', value: selectedOrder.value?.material || '-' },
  { label: '厚度', value: selectedOrder.value?.thickness || '-' },
  { label: '宽度', value: selectedOrder.value?.width || '-' },
  { label: '重量', value: selectedOrder.value?.weight || '-' },
  { label: '交期', value: selectedOrder.value?.dueDate || '-' },
  { label: '分切', value: `${selectedOrder.value?.splitPlan.length || 0} 组` },
])

const currentTabLabel = computed(() => tabs.find((tab) => tab.key === currentTab.value)?.label || '全部')

function setCurrentTab(tabKey: string) {
  orderStore.setCurrentTab(normalizeTabKey(tabKey) || 'all')
  routeTarget.value = {}
  selectFirstFilteredOrder()
}

function handleSearchInput(event: { detail: { value: string } }) {
  orderStore.setSearchKeyword(String(event.detail.value || ''))
  routeTarget.value = {}
  selectFirstFilteredOrder()
}

function selectOrder(orderId: string) {
  const order = orders.value.find((item) => item.id === orderId)
  orderStore.setSelectedOrder(orderId, normalizeTabKey(order?.statusKey) || '')
}

function selectFirstFilteredOrder() {
  const firstOrder = filteredOrders.value[0]
  orderStore.setSelectedOrder(firstOrder?.id || '', firstOrder ? normalizeTabKey(firstOrder.statusKey) || '' : '')
}

function applyRouteOrFilterSelection() {
  const targetOrder = routeTarget.value.orderNo
    ? orders.value.find((order) => order.id === routeTarget.value.orderNo)
    : null

  if (targetOrder) {
    orderStore.setCurrentTab(routeTarget.value.status || normalizeTabKey(targetOrder.statusKey) || 'all')
    orderStore.setSelectedOrder(targetOrder.id, normalizeTabKey(targetOrder.statusKey) || '')
    return
  }

  if (routeTarget.value.status) {
    orderStore.setCurrentTab(routeTarget.value.status)
  }

  selectFirstFilteredOrder()
}

function normalizeTabKey(value: unknown): TabKey | undefined {
  return tabs.some((tab) => tab.key === value) ? value as TabKey : undefined
}

function getOrderSearchText(order: Order) {
  return [
    order.id,
    order.customer,
    order.machine,
    order.material,
    order.dueDate,
    order.scannedMaterial?.coilCode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function simulateScan() {
  if (!canLoadOrder.value) {
    uni.showToast({ title: '当前角色不能扫码上机', icon: 'none' })
    return
  }

  const order = selectedOrder.value
  if (!order) {
    uni.showToast({ title: '请先新增订单', icon: 'none' })
    return
  }
  const scannedMaterial = createRandomScan(order)
  replaceOrder({
    ...order,
    scannedMaterial,
    validation: buildValidation(order, scannedMaterial),
    validationText: isScanMatched(order, scannedMaterial) ? '全部匹配' : '存在异常',
    validationTone: isScanMatched(order, scannedMaterial) ? 'success' : 'danger',
  })
  orderStore.saveScan(order.id, scannedMaterial)
  uni.showToast({ title: `已读取母卷 ${scannedMaterial.coilCode}`, icon: 'none' })
}

async function addRandomOrder() {
  if (!canLoadOrder.value) {
    uni.showToast({ title: '当前角色不能新增订单', icon: 'none' })
    return
  }

  const payload = createRandomOrderPayload()
  const localOrder = mapRandomPayloadToOrder(payload)

  try {
    const created = await createMesOrder(payload)
    replaceOrder(mapApiOrder(created))
    orderStore.setCurrentTab('all')
    orderStore.setSearchKeyword('')
    uni.showToast({ title: '订单已新增', icon: 'none' })
  } catch (error) {
    replaceOrder(localOrder)
    orderStore.setCurrentTab('all')
    orderStore.setSearchKeyword('')
    uni.showToast({
      title: error instanceof Error ? '接口不可用，已本地新增' : '已本地新增订单',
      icon: 'none',
    })
  }
}

async function recordException() {
  if (!canRecordException.value) {
    uni.showToast({ title: '当前角色不能记录异常', icon: 'none' })
    return
  }

  if (!selectedOrder.value) {
    uni.showToast({ title: '请先选择订单', icon: 'none' })
    return
  }

  try {
    const updated = await createMesOrderException({
      description: '现场手动记录异常',
      exceptionType: 'manual',
      id: selectedOrder.value.backendId,
    })
    replaceOrder(mapApiOrder(updated))
    uni.showToast({ title: '异常记录已提交', icon: 'none' })
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '提交异常失败',
      icon: 'none',
    })
  }
}

async function clearException() {
  if (!canRecordException.value) {
    uni.showToast({ title: '当前角色不能清除异常', icon: 'none' })
    return
  }

  const order = selectedOrder.value
  if (!order) {
    uni.showToast({ title: '请先选择订单', icon: 'none' })
    return
  }

  try {
    const updated = await closeMesOrderException(order.backendId)
    replaceOrder(mapApiOrder(updated))
    uni.showToast({ title: '异常已清除', icon: 'none' })
  } catch (error) {
    replaceOrder(createClearedLocalOrder(order))
    uni.showToast({
      title: error instanceof Error ? '接口不可用，已本地清除' : '异常已本地清除',
      icon: 'none',
    })
  }
}

async function confirmLoad() {
  if (!canLoadOrder.value) {
    uni.showToast({ title: '当前角色不能确认上机', icon: 'none' })
    return
  }

  try {
    const order = selectedOrder.value
    if (!order) {
      uni.showToast({ title: '请先新增订单', icon: 'none' })
      return
    }
    const scannedMaterial = order.scannedMaterial || orderStore.scannedMaterials[order.id] || createMatchedScan(order)
    const updated = await confirmMesOrderLoad({
      coilCode: scannedMaterial.coilCode,
      id: order.backendId,
      material: scannedMaterial.material,
      thickness: scannedMaterial.thickness,
      weight: scannedMaterial.weight,
      width: scannedMaterial.width,
    })
    replaceOrder(mapApiOrder(updated))
    uni.showToast({ title: '上机记录已提交', icon: 'none' })
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '确认上机失败',
      icon: 'none',
    })
  }
}

function createClearedLocalOrder(order: Order): Order {
  const hasMatchedScan = order.scannedMaterial ? isScanMatched(order, order.scannedMaterial) : false
  const statusMeta = hasMatchedScan
    ? {
      key: 'pendingInspection',
      label: '待质检',
      tone: 'warning' as Tone,
      validationText: '已上机',
      validationTone: 'success' as Tone,
    }
    : {
      key: 'pendingLoad',
      label: '待上机',
      tone: 'info' as Tone,
      validationText: '待扫码',
      validationTone: 'info' as Tone,
    }

  return {
    ...order,
    status: statusMeta.label,
    statusKey: statusMeta.key,
    tone: statusMeta.tone,
    validationText: statusMeta.validationText,
    validationTone: statusMeta.validationTone,
  }
}

function createMatchedScan(order: Order): ScannedMaterial {
  return {
    coilCode: createCoilCode(),
    material: order.material,
    thickness: Number.parseFloat(order.thickness),
    weight: Number.parseFloat(order.weight),
    width: Number.parseFloat(order.width),
  }
}

function createRandomScan(order: Order): ScannedMaterial {
  const base = createMatchedScan(order)
  const samples: ScannedMaterial[] = [
    base,
    {
      ...base,
      coilCode: createCoilCode(),
      weight: Number((base.weight - 0.03).toFixed(2)),
    },
    {
      ...base,
      coilCode: createCoilCode(),
      width: base.width - 20,
    },
    {
      ...base,
      coilCode: createCoilCode(),
      material: base.material === '304' ? '201' : '304',
    },
    {
      ...base,
      coilCode: createCoilCode(),
      thickness: Number((base.thickness + 0.1).toFixed(2)),
    },
  ]

  return samples[Math.floor(Math.random() * samples.length)]
}

function createCoilCode() {
  return `QR-MR-${Math.floor(10000 + Math.random() * 90000)}`
}

function createRandomOrderPayload() {
  const customers = ['华东精密', '南方电器', '宁海模具', '北辰设备', '远舟材料', '嘉禾电机']
  const machines = ['A-01', 'A-02', 'A-03', 'B-01', 'C-01']
  const materials = ['201', '304', '316L']
  const material = pickRandom(materials)
  const thickness = pickRandom([0.8, 1, 1.2, 1.5])
  const width = pickRandom([980, 1219, 1250, 1520])
  const weight = Number((3.5 + Math.random() * 6.5).toFixed(1))
  const groupCount = Math.floor(2 + Math.random() * 4)
  const dueDate = addDays(new Date(), Math.floor(1 + Math.random() * 5))
  const baseWidth = Math.floor(width / groupCount)

  return {
    customerName: pickRandom(customers),
    dueDate: formatDate(dueDate),
    machineCode: pickRandom(machines),
    material,
    orderNo: `SC-${formatDateCode(new Date())}-${Math.floor(100 + Math.random() * 900)}`,
    priority: Math.floor(50 + Math.random() * 50),
    remark: '随机生成订单',
    splitItems: Array.from({ length: groupCount }, (_, index) => ({
      groupNo: `G${String(index + 1).padStart(2, '0')}`,
      quantity: Math.floor(1 + Math.random() * 3),
      sortOrder: index + 1,
      targetWidth: index === groupCount - 1 ? width - baseWidth * (groupCount - 1) : baseWidth,
      tolerance: thickness >= 1.5 ? '±0.6mm' : '±0.5mm',
    })),
    status: 'pending_load' as MesOrder['status'],
    thickness,
    weight,
    width,
  }
}

function mapRandomPayloadToOrder(payload: ReturnType<typeof createRandomOrderPayload>): Order {
  return {
    backendId: payload.orderNo,
    customer: payload.customerName,
    dueDate: formatDueDate(payload.dueDate),
    id: payload.orderNo,
    machine: payload.machineCode,
    material: payload.material,
    splitPlan: payload.splitItems.map((item) => ({
      group: item.groupNo,
      qty: `${item.quantity} 卷`,
      tolerance: item.tolerance,
      width: `${trimNumber(item.targetWidth)}mm`,
    })),
    status: '待上机',
    statusKey: 'pendingLoad',
    thickness: `${trimNumber(payload.thickness)}mm`,
    tone: 'info',
    validation: [
      { label: '材质', expected: payload.material, actual: payload.material, ok: true },
      { label: '厚度', expected: trimNumber(payload.thickness), actual: trimNumber(payload.thickness), ok: true },
      { label: '宽度', expected: trimNumber(payload.width), actual: trimNumber(payload.width), ok: true },
      { label: '重量', expected: `${trimNumber(payload.weight)}t`, actual: `${trimNumber(payload.weight)}t`, ok: true },
    ],
    validationText: '待扫码',
    validationTone: 'info',
    weight: `${trimNumber(payload.weight)}t`,
    width: `${trimNumber(payload.width)}mm`,
  }
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateCode(date: Date) {
  return formatDate(date).slice(2).replace(/-/g, '')
}

function buildValidation(order: Order, scannedMaterial: ScannedMaterial): ValidationItem[] {
  const expectedThickness = Number.parseFloat(order.thickness)
  const expectedWidth = Number.parseFloat(order.width)
  const expectedWeight = Number.parseFloat(order.weight)

  return [
    { label: '母卷码', expected: '扫码读取', actual: scannedMaterial.coilCode, ok: true },
    { label: '材质', expected: order.material, actual: scannedMaterial.material, ok: scannedMaterial.material === order.material },
    { label: '厚度', expected: trimNumber(expectedThickness), actual: trimNumber(scannedMaterial.thickness), ok: Math.abs(scannedMaterial.thickness - expectedThickness) <= 0.001 },
    { label: '宽度', expected: trimNumber(expectedWidth), actual: trimNumber(scannedMaterial.width), ok: Math.abs(scannedMaterial.width - expectedWidth) <= 0.001 },
    { label: '重量', expected: `${trimNumber(expectedWeight)}t`, actual: `${trimNumber(scannedMaterial.weight)}t`, ok: Math.abs(scannedMaterial.weight - expectedWeight) <= 0.1 },
  ]
}

function isScanMatched(order: Order, scannedMaterial: ScannedMaterial) {
  return buildValidation(order, scannedMaterial).every((item) => item.ok)
}

function replaceOrder(order: Order) {
  const index = orders.value.findIndex((item) => item.id === order.id)
  if (index >= 0) {
    orders.value.splice(index, 1, order)
  } else {
    orders.value.unshift(order)
  }
  orderStore.setSelectedOrder(order.id, normalizeTabKey(order.statusKey) || '')
}

function mapApiOrder(order: MesOrder): Order {
  const latestScan = order.scanRecords[0]
  const statusMeta = getStatusMeta(order.status)

  return {
    backendId: order.id,
    customer: order.customerName,
    dueDate: formatDueDate(order.dueDate),
    id: order.orderNo,
    machine: order.machineCode,
    material: order.material,
    splitPlan: order.splitItems.map((item) => ({
      group: item.groupNo,
      qty: `${item.quantity} 卷`,
      tolerance: item.tolerance,
      width: `${trimNumber(item.targetWidth)}mm`,
    })),
    status: statusMeta.label,
    statusKey: statusMeta.key,
    thickness: `${trimNumber(order.thickness)}mm`,
    tone: statusMeta.tone,
    validation: [
      { label: '材质', expected: order.material, actual: latestScan?.material || order.material, ok: latestScan ? latestScan.material === order.material : true },
      { label: '厚度', expected: trimNumber(order.thickness), actual: latestScan ? trimNumber(latestScan.thickness) : trimNumber(order.thickness), ok: latestScan ? latestScan.thickness === order.thickness : true },
      { label: '宽度', expected: trimNumber(order.width), actual: latestScan ? trimNumber(latestScan.width) : trimNumber(order.width), ok: latestScan ? latestScan.width === order.width : true },
      { label: '重量', expected: `${trimNumber(order.weight)}t`, actual: latestScan ? `${trimNumber(latestScan.weight)}t` : `${trimNumber(order.weight)}t`, ok: latestScan ? Math.abs(latestScan.weight - order.weight) <= 0.1 : true },
    ],
    validationText: latestScan ? (latestScan.matched ? '全部匹配' : latestScan.mismatchReason || '存在异常') : statusMeta.validationText,
    validationTone: latestScan ? (latestScan.matched ? 'success' : 'danger') : statusMeta.validationTone,
    weight: `${trimNumber(order.weight)}t`,
    width: `${trimNumber(order.width)}mm`,
  }
}

function getStatusMeta(status: MesOrder['status']): {
  key: string
  label: string
  tone: Tone
  validationText: string
  validationTone: Tone
} {
  const map = {
    done: { key: 'done', label: '质检合格', tone: 'success', validationText: '已完成', validationTone: 'success' },
    exception: { key: 'exception', label: '母材异常', tone: 'danger', validationText: '存在异常', validationTone: 'danger' },
    pending_inspection: { key: 'pendingInspection', label: '待质检', tone: 'warning', validationText: '已上机', validationTone: 'success' },
    pending_load: { key: 'pendingLoad', label: '待上机', tone: 'info', validationText: '待扫码', validationTone: 'info' },
  } as const

  return map[status]
}

function trimNumber(value: number) {
  return Number(value).toFixed(2).replace(/\\.00$/, '').replace(/(\\.\\d)0$/, '$1')
}

function formatDueDate(value: string) {
  if (!value) return '-'
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : value
}

function goPage(key: string) {
  const target = navItems.value.find((item) => item.key === key)

  if (!target?.url || key === activeNav) {
    return
  }

  if (key === 'inspection' && selectedOrder.value?.statusKey === 'pendingInspection') {
    uni.navigateTo({
      url: `${target.url}?orderNo=${encodeURIComponent(selectedOrder.value.id)}`,
    })
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
  padding: 28rpx 36rpx 28rpx 28rpx;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.eyebrow,
.desc,
.section-desc,
.order-meta,
.spec-label {
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

.header-actions {
  display: flex;
  flex-shrink: 0;
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

.filter-panel,
.panel,
.order-card {
  border: 1rpx solid #d8dee8;
  border-radius: 16rpx;
  background: #ffffff;
}

.filter-panel {
  margin-top: 24rpx;
  padding: 18rpx;
}

.search-box {
  min-height: 64rpx;
  padding: 0 18rpx;
  border: 1rpx solid #d8dee8;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  background: #f8fafc;
}

.search-input {
  width: 100%;
  height: 64rpx;
  min-height: 64rpx;
  color: #1b2430;
  font-size: 24rpx;
  line-height: 64rpx;
}

.search-placeholder {
  color: #8b97a8;
}

.filter-row {
  margin-top: 14rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-chip,
.tab,
.status-tag,
.check-result {
  min-height: 40rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 22rpx;
  font-weight: 700;
}

.filter-chip {
  color: #526072;
  background: #f3f6fb;
}

.tabs {
  margin-top: 14rpx;
  white-space: nowrap;
}

.tab-row {
  display: inline-flex;
  gap: 10rpx;
}

.tab {
  color: #647184;
  background: #eef2f7;
}

.tab.active {
  color: #ffffff;
  background: #246bfe;
}

.layout-grid {
  margin-top: 22rpx;
  padding-bottom: 40rpx;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360rpx, 0.85fr);
  gap: 22rpx;
}

.order-list,
.detail-stack,
.check-list,
.split-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.order-card,
.panel {
  padding: 20rpx;
}

.empty-state {
  min-height: 160rpx;
  border: 1rpx dashed #cfd7e3;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #647184;
  background: #ffffff;
  font-size: 24rpx;
}

.order-card.selected {
  border-color: #246bfe;
  box-shadow: 0 0 0 2rpx rgba(36, 107, 254, 0.12);
}

.order-head,
.section-head,
.action-row,
.split-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.order-id,
.section-title,
.split-title {
  display: block;
  color: #1b2430;
  font-size: 30rpx;
  font-weight: 850;
  line-height: 1.35;
}

.order-meta {
  margin-top: 10rpx;
}

.spec-grid,
.detail-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.spec-item,
.detail-item {
  min-height: 74rpx;
  padding: 10rpx 12rpx;
  border-radius: 12rpx;
  background: #f3f6fb;
}

.spec-value,
.detail-value {
  display: block;
  margin-top: 8rpx;
  color: #243040;
  font-size: 24rpx;
  font-weight: 760;
  line-height: 1.45;
  word-break: keep-all;
}

.detail-split {
  margin-top: 24rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #e6ecf4;
}

.split-title {
  font-size: 28rpx;
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

.check-row {
  display: grid;
  grid-template-columns: 80rpx 1fr auto;
  gap: 12rpx;
  align-items: center;
  padding: 14rpx;
  border-radius: 14rpx;
  background: #f8fafc;
}

.check-label,
.check-value {
  color: #526072;
  font-size: 24rpx;
}

.check-label {
  color: #1b2430;
  font-weight: 800;
}

.action-row {
  margin-top: 18rpx;
}

.action-row button {
  flex: 1;
}

.split-row {
  display: grid;
  grid-template-columns: 80rpx 1fr 1fr 1fr;
  gap: 10rpx;
  padding: 14rpx;
  border-radius: 12rpx;
  color: #243040;
  background: #f8fafc;
  font-size: 24rpx;
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

  .header {
    display: block;
  }

  .header-actions {
    margin-top: 18rpx;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .header-actions .primary-button,
  .header-actions .ghost-button {
    width: 100%;
  }

  .layout-grid {
    grid-template-columns: 1fr;
  }

  .detail-stack {
    display: grid;
    grid-template-columns: 1fr;
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
  .title {
    font-size: 40rpx;
  }

  .spec-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .check-row {
    grid-template-columns: 72rpx 1fr;
  }

  .check-result {
    grid-column: 2;
    justify-self: start;
  }

  .split-row {
    grid-template-columns: 72rpx 1fr 1fr;
  }

  .split-row text:last-child {
    grid-column: 2 / -1;
  }
}

/* #ifdef MP */
.workspace {
  padding-top: calc(28rpx + var(--status-bar-height) + 88rpx);
}
/* #endif */
</style>
