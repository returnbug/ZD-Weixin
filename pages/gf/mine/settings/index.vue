<template>
	<view class="page" :style="{ background: 页面背景颜色 }">
		<view class="settings-panel">
			<view class="panel-title">账号设置</view>
			<view class="settings-list">
				<view v-for="item in 设置项" :key="item.名称" class="settings-item" @click="编辑设置项(item)">
					<view>
						<view class="settings-item__name">{{ item.名称 }}</view>
						<view class="settings-item__value">{{ item.值 }}</view>
					</view>
					<view class="settings-item__action">编辑</view>
				</view>
			</view>
		</view>

		<view class="settings-panel">
			<view class="panel-title">背景颜色</view>
			<view class="color-row">
				<view
					v-for="color in 颜色选项"
					:key="color.名称"
					class="color-item"
					:class="{ 'color-item--active': 当前颜色 === color.名称 }"
					@click="选择背景颜色(color)"
				>
					<view class="color-item__swatch" :style="{ background: color.值 }"></view>
					<text>{{ color.名称 }}</text>
				</view>
			</view>
		</view>

		<button class="save-button" @click="保存设置">保存设置</button>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { 设置项列表 } from '@/config/page-data.js'
import { 显示建设中提示 } from '@/utils/toast.js'

const 背景颜色缓存键 = '背景颜色设置'
const 设置项 = ref([])
const 颜色选项 = [
	{ 名称: '系统默认', 值: '#f5f7fa' },
	{ 名称: '清爽蓝', 值: '#eff8ff' },
	{ 名称: '能源绿', 值: '#ecfdf3' }
]
const 当前颜色 = ref('系统默认')
const 已保存颜色 = ref('系统默认')
const 页面背景颜色 = computed(() => 获取颜色值(已保存颜色.value))

function 初始化页面() {
	设置项.value = 设置项列表.filter((项) => !['语言', '背景颜色'].includes(项.名称))
	读取背景颜色设置()
}

function 编辑设置项(项) {
	显示建设中提示(`${项.名称}编辑待接入`)
}

function 选择背景颜色(颜色) {
	当前颜色.value = 颜色.名称
}

function 保存设置() {
	已保存颜色.value = 当前颜色.value
	uni.setStorageSync(背景颜色缓存键, 当前颜色.value)
	uni.showToast({
		title: '保存成功',
		icon: 'success'
	})
}

function 读取背景颜色设置() {
	const 缓存颜色 = uni.getStorageSync(背景颜色缓存键)
	const 可用颜色 = 颜色选项.some((颜色) => 颜色.名称 === 缓存颜色) ? 缓存颜色 : '系统默认'

	当前颜色.value = 可用颜色
	已保存颜色.value = 可用颜色
}

function 获取颜色值(颜色名称) {
	const 匹配颜色 = 颜色选项.find((颜色) => 颜色.名称 === 颜色名称)

	return 匹配颜色 ? 匹配颜色.值 : 颜色选项[0].值
}

onLoad(() => {
	初始化页面()
})
</script>

<style>
.page {
	min-height: 100vh;
	padding: 24rpx;
	padding-bottom: 48rpx;
	background: #f5f7fa;
}

.settings-panel {
	margin-bottom: 24rpx;
	padding: 28rpx;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.panel-title {
	font-size: 32rpx;
	font-weight: 800;
	color: #101828;
}

.settings-list {
	margin-top: 16rpx;
}

.settings-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid #edf2f7;
}

.settings-item:last-child {
	border-bottom: 0;
}

.settings-item > view:first-child {
	min-width: 0;
}

.settings-item__name {
	font-size: 28rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.settings-item__value {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.settings-item__action {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 700;
	color: #1677ff;
}

.color-row {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 22rpx;
}

.color-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 18rpx 10rpx;
	border-radius: 16rpx;
	border: 1rpx solid #edf2f7;
	background: #f9fafb;
	font-size: 22rpx;
	font-weight: 700;
	color: #667085;
	text-align: center;
	word-break: break-word;
}

.color-item--active {
	border-color: #1677ff;
	color: #1677ff;
	background: #eff8ff;
}

.color-item__swatch {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 10rpx;
	border-radius: 24rpx;
	border: 1rpx solid #d0d5dd;
}

.save-button {
	width: 100%;
	height: 82rpx;
	border-radius: 16rpx;
	background: #1677ff;
	font-size: 28rpx;
	font-weight: 800;
	color: #ffffff;
}
</style>
