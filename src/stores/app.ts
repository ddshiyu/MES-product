import { defineStore } from 'pinia'

type DeviceType = 'desktop' | 'mobile' | 'tablet'
type NavKey = 'access' | 'inspection' | 'orders' | 'stats'

interface AppState {
  activeNav: NavKey
  deviceType: DeviceType
  safeAreaBottom: number
  safeAreaTop: number
  windowHeight: number
  windowWidth: number
}

export const useAppStore = defineStore('app', {
  actions: {
    initSystemInfo() {
      const info = uni.getSystemInfoSync()
      const width = info.windowWidth || 0
      const safeArea = info.safeArea

      this.windowWidth = width
      this.windowHeight = info.windowHeight || 0
      this.safeAreaTop = safeArea?.top || info.statusBarHeight || 0
      this.safeAreaBottom = safeArea ? Math.max(0, (info.screenHeight || 0) - safeArea.bottom) : 0

      if (width >= 900) {
        this.deviceType = 'desktop'
      } else if (width >= 700) {
        this.deviceType = 'tablet'
      } else {
        this.deviceType = 'mobile'
      }
    },
    setActiveNav(nav: NavKey) {
      this.activeNav = nav
    },
  },
  getters: {
    isMobile: (state) => state.deviceType === 'mobile',
    isTabletOrDesktop: (state) => state.deviceType === 'tablet' || state.deviceType === 'desktop',
  },
  state: (): AppState => ({
    activeNav: 'stats',
    deviceType: 'desktop',
    safeAreaBottom: 0,
    safeAreaTop: 0,
    windowHeight: 0,
    windowWidth: 0,
  }),
})
