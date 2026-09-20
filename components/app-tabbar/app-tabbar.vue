<template>
	<!-- 固定底栏不参与页面排版，同高占位让最后一项内容可以完整滚出底栏。 -->
	<view class="app-tabbar-space">
		<view class="app-tabbar">
			<view
				v-for="item in tabItems"
				:key="item.key"
				class="app-tabbar__item"
				:class="{ 'app-tabbar__item--active': current === item.key }"
				@click="switchTab(item)"
			>
				<uni-icons
					:type="current === item.key ? item.activeIcon : item.icon"
					:size="23"
					:color="current === item.key ? activeColor : normalColor"
				></uni-icons>
				<text class="app-tabbar__text">{{ item.text }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { 切换标签页 } from '@/utils/navigation.js'

const props = defineProps({
	current: {
		type: String,
		required: true
	}
})

const activeColor = '#1677ff'
const normalColor = '#667085'

const tabItems = [
	{
		key: 'home',
		text: '首页',
		icon: 'home',
		activeIcon: 'home-filled',
		path: '/pages/gf/home/index/index'
	},
	{
		key: 'station',
		text: '详情',
		icon: 'info',
		activeIcon: 'info-filled',
		path: '/pages/gf/station/index/index'
	},
	{
		key: 'alarm',
		text: '报警',
		icon: 'notification',
		activeIcon: 'notification-filled',
		path: '/pages/gf/alarm/index/index'
	},
	{
		key: 'mine',
		text: '我的',
		icon: 'person',
		activeIcon: 'person-filled',
		path: '/pages/gf/mine/index/index'
	}
]

function switchTab(item) {
	if (props.current === item.key) {
		return
	}

	切换标签页(item.path)
}

function hideNativeTabBar() {
	if (typeof uni === 'undefined' || !uni.hideTabBar) {
		return
	}

	uni.hideTabBar({
		animation: false,
		fail: () => {}
	})
}

onMounted(hideNativeTabBar)
onShow(hideNativeTabBar)
</script>

<style scoped>
.app-tabbar-space,
.app-tabbar {
	/* 组件内显式使用 border-box，安全区和内边距计入同一高度。 */
	box-sizing: border-box;
	height: 112rpx;
	height: calc(112rpx + constant(safe-area-inset-bottom));
	height: calc(112rpx + env(safe-area-inset-bottom));
}

.app-tabbar-space {
	width: 100%;
	flex-shrink: 0;
}

.app-tabbar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	display: flex;
	padding: 10rpx 18rpx;
	padding: 10rpx 18rpx calc(10rpx + constant(safe-area-inset-bottom));
	padding: 10rpx 18rpx calc(10rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	border-top: 1rpx solid #edf2f7;
	box-shadow: 0 -8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.app-tabbar__item {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #667085;
	font-size: 22rpx;
	font-weight: 400;
}

.app-tabbar__item--active {
	color: #1677ff;
}

.app-tabbar__text {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.2;
}
</style>
