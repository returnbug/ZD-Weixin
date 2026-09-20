<template>
	<view class="device-row">
		<view class="device-row__main">
			<view class="device-row__name">{{ device.名称 }}</view>
		</view>
		<view class="device-row__summary">
			<view class="device-row__meta">{{ device.模板类型 || '--' }}</view>
			<view class="device-row__status-list">
				<StatusTag :status="device.报警状态 || '--'" />
				<StatusTag :status="device.通讯状态 || '--'" />
			</view>
		</view>
	</view>
</template>

<script setup>
import StatusTag from '@/components/status-tag/status-tag.vue'

defineProps({
	device: {
		type: Object,
		default: function 默认设备数据() {
			return {}
		}
	}
})
</script>

<style>
.device-row {
	padding: 24rpx 0;
}

.device-row__main {
	flex: 1;
	min-width: 0;
}

.device-row__status-list {
	display: flex;
	flex-wrap: wrap;
	max-width: 100%;
	align-items: center;
	gap: 10rpx;
	flex-shrink: 0;
}

.device-row__summary {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 10rpx;
}

.device-row__name {
	font-size: 30rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.device-row__meta {
	min-width: 0;
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}
</style>
