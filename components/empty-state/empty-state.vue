<template>
	<view class="empty-state">
		<view class="empty-state__icon"></view>
		<view class="empty-state__title">{{ title }}</view>
		<view v-if="description" class="empty-state__desc">{{ description }}</view>
	</view>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		default: '暂无数据'
	},
	description: {
		type: String,
		default: ''
	}
})
</script>

<style>
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 64rpx 32rpx;
	text-align: center;
	color: #667085;
}

.empty-state__icon {
	width: 88rpx;
	height: 88rpx;
	border-radius: 44rpx;
	background: linear-gradient(135deg, #e0f2fe, #ecfdf3);
	position: relative;
}

.empty-state__icon::after {
	content: '';
	position: absolute;
	left: 28rpx;
	top: 28rpx;
	width: 32rpx;
	height: 32rpx;
	border-radius: 16rpx;
	background: #ffffff;
}

.empty-state__title {
	margin-top: 20rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: #344054;
}

.empty-state__desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #98a2b3;
	word-break: break-word;
}
</style>
