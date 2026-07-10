const BASE_URL = import.meta.env.VITE_APP_BASE_API || '/api'
const API_ORIGIN = import.meta.env.VITE_APP_API_ORIGIN || import.meta.env.VITE_MES_API_PROXY_TARGET || 'https://localhost'
const MES_TOKEN_KEY = 'mes_token'
const MES_USER_KEY = 'mes_user'
let SHOULD_PREFIX_API_ORIGIN = true

// #ifdef H5
SHOULD_PREFIX_API_ORIGIN = false
// #endif

type HttpMethod = 'GET' | 'POST' | 'DELETE'

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
  success: boolean
}

interface RequestOptions {
  data?: Record<string, unknown>
  method?: HttpMethod
  needAuth?: boolean
  url: string
}

export interface MesPermission {
  code: string
  description: string
  id: number
  module: string
  name: string
  type: 'page' | 'action' | 'data'
}

export interface MesRole {
  code: string
  description: string
  id: number
  name: string
  permissions: MesPermission[]
  sortOrder: number
}

export interface MesUser {
  account: string
  createdAt: string
  id: number
  lastLoginAt: string | null
  phone: string
  realName: string
  roles: MesRole[]
  status: 'active' | 'disabled'
  updatedAt: string
  username: string
}

export interface MesLoginResult {
  accessToken: string
  token: string
  userInfo: MesUser
}

export interface MesPageResult<T> {
  row: T[]
  total: number
}

export interface MesOrderSplitItem {
  groupNo: string
  id: number
  quantity: number
  sortOrder: number
  targetWidth: number
  tolerance: string
}

export interface MesScanRecord {
  coilCode: string
  id: number
  matched: boolean
  material: string
  mismatchReason: string
  scannedAt: string
  scannedBy: number | null
  thickness: number
  weight: number
  width: number
}

export interface MesOrder {
  assignedUserId: number | null
  createdAt: string
  customerName: string
  dueDate: string
  exceptions: Array<Record<string, unknown>>
  id: number
  machineCode: string
  material: string
  orderNo: string
  priority: number
  remark: string
  scanRecords: MesScanRecord[]
  splitItems: MesOrderSplitItem[]
  status: 'pending_load' | 'pending_inspection' | 'exception' | 'done'
  thickness: number
  updatedAt: string
  weight: number
  width: number
}

export type MesInspectionResult = 'pass' | 'fail' | 'review'
export type MesInspectionFinalResult = 'pass' | 'fail' | 'rework' | 'review'

export interface MesInspectionWidthGroup {
  actualWidth: number
  diffValue: number
  groupNo: string
  id: number
  inspectionId: number
  note: string
  result: MesInspectionResult
  splitItem: MesOrderSplitItem | null
  splitItemId: number | null
  targetWidth: number
}

export interface MesInspectionRecord {
  abnormalNote: string
  finalResult: MesInspectionFinalResult
  id: number
  inspectorId: number | null
  orderId: number
  status: 'submitted' | 'confirmed'
  submittedAt: string
  thicknessResult: MesInspectionResult
  thicknessValue: number
  updatedAt: string
  widthGroups: MesInspectionWidthGroup[]
}

export interface MesInspectionDetail {
  inspection: MesInspectionRecord | null
  order: MesOrder
  widthGroups: MesInspectionWidthGroup[]
}

export interface SubmitMesInspectionPayload {
  abnormalNote?: string
  finalResult: MesInspectionFinalResult
  orderId: number | string
  thicknessResult: MesInspectionResult
  thicknessValue: number
  widthGroups: Array<{
    actualWidth: number
    groupNo: string
    note?: string
    result: MesInspectionResult
    splitItemId?: number | null
    targetWidth: number
  }>
}

export type MesStatsTone = 'info' | 'success' | 'warning' | 'danger'

export interface MesStatsStatusItem {
  key: string
  label: string
  percent: number
  tone: MesStatsTone
  value: number
}

export interface MesStatsExceptionItem {
  createdAt: string
  description: string
  id: number
  orderNo: string
  owner: string
  status: string
  tone: MesStatsTone
  type: string
}

export interface MesStatsDashboard {
  exceptions: MesStatsExceptionItem[]
  generatedAt: string
  metrics: {
    doneTotal: number
    exceptionTotal: number
    orderTotal: number
    passRate: number
    pendingExceptionTotal: number
  }
  period: 'today' | 'week'
  qualityStats: {
    fail: number
    pass: number
    pending: number
    review: number
  }
  range: {
    endDate: string
    startDate: string
  }
  statusStats: MesStatsStatusItem[]
}

export function getMesToken() {
  return uni.getStorageSync(MES_TOKEN_KEY) || ''
}

export function getStoredMesUser(): MesUser | null {
  return uni.getStorageSync(MES_USER_KEY) || null
}

export function setMesSession(data: MesLoginResult) {
  uni.setStorageSync(MES_TOKEN_KEY, data.accessToken || data.token)
  uni.setStorageSync(MES_USER_KEY, data.userInfo)
}

export function clearMesSession() {
  uni.removeStorageSync(MES_TOKEN_KEY)
  uni.removeStorageSync(MES_USER_KEY)
}

function getRequestBaseUrl() {
  if (/^https?:\/\//.test(BASE_URL)) return BASE_URL
  if (!SHOULD_PREFIX_API_ORIGIN) return BASE_URL

  return `${API_ORIGIN.replace(/\/$/, '')}${BASE_URL.startsWith('/') ? BASE_URL : `/${BASE_URL}`}`
}

function buildUrl(url: string, method: HttpMethod, data?: Record<string, unknown>) {
  const requestUrl = `${getRequestBaseUrl()}${url}`
  if (method !== 'GET' || !data) return requestUrl

  const query = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return query ? `${requestUrl}?${query}` : requestUrl
}

function request<T>(options: RequestOptions): Promise<T> {
  const method = options.method || 'GET'
  const token = getMesToken()

  return new Promise((resolve, reject) => {
    uni.request({
      data: method === 'GET' ? undefined : options.data,
      header: {
        ...(options.needAuth === false || !token ? {} : { Authorization: `Bearer ${token}` }),
      },
      method,
      url: buildUrl(options.url, method, options.data),
      success: (response) => {
        const body = response.data as ApiResponse<T>
        if (response.statusCode === 401) {
          clearMesSession()
          uni.navigateTo({ url: '/pages/login/index' })
          reject(new Error(body?.message || '登录已过期'))
          return
        }

        if (response.statusCode >= 400 || body?.success === false) {
          reject(new Error(body?.message || '请求失败'))
          return
        }

        resolve(body.data)
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}

export function mesLogin(username: string, password: string) {
  return request<MesLoginResult>({
    data: { password, username },
    method: 'POST',
    needAuth: false,
    url: '/mes/auth/login',
  })
}

export function getMesProfile() {
  return request<MesUser>({
    url: '/mes/auth/profile',
  })
}

export function getMesRoles() {
  return request<MesRole[]>({
    url: '/mes/roles/list',
  })
}

export function getMesUsers(params: Record<string, unknown> = {}) {
  return request<MesPageResult<MesUser>>({
    data: params,
    url: '/mes/users/page',
  })
}

export function createMesUser(data: {
  account: string
  name: string
  password: string
  roleCode: string
}) {
  return request<MesUser>({
    data,
    method: 'POST',
    url: '/mes/users/add',
  })
}

export function assignMesUserRole(userId: number | string, roleCode: string) {
  return request<MesUser>({
    data: { roleCode, userId },
    method: 'POST',
    url: '/mes/users/assign-role',
  })
}

export function getMesOrders(params: Record<string, unknown> = {}) {
  return request<MesPageResult<MesOrder>>({
    data: params,
    url: '/mes/orders/page',
  })
}

export function getMesOrderDetail(id: number | string) {
  return request<MesOrder>({
    data: { id },
    url: '/mes/orders/detail',
  })
}

export function createMesOrder(data: {
  customerName: string
  dueDate: string
  machineCode: string
  material: string
  orderNo: string
  priority: number
  remark?: string
  splitItems: Array<{
    groupNo: string
    quantity: number
    sortOrder: number
    targetWidth: number
    tolerance: string
  }>
  status: MesOrder['status']
  thickness: number
  weight: number
  width: number
}) {
  return request<MesOrder>({
    data,
    method: 'POST',
    url: '/mes/orders/add',
  })
}

export function confirmMesOrderLoad(data: {
  coilCode: string
  id: number | string
  material: string
  thickness: number
  weight: number
  width: number
}) {
  return request<MesOrder>({
    data,
    method: 'POST',
    url: '/mes/orders/confirm-load',
  })
}

export function createMesOrderException(data: {
  description: string
  exceptionType?: string
  id: number | string
}) {
  return request<MesOrder>({
    data,
    method: 'POST',
    url: '/mes/orders/exception',
  })
}

export function closeMesOrderException(id: number | string) {
  return request<MesOrder>({
    data: { id },
    method: 'POST',
    url: '/mes/orders/close-exception',
  })
}

export function getMesInspectionDetail(orderId: number | string) {
  return request<MesInspectionDetail>({
    data: { orderId },
    url: '/mes/inspections/detail',
  })
}

export function submitMesInspection(data: SubmitMesInspectionPayload) {
  return request<MesInspectionDetail>({
    data,
    method: 'POST',
    url: '/mes/inspections/submit',
  })
}

export function getMesStatsDashboard(period: 'today' | 'week' = 'today') {
  return request<MesStatsDashboard>({
    data: { period },
    url: '/mes/stats/dashboard',
  })
}
