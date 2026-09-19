<template>
	<view class="page">
		<view class="alarm-header">
			<view class="alarm-header__title">{{ 报警信息.标题 }}</view>
			<StatusTag :status="报警信息.状态" />
		</view>

		<view class="section">
			<view class="section__title">报警详情</view>
			<view class="detail-list">
				<view v-for="item in 详情字段" :key="item.名称" class="detail-item">
					<text>{{ item.名称 }}</text>
					<text>{{ item.值 || '--' }}</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section__title">处理说明</view>
			<view class="alarm-desc">{{ 报警信息.说明 }}</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import StatusTag from '@/components/status-tag/status-tag.vue'
import { 报警接口 } from '@/api/index.js'

const 报警编号 = ref('')
const 报警信息 = ref({})

const 详情字段 = computed(() => [
	{ 名称: '电站名称', 值: 报警信息.value.电站名称 },
	{ 名称: '设备类型', 值: 报警信息.value.设备类型 },
	{ 名称: '设备名称', 值: 报警信息.value.设备名称 },
	{ 名称: '模板名称', 值: 报警信息.value.模板名称 },
	{ 名称: '数据名称', 值: 报警信息.value.数据名称 },
	{ 名称: '报警类型', 值: 报警信息.value.级别 },
	{ 名称: '发生时间', 值: 报警信息.value.发生时间 },
	{ 名称: '恢复时间', 值: 报警信息.value.恢复时间 }
])

function 初始化页面(参数 = {}) {
	报警编号.value = 参数.报警编号 || ''
	const 缓存报警信息 = 报警接口.读取报警详情缓存(报警编号.value)
	const 是否存在缓存 = 缓存报警信息 && typeof 缓存报警信息 === 'object' && !Array.isArray(缓存报警信息) && Object.keys(缓存报警信息).length

	// 新能源报警没有单独详情接口，详情页直接展示列表点击时缓存的真实返回行。
	报警信息.value = 是否存在缓存 ? 缓存报警信息 : {
		id: 报警编号.value,
		标题: '报警信息',
		状态: '',
		说明: '--'
	}
}

onLoad((参数) => {
	初始化页面(参数)
})
</script>

<style>
.page {
	min-height: 100vh;
	padding: 24rpx;
	padding-bottom: 48rpx;
	background: #f5f7fa;
}

.alarm-header,
.section {
	padding: 28rpx;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.alarm-header {
	background: linear-gradient(135deg, #fff7ed, #ffffff);
}

.alarm-header__title {
	margin-bottom: 12rpx;
	font-size: 36rpx;
	font-weight: 800;
	line-height: 1.4;
	color: #101828;
	word-break: break-word;
}

.section {
	margin-top: 24rpx;
}

.section__title {
	font-size: 32rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.detail-list {
	margin-top: 18rpx;
}

.detail-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #edf2f7;
	font-size: 26rpx;
	color: #344054;
}

.detail-item:last-child {
	border-bottom: 0;
}

.detail-item text:first-child {
	flex-shrink: 0;
	color: #667085;
}

.detail-item text:last-child {
	min-width: 0;
	text-align: right;
	font-weight: 700;
	word-break: break-all;
}

.alarm-desc {
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.7;
	color: #475467;
	word-break: break-word;
}
</style>
