<template>
	<view class="data-card" :class="type ? 'data-card--' + type : ''">
		<view class="data-card__label">{{ title }}</view>
		<view class="data-card__value">
			<text class="data-card__value-text">{{ value }}</text>
			<text v-if="unit" class="data-card__unit">{{ unit }}</text>
		</view>
		<view v-if="description" class="data-card__desc">{{ description }}</view>
	</view>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		default: ''
	},
	value: {
		type: [String, Number],
		default: ''
	},
	unit: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		default: ''
	},
	type: {
		type: String,
		default: ''
	}
})
</script>

<style>
.data-card {
	/* 不依赖页面标签选择器，保证小程序组件的内边距包含在卡片宽度内。 */
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	padding: 24rpx;
	border-radius: 16rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
	border: 1rpx solid #edf2f7;
}

.data-card__label {
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.data-card__value {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 6rpx;
	min-width: 0;
	margin-top: 12rpx;
	font-size: 42rpx;
	font-weight: 700;
	line-height: 1.2;
	color: #1d2939;
	word-break: break-all;
}

.data-card__unit {
	font-size: 22rpx;
	font-weight: 500;
	color: #667085;
}

.data-card__value-text {
	min-width: 0;
	max-width: 100%;
	word-break: break-all;
}

.data-card__desc {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #98a2b3;
	word-break: break-word;
}

.data-card--primary {
	border-color: #b7dbff;
	background: #f4fbff;
}

.data-card--success {
	border-color: #b9edce;
	background: #f3fcf7;
}

.data-card--warning {
	border-color: #ffd45c;
	background: #fff9e6;
}

.data-card--danger {
	border-color: #ffb4b4;
	background: #fff7f7;
}

.data-card--muted {
	border-color: #edf1f5;
	background: #fbfcfe;
}

.data-card--primary .data-card__label,
.data-card--primary .data-card__unit {
	color: #38679d;
}

.data-card--success .data-card__label,
.data-card--success .data-card__unit {
	color: #367a57;
}

.data-card--warning .data-card__label,
.data-card--warning .data-card__unit {
	color: #8f6810;
}

.data-card--danger .data-card__label,
.data-card--danger .data-card__unit {
	color: #b42318;
}
</style>
