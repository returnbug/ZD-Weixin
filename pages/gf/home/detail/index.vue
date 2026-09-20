<template>
	<view class="page">
		<view class="station-header">
			<view>
				<view class="station-header__title">{{ 看板数据.名称 }}</view>
				<view class="station-header__desc">消纳率、用能来源与节能减排概览</view>
			</view>
			<button class="station-header__button" @click="查看设备">设备</button>
		</view>

		<view class="time-tabs">
			<view
				v-for="dimension in 看板数据.时间维度"
				:key="dimension"
				class="time-tabs__item"
				:class="{ 'time-tabs__item--active': 当前维度 === dimension }"
				@click="切换时间维度(dimension)"
			>
				{{ dimension }}
			</view>
		</view>

		<view class="metric-grid">
			<DataCard
				v-for="metric in 看板数据.核心指标"
				:key="metric.标题"
				:title="metric.标题"
				:value="metric.数值"
				:unit="metric.单位"
			/>
		</view>

		<view class="analysis-panel">
			<view class="panel-title">消纳率分析</view>
			<view class="ratio-row">
				<view v-for="item in 看板数据.消纳分析" :key="item.名称" class="ratio-card">
					<view class="ratio-card__name">{{ item.名称 }}</view>
					<view class="ratio-card__value">{{ item.数值 }}</view>
					<view class="ratio-card__bar">
						<view class="ratio-card__bar-fill" :style="{ width: item.占比 }"></view>
					</view>
					<view class="ratio-card__percent">{{ item.占比 }}</view>
				</view>
			</view>
		</view>

		<view class="analysis-panel">
			<view class="panel-title">用户用能情况</view>
			<view class="ratio-row">
				<view v-for="item in 看板数据.用能分析" :key="item.名称" class="ratio-card">
					<view class="ratio-card__name">{{ item.名称 }}</view>
					<view class="ratio-card__value">{{ item.数值 }}</view>
					<view class="ratio-card__bar">
						<view class="ratio-card__bar-fill ratio-card__bar-fill--green" :style="{ width: item.占比 }"></view>
					</view>
					<view class="ratio-card__percent">{{ item.占比 }}</view>
				</view>
			</view>
		</view>

		<view class="analysis-panel">
			<view class="panel-title">节能减排</view>
			<view class="saving-list">
				<view v-for="item in 看板数据.节能减排" :key="item.名称" class="saving-item">
					<text>{{ item.名称 }}</text>
					<text>{{ item.数值 }} {{ item.单位 }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import DataCard from '@/components/data-card/data-card.vue'
import { 电站看板 } from '@/config/page-data.js'
import { 切换标签页 } from '@/utils/navigation.js'

const 看板数据 = ref({
	名称: '',
	时间维度: [],
	核心指标: [],
	消纳分析: [],
	用能分析: [],
	节能减排: []
})
const 当前维度 = ref('日')

function 初始化页面() {
	看板数据.value = 电站看板
}

function 切换时间维度(维度) {
	当前维度.value = 维度
}

function 查看设备() {
	切换标签页('/pages/gf/station/index/index')
}

onLoad(() => {
	初始化页面()
})
</script>

<style>
.page {
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	min-height: 100vh;
	padding: 24rpx;
	padding-bottom: 48rpx;
	padding-bottom: calc(48rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
	background: #f5f7fa;
}

.station-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding: 30rpx;
	border-radius: 18rpx;
	background: linear-gradient(135deg, #eff8ff, #ecfdf3);
}

.station-header > view:first-child {
	min-width: 0;
}

.station-header__title {
	font-size: 36rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.station-header__desc {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.station-header__button {
	flex-shrink: 0;
	height: 64rpx;
	padding: 0 24rpx;
	border-radius: 12rpx;
	background: #1677ff;
	font-size: 26rpx;
	font-weight: 700;
	color: #ffffff;
}

.time-tabs {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 24rpx;
	padding: 8rpx;
	border-radius: 16rpx;
	background: #ffffff;
}

.time-tabs__item {
	height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	font-size: 26rpx;
	font-weight: 700;
	color: #667085;
}

.time-tabs__item--active {
	background: #1677ff;
	color: #ffffff;
}

.metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
}

.analysis-panel {
	margin-top: 24rpx;
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
	word-break: break-word;
}

.ratio-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 20rpx;
}

.ratio-card {
	min-width: 0;
	padding: 22rpx;
	border-radius: 16rpx;
	background: #f9fafb;
}

.ratio-card__name {
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.ratio-card__value {
	margin-top: 10rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-all;
}

.ratio-card__bar {
	height: 12rpx;
	margin-top: 18rpx;
	border-radius: 999rpx;
	background: #e4e7ec;
	overflow: hidden;
}

.ratio-card__bar-fill {
	height: 12rpx;
	border-radius: 999rpx;
	background: #1677ff;
}

.ratio-card__bar-fill--green {
	background: #12b76a;
}

.ratio-card__percent {
	margin-top: 10rpx;
	font-size: 22rpx;
	font-weight: 700;
	color: #667085;
}

.saving-list {
	margin-top: 18rpx;
}

.saving-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #edf2f7;
	font-size: 26rpx;
	color: #344054;
}

.saving-item:last-child {
	border-bottom: 0;
}

.saving-item text:first-child {
	min-width: 0;
	word-break: break-word;
}

.saving-item text:last-child {
	min-width: 0;
	text-align: right;
	word-break: break-all;
}
</style>
