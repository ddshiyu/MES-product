import { defineStore } from 'pinia'

import {
  clearMesSession,
  getMesProfile,
  getMesToken,
  getStoredMesUser,
  mesLogin,
  setMesSession,
  type MesPermission,
  type MesRole,
  type MesUser,
} from '@/api/mes'

interface AuthState {
  token: string
  userInfo: MesUser | null
}

export const useAuthStore = defineStore('auth', {
  actions: {
    async loadProfile() {
      if (!this.token) return null

      const profile = await getMesProfile()
      this.userInfo = profile
      return profile
    },
    async login(username: string, password: string) {
      const session = await mesLogin(username, password)
      setMesSession(session)
      this.token = session.accessToken || session.token
      this.userInfo = session.userInfo
      return session
    },
    logout() {
      clearMesSession()
      this.token = ''
      this.userInfo = null
    },
    restoreSession() {
      this.token = getMesToken()
      this.userInfo = getStoredMesUser()
    },
  },
  getters: {
    can: (state) => (permissionCode: string): boolean => {
      return Boolean(state.userInfo?.roles.some((role) => (
        role.permissions.some((permission) => permission.code === permissionCode)
      )))
    },
    canAccessPage: (state) => (pageKey: string): boolean => {
      return Boolean(state.userInfo?.roles.some((role) => (
        role.permissions.some((permission) => (
          permission.type === 'page' && permission.module === pageKey
        ))
      )))
    },
    isLoggedIn: (state) => Boolean(state.token),
    permissionCodes: (state): string[] => {
      const codes = new Set<string>()
      state.userInfo?.roles.forEach((role) => {
        role.permissions.forEach((permission) => {
          codes.add(permission.code)
        })
      })
      return Array.from(codes)
    },
    permissions: (state): MesPermission[] => {
      const permissionMap = new Map<string, MesPermission>()
      state.userInfo?.roles.forEach((role) => {
        role.permissions.forEach((permission) => {
          permissionMap.set(permission.code, permission)
        })
      })
      return Array.from(permissionMap.values())
    },
    roleCodes: (state): string[] => state.userInfo?.roles.map((role: MesRole) => role.code) || [],
    roleName: (state): string => state.userInfo?.roles[0]?.name || '未登录',
  },
  state: (): AuthState => ({
    token: getMesToken(),
    userInfo: getStoredMesUser(),
  }),
})
