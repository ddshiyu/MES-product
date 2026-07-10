import { defineStore } from 'pinia'

export type OrderTabKey = 'all' | 'pendingLoad' | 'pendingInspection' | 'exception' | 'done'

export interface ScannedMaterialState {
  coilCode: string
  material: string
  thickness: number
  weight: number
  width: number
}

interface OrderState {
  currentTab: OrderTabKey
  searchKeyword: string
  selectedOrderNo: string
  selectedOrderStatus: OrderTabKey | ''
  scannedMaterials: Record<string, ScannedMaterialState>
}

export const useOrderStore = defineStore('order', {
  actions: {
    clearSelection() {
      this.selectedOrderNo = ''
      this.selectedOrderStatus = ''
    },
    saveScan(orderNo: string, material: ScannedMaterialState) {
      this.scannedMaterials = {
        ...this.scannedMaterials,
        [orderNo]: material,
      }
    },
    setCurrentTab(tab: OrderTabKey) {
      this.currentTab = tab
    },
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
    },
    setSelectedOrder(orderNo: string, status: OrderTabKey | '') {
      this.selectedOrderNo = orderNo
      this.selectedOrderStatus = status
    },
  },
  getters: {
    latestScan: (state) => state.selectedOrderNo ? state.scannedMaterials[state.selectedOrderNo] : undefined,
    selectedPendingInspectionOrderNo: (state) => (
      state.selectedOrderStatus === 'pendingInspection' ? state.selectedOrderNo : ''
    ),
  },
  state: (): OrderState => ({
    currentTab: 'all',
    scannedMaterials: {},
    searchKeyword: '',
    selectedOrderNo: '',
    selectedOrderStatus: '',
  }),
})
