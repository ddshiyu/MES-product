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
            <text class="eyebrow">权限管理 · 管理员</text>
            <text class="title">角色分配</text>
            <text class="desc">由管理员为账号主动分配角色，角色决定可访问页面和可执行操作。</text>
          </view>
          <view class="header-actions">
            <button
              v-if="canManageAccess"
              class="primary-button"
              hover-class="button-hover"
              @tap="createAccount"
            >
              新增账号
            </button>
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
          <view class="panel account-panel">
            <view class="section-head">
              <view>
                <text class="section-title">账号列表</text>
                <text class="section-desc">选择账号后在右侧调整角色</text>
              </view>
              <text class="status-tag info">{{ users.length }} 人</text>
            </view>

            <view class="user-list">
              <view
                v-for="user in users"
                :key="user.id"
                class="user-card"
                :class="{ selected: user.id === selectedUserId }"
                @tap="selectUser(user.id)"
              >
                <view class="user-main">
                  <view class="avatar" :class="user.tone">{{ user.initial }}</view>
                  <view>
                    <text class="user-name">{{ user.name }}</text>
                    <text class="section-desc">{{ user.account }}</text>
                  </view>
                </view>
                <view class="user-meta">
                  <text class="status-tag" :class="user.tone">{{ user.roleName }}</text>
                  <text class="last-login">最近 {{ user.lastLogin }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="right-stack">
            <view class="panel">
              <view class="section-head">
                <view>
                  <text class="section-title">分配角色</text>
                  <text class="section-desc">{{ selectedUser.name }} · 当前 {{ selectedUser.roleName }}</text>
                </view>
                <text class="status-tag success">已启用</text>
              </view>

              <view class="role-grid">
                <view
                  v-for="role in roles"
                  :key="role.key"
                  class="role-card"
                  :class="{ active: role.key === selectedRoleKey }"
                  @tap="selectedRoleKey = role.key"
                >
                  <text class="role-name">{{ role.name }}</text>
                  <text class="role-desc">{{ role.desc }}</text>
                </view>
              </view>

              <button
                v-if="canManageAccess"
                class="primary-button save-button"
                hover-class="button-hover"
                @tap="saveRole"
              >
                {{ isSavingRole ? '保存中' : '保存角色' }}
              </button>
            </view>

            <view class="panel">
              <text class="section-title">角色权限说明</text>
              <view class="permission-list">
                <view v-for="item in selectedRole.permissions" :key="item.label" class="permission-row">
                  <text class="permission-label">{{ item.label }}</text>
                  <text class="permission-value">{{ item.value }}</text>
                </view>
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

    <view v-if="showCreateDialog" class="modal-mask" @tap="closeCreateDialog">
      <view class="modal-card" @tap.stop>
        <view class="modal-head">
          <view>
            <text class="modal-title">新增账号</text>
            <text class="section-desc">创建账号后直接分配角色</text>
          </view>
          <text class="close-button" @tap="closeCreateDialog">×</text>
        </view>

        <view class="form-list">
          <view class="field">
            <text class="field-label">姓名</text>
            <input
              class="field-input"
              :value="newAccount.name"
              placeholder="请输入姓名"
              placeholder-class="placeholder"
              @input="newAccount.name = String($event.detail.value)"
            />
          </view>
          <view class="field">
            <text class="field-label">账号</text>
            <input
              class="field-input"
              :value="newAccount.account"
              placeholder="请输入登录账号"
              placeholder-class="placeholder"
              @input="newAccount.account = String($event.detail.value)"
            />
          </view>
          <view class="field">
            <text class="field-label">初始密码</text>
            <input
              class="field-input"
              :value="newAccount.password"
              password
              placeholder="请输入初始密码"
              placeholder-class="placeholder"
              @input="newAccount.password = String($event.detail.value)"
            />
          </view>
          <view class="field">
            <text class="field-label">确认密码</text>
            <input
              class="field-input"
              :value="newAccount.confirmPassword"
              password
              placeholder="请再次输入密码"
              placeholder-class="placeholder"
              @input="newAccount.confirmPassword = String($event.detail.value)"
            />
          </view>
          <view class="field">
            <text class="field-label">角色</text>
            <view class="dialog-role-grid">
              <view
                v-for="role in roles"
                :key="role.key"
                class="dialog-role"
                :class="{ active: role.key === newAccount.roleKey }"
                @tap="newAccount.roleKey = role.key"
              >
                {{ role.name }}
              </view>
            </view>
          </view>
        </view>

        <view class="modal-actions">
          <button class="secondary-button" hover-class="button-hover" @tap="closeCreateDialog">取消</button>
          <button class="primary-button" hover-class="button-hover" @tap="saveNewAccount">
            {{ isSavingAccount ? '保存中' : '保存' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import {
  assignMesUserRole,
  createMesUser,
  getMesRoles,
  getMesUsers,
  type MesRole,
  type MesUser,
} from '@/api/mes'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

type Tone = 'info' | 'success' | 'warning' | 'danger'
type RoleKey = 'admin' | 'leader' | 'qc' | 'viewer'

interface Metric {
  key: string
  label: string
  value: string
  badge: string
  note: string
  tone: Tone
}

interface Role {
  key: RoleKey
  name: string
  desc: string
  permissions: Array<{ label: string; value: string }>
}

interface UserItem {
  id: string
  name: string
  account: string
  roleKey: RoleKey
  roleName: string
  lastLogin: string
  initial: string
  tone: Tone
}

const activeNav = 'access'
const appStore = useAppStore()
const authStore = useAuthStore()
const selectedUserId = ref('u1')
const selectedRoleKey = ref<RoleKey>('leader')
const showCreateDialog = ref(false)
const isLoading = ref(false)
const isSavingAccount = ref(false)
const isSavingRole = ref(false)
const newAccount = ref({
  name: '',
  account: '',
  password: '',
  confirmPassword: '',
  roleKey: 'leader' as RoleKey,
})

const allNavItems = [
  { key: 'stats', label: '统计', url: '/pages/stats/index' },
  { key: 'orders', label: '指令', url: '/pages/orders/index' },
  { key: 'inspection', label: '质检', url: '/pages/inspection/index' },
  { key: 'access', label: '权限', url: '/pages/access/index' },
]

const navItems = computed(() => allNavItems.filter((item) => authStore.canAccessPage(item.key)))
const canManageAccess = computed(() => authStore.can('access:manage'))

const metrics = computed<Metric[]>(() => [
  { key: 'accounts', label: '账号总数', value: String(users.value.length), badge: '启用', note: '当前可登录账号', tone: 'info' },
  { key: 'roles', label: '角色类型', value: String(roles.value.length), badge: '固定', note: '管理员统一维护', tone: 'success' },
  { key: 'leaders', label: '班组长', value: String(users.value.filter((user) => user.roleKey === 'leader').length), badge: '生产', note: '负责指令与上机', tone: 'warning' },
  { key: 'qc', label: '质检员', value: String(users.value.filter((user) => user.roleKey === 'qc').length), badge: '质检', note: '负责录入与复核', tone: 'success' },
])

const defaultRoles: Role[] = [
  {
    key: 'admin',
    name: '管理员',
    desc: '账号与权限维护',
    permissions: [
      { label: '可访问页面', value: '统计、指令、质检、权限' },
      { label: '可执行操作', value: '新增账号、分配角色、查看统计' },
      { label: '适用人员', value: '系统管理员' },
    ],
  },
  {
    key: 'leader',
    name: '班组长',
    desc: '指令与上机操作',
    permissions: [
      { label: '可访问页面', value: '统计、生产指令' },
      { label: '可执行操作', value: '扫码上机、确认上机、记录异常' },
      { label: '适用人员', value: '生产班组负责人' },
    ],
  },
  {
    key: 'qc',
    name: '质检员',
    desc: '质检录入与复核',
    permissions: [
      { label: '可访问页面', value: '统计、过程质检' },
      { label: '可执行操作', value: '提交质检结果' },
      { label: '适用人员', value: '质检岗位' },
    ],
  },
  {
    key: 'viewer',
    name: '主管',
    desc: '统计查看',
    permissions: [
      { label: '可访问页面', value: '统计看板' },
      { label: '可执行操作', value: '查看生产状态、查看异常追踪' },
      { label: '适用人员', value: '生产主管与管理人员' },
    ],
  },
]

const roles = ref<Role[]>(defaultRoles)

const users = ref<UserItem[]>([
  { id: 'u1', name: '王强', account: 'WQ-A03', roleKey: 'leader', roleName: '班组长', lastLogin: '09:32', initial: '王', tone: 'warning' },
  { id: 'u2', name: '李敏', account: 'LM-QC', roleKey: 'qc', roleName: '质检员', lastLogin: '09:12', initial: '李', tone: 'success' },
  { id: 'u3', name: '赵宁', account: 'ADMIN', roleKey: 'admin', roleName: '管理员', lastLogin: '昨天', initial: '赵', tone: 'info' },
  { id: 'u4', name: '周琳', account: 'ZL-VIEW', roleKey: 'viewer', roleName: '主管', lastLogin: '08:46', initial: '周', tone: 'success' },
])

const selectedUser = computed(() => users.value.find((user) => user.id === selectedUserId.value) || users.value[0])
const selectedRole = computed(() => roles.value.find((role) => role.key === selectedRoleKey.value) || roles.value[0])

onMounted(() => {
  appStore.setActiveNav('access')
  if (!ensurePageAccess()) return
  loadAccessData()
})

function ensurePageAccess() {
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return false
  }

  if (!authStore.canAccessPage('access')) {
    uni.showToast({ title: '当前角色无权限管理权限', icon: 'none' })
    uni.reLaunch({ url: '/pages/stats/index' })
    return false
  }

  return true
}

async function loadAccessData() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const [roleRows, userPage] = await Promise.all([
      getMesRoles(),
      getMesUsers({ pageNum: 1, pageSize: 50 }),
    ])

    roles.value = roleRows.map(mapApiRole)
    users.value = userPage.row.map(mapApiUser)

    if (users.value.length > 0) {
      selectedUserId.value = users.value[0].id
      selectedRoleKey.value = users.value[0].roleKey
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '读取用户接口失败',
      icon: 'none',
    })
  } finally {
    isLoading.value = false
  }
}

function mapApiRole(role: MesRole): Role {
  const pagePermissions = role.permissions
    .filter((permission) => permission.type === 'page' && permission.module !== 'workbench')
    .map((permission) => permission.name)
    .join('、')
  const actionPermissions = role.permissions
    .filter((permission) => permission.type === 'action')
    .map((permission) => permission.name)
    .join('、')

  return {
    desc: role.description || role.name,
    key: role.code as RoleKey,
    name: role.name,
    permissions: [
      { label: '可访问页面', value: pagePermissions || '-' },
      { label: '可执行操作', value: actionPermissions || '-' },
      { label: '适用人员', value: role.description || role.name },
    ],
  }
}

function mapApiUser(user: MesUser): UserItem {
  const role = user.roles[0]
  const roleKey = (role?.code || 'leader') as RoleKey

  return {
    account: user.account || user.username,
    id: String(user.id),
    initial: user.realName.slice(0, 1) || '用',
    lastLogin: formatLastLogin(user.lastLoginAt),
    name: user.realName,
    roleKey,
    roleName: role?.name || getRoleName(roleKey),
    tone: getRoleTone(roleKey),
  }
}

function formatLastLogin(value: string | null) {
  if (!value) return '未登录'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未登录'

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function selectUser(userId: string) {
  selectedUserId.value = userId
  selectedRoleKey.value = selectedUser.value.roleKey
}

async function saveRole() {
  if (!canManageAccess.value) {
    uni.showToast({ title: '当前角色不能分配角色', icon: 'none' })
    return
  }

  if (isSavingRole.value) return

  isSavingRole.value = true
  try {
    const updated = await assignMesUserRole(selectedUser.value.id, selectedRoleKey.value)
    const mapped = mapApiUser(updated)
    const index = users.value.findIndex((user) => user.id === mapped.id)
    if (index >= 0) {
      users.value.splice(index, 1, mapped)
    }
    selectedUserId.value = mapped.id
    selectedRoleKey.value = mapped.roleKey
    uni.showToast({ title: `已为 ${mapped.name} 分配${mapped.roleName}`, icon: 'none' })
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '保存角色失败',
      icon: 'none',
    })
  } finally {
    isSavingRole.value = false
  }
}

function createAccount() {
  if (!canManageAccess.value) {
    uni.showToast({ title: '当前角色不能新增账号', icon: 'none' })
    return
  }

  showCreateDialog.value = true
}

function closeCreateDialog() {
  showCreateDialog.value = false
}

function getRoleName(roleKey: RoleKey) {
  return roles.value.find((role) => role.key === roleKey)?.name || '班组长'
}

function getRoleTone(roleKey: RoleKey): Tone {
  const toneMap: Record<RoleKey, Tone> = {
    admin: 'info',
    leader: 'warning',
    qc: 'success',
    viewer: 'success',
  }

  return toneMap[roleKey]
}

async function saveNewAccount() {
  if (!canManageAccess.value) {
    uni.showToast({ title: '当前角色不能新增账号', icon: 'none' })
    return
  }

  const name = newAccount.value.name.trim()
  const account = newAccount.value.account.trim()
  const password = newAccount.value.password
  const confirmPassword = newAccount.value.confirmPassword

  if (!name || !account) {
    uni.showToast({ title: '请输入姓名和账号', icon: 'none' })
    return
  }

  if (!password || !confirmPassword) {
    uni.showToast({ title: '请输入初始密码', icon: 'none' })
    return
  }

  if (password !== confirmPassword) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return
  }

  if (isSavingAccount.value) return

  isSavingAccount.value = true
  try {
    const created = await createMesUser({
      account,
      name,
      password,
      roleCode: newAccount.value.roleKey,
    })
    const user = mapApiUser(created)
    users.value.unshift(user)
    selectedUserId.value = user.id
    selectedRoleKey.value = user.roleKey
    newAccount.value = { name: '', account: '', password: '', confirmPassword: '', roleKey: 'leader' }
    showCreateDialog.value = false
    uni.showToast({ title: '账号已新增', icon: 'none' })
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '新增账号失败',
      icon: 'none',
    })
  } finally {
    isSavingAccount.value = false
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

.logout-button {
  height: 48rpx;
  min-width: 96rpx;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c23b3b;
  background: #fde9e9;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1;
}

.logout-button::after {
  border: 0;
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
.user-card,
.user-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.header-actions {
  align-items: center;
  flex-shrink: 0;
}

.user-main {
  justify-content: flex-start;
  min-width: 0;
}

.eyebrow,
.desc,
.section-desc,
.metric-note,
.role-desc,
.last-login,
.permission-value {
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

.primary-button,
.secondary-button,
uni-button.primary-button,
uni-button.secondary-button {
  margin: 0;
  height: 64rpx;
  min-width: 144rpx;
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
.secondary-button::after,
uni-button.primary-button::after,
uni-button.secondary-button::after {
  border: 0;
}

.primary-button {
  border: 1rpx solid #246bfe;
  color: #ffffff;
  background: #246bfe;
}

.secondary-button {
  border: 1rpx solid #d8dee8;
  color: #243040;
  background: #ffffff;
}

.save-button {
  width: 100%;
  margin-top: 18rpx;
}

.button-hover {
  opacity: 0.78;
}

.metrics {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18rpx;
}

.metric-card,
.panel,
.user-card,
.role-card,
.permission-row {
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
  grid-template-columns: minmax(0, 1.05fr) minmax(360rpx, 0.75fr);
  gap: 22rpx;
}

.right-stack,
.user-list,
.permission-list {
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

.user-list,
.permission-list,
.role-grid {
  margin-top: 18rpx;
}

.user-card {
  min-height: 96rpx;
  padding: 18rpx;
  align-items: center;
  background: #ffffff;
}

.user-card.selected {
  border-color: #246bfe;
  box-shadow: 0 0 0 2rpx rgba(36, 107, 254, 0.12);
}

.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: #246bfe;
  font-size: 24rpx;
  font-weight: 850;
  flex-shrink: 0;
}

.user-name,
.role-name,
.permission-label {
  display: block;
  color: #1b2430;
  font-size: 26rpx;
  font-weight: 850;
  line-height: 1.25;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.role-card {
  min-height: 104rpx;
  padding: 18rpx;
  background: #f8fafc;
}

.role-card.active {
  border-color: #246bfe;
  background: #e8f0ff;
}

.role-desc {
  margin-top: 12rpx;
}

.permission-row {
  padding: 18rpx;
  background: #f8fafc;
}

.permission-value {
  margin-top: 6rpx;
}

.modal-mask {
  position: fixed;
  inset: 0;
  padding: 32rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 32, 51, 0.48);
  z-index: 30;
}

.modal-card {
  width: 100%;
  max-width: 620rpx;
  max-height: calc(100vh - 64rpx);
  padding: 26rpx;
  border-radius: 18rpx;
  box-sizing: border-box;
  overflow-y: auto;
  background: #ffffff;
}

.modal-head,
.modal-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.modal-title {
  display: block;
  color: #1b2430;
  font-size: 34rpx;
  font-weight: 850;
  line-height: 1.2;
}

.close-button {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #647184;
  background: #f3f6fb;
  font-size: 34rpx;
  line-height: 1;
  flex-shrink: 0;
}

.form-list {
  margin-top: 22rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.field-label {
  display: block;
  margin-bottom: 14rpx;
  color: #243040;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}

.field-input {
  height: 72rpx;
  padding: 0 18rpx;
  border: 1rpx solid #d8dee8;
  border-radius: 14rpx;
  box-sizing: border-box;
  color: #1b2430;
  background: #f8fafc;
  font-size: 26rpx;
  line-height: 72rpx;
}

.placeholder {
  color: #9aa6b6;
}

.dialog-role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.dialog-role {
  min-height: 64rpx;
  border: 1rpx solid #d8dee8;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #243040;
  background: #f8fafc;
  font-size: 24rpx;
  font-weight: 800;
}

.dialog-role.active {
  border-color: #246bfe;
  color: #246bfe;
  background: #e8f0ff;
}

.modal-actions {
  margin-top: 24rpx;
  align-items: center;
}

.modal-actions .primary-button,
.modal-actions .secondary-button {
  flex: 1;
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

  .primary-button,
  .secondary-button,
  uni-button.primary-button,
  uni-button.secondary-button {
    width: 100%;
    min-width: 0;
    margin-top: 18rpx;
  }

  .header-actions {
    margin-top: 18rpx;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 96rpx;
  }

  .header-actions .primary-button,
  .header-actions .logout-button {
    width: 100%;
    margin-top: 0;
  }

  .title {
    font-size: 40rpx;
  }

  .metrics,
  .role-grid {
    grid-template-columns: 1fr;
  }

  .user-card {
    display: block;
  }

  .user-meta {
    margin-top: 14rpx;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .modal-mask {
    align-items: flex-end;
    padding: 24rpx;
    padding-bottom: 136rpx;
  }

  .modal-card {
    max-height: calc(100vh - 184rpx);
    padding: 24rpx;
  }

  .modal-actions .primary-button,
  .modal-actions .secondary-button {
    margin-top: 0;
  }
}

/* #ifdef MP */
.workspace {
  padding-top: calc(28rpx + var(--status-bar-height) + 88rpx);
}
/* #endif */
</style>
