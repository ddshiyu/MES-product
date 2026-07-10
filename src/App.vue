<script lang="ts">
import { defineComponent } from 'vue'
import { useAppStore } from '@/stores/app'

export default defineComponent({
	onLaunch: function() {
		useAppStore().initSystemInfo()
		console.log('App Launch')
	},
	onShow: function() {
		console.log('App Show')
	},
	onHide: function() {
		console.log('App Hide')
	},
})
</script>

<style>
	/* 每个页面公共css */
	button,
	uni-button {
		appearance: none;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		padding: 0;
		overflow: hidden;
		font-family: inherit;
		line-height: 1;
		text-align: center;
		vertical-align: middle;
		white-space: nowrap;
	}

	button::after,
	uni-button::after {
		border: 0;
	}

	.logout-button,
	uni-button.logout-button {
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
		white-space: nowrap;
	}

	.logout-button::after,
	uni-button.logout-button::after {
		border: 0;
	}
</style>
