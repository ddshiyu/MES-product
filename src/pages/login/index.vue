<template>
  <view class="page">
    <view class="login-card">
      <text class="brand">MES</text>
      <text class="title">登录</text>

      <view class="field-list">
        <view class="field">
          <text class="field-label">账号</text>
          <input
            class="field-input"
            :value="account"
            placeholder="请输入账号"
            placeholder-class="placeholder"
            @input="account = String($event.detail.value)"
          />
        </view>

        <view class="field">
          <text class="field-label">密码</text>
          <input
            class="field-input"
            :value="password"
            password
            placeholder="请输入密码"
            placeholder-class="placeholder"
            @input="password = String($event.detail.value)"
          />
        </view>
      </view>

      <button class="primary-button" hover-class="button-hover" @tap="login">
        {{ isSubmitting ? '登录中' : '登录' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { useAuthStore } from '@/stores/auth'

const account = ref('')
const password = ref('')
const isSubmitting = ref(false)
const authStore = useAuthStore()

async function login() {
  if (!account.value || !password.value) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' })
    return
  }

  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    await authStore.login(account.value.trim(), password.value)
    uni.reLaunch({ url: '/pages/stats/index' })
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '登录失败',
      icon: 'none',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
page {
  background: #eef2f7;
}

.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2f7;
  color: #1b2430;
}

.login-card {
  width: 100%;
  max-width: 520rpx;
  padding: 40rpx;
  border: 1rpx solid #d8dee8;
  border-radius: 18rpx;
  box-sizing: border-box;
  background: #ffffff;
}

.brand {
  width: 88rpx;
  height: 64rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: #142033;
  font-size: 26rpx;
  font-weight: 850;
}

.title {
  display: block;
  margin-top: 34rpx;
  color: #1b2430;
  font-size: 44rpx;
  font-weight: 850;
  line-height: 1.28;
}

.field-list {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 26rpx;
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

.primary-button,
uni-button.primary-button {
  width: 100%;
  height: 72rpx;
  margin: 32rpx 0 0;
  border: 1rpx solid #246bfe;
  border-radius: 14rpx;
  color: #ffffff;
  background: #246bfe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 850;
  line-height: 1;
}

.button-hover {
  opacity: 0.78;
}

@media screen and (max-width: 700px) {
  .page {
    padding: 24rpx;
    align-items: flex-start;
    padding-top: 160rpx;
  }

  .login-card {
    max-width: none;
    padding: 32rpx;
  }
}
</style>
