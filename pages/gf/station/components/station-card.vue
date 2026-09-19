<template>
	<view class="station-card">
		<view class="station-card__image-wrap">
			<image
				v-if="是否显示图片"
				class="station-card__image"
				:src="station.图片地址"
				mode="aspectFill"
				@load="标记图片成功"
				@error="标记图片失败"
			/>
			<view v-else class="station-card__image-empty">暂无图片</view>
		</view>

		<view class="station-card__content">
			<view class="station-card__head">
				<view class="station-card__title">{{ station.电站名称 }}</view>
				<view class="station-card__tags">
					<StatusTag v-if="station.通讯状态" :status="station.通讯状态" />
					<StatusTag v-if="station.报警状态" :status="station.报警状态" />
				</view>
			</view>

			<view v-if="station.报警内容" class="station-card__alarm">{{ station.报警内容 }}</view>

			<view class="station-card__body">
				<view class="station-card__metric">
					<text class="station-card__metric-value">装机容量</text>
					<text class="station-card__metric-unit">{{ station.装机容量 }}kWp</text>
				</view>
				<view class="station-card__metric">
					<text class="station-card__metric-value">发电功率</text>
					<text class="station-card__metric-unit">{{ station.发电功率 }}kW</text>
				</view>
				<view class="station-card__metric">
					<text class="station-card__metric-value">当日发电量</text>
					<text class="station-card__metric-unit">{{ station.日发电量 }}kWh</text>
				</view>
				<view class="station-card__metric">
					<text class="station-card__metric-value">当日发电小时数</text>
					<text class="station-card__metric-unit">{{ station.满发小时数文本 }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import StatusTag from '@/components/status-tag/status-tag.vue'

const props = defineProps({
	station: {
		type: Object,
		default: function 默认电站数据() {
			return {}
		}
	}
})

// 记录失败的具体地址，无需为列表中的每张卡片创建图片地址监听。
// 地址更新后会与失败地址不同，图片可自动重新加载。
const 图片加载失败地址 = ref('')
const 是否显示图片 = computed(() => Boolean(
	props.station.图片地址 && props.station.图片地址 !== 图片加载失败地址.value
))

function 标记图片失败() {
	// 真实图片地址失效时保留图片区域，避免列表卡片高度跳变。
	图片加载失败地址.value = props.station.图片地址 || ''
}

function 标记图片成功() {
	// 新地址加载成功后清除历史失败记录，后续切回旧地址时仍允许重新请求。
	图片加载失败地址.value = ''
}
</script>

<style>
.station-card {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding: 18rpx;
	overflow: hidden;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.station-card__image-wrap {
	position: relative;
	width: 272rpx;
	height: 204rpx;
	flex-shrink: 0;
	border-radius: 12rpx;
	background: #eef4fb;
	overflow: hidden;
}

.station-card__image {
	width: 100%;
	height: 204rpx;
	display: block;
	object-fit: cover;
	object-position: center;
}

.station-card__image-empty {
	height: 204rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	font-weight: 700;
	color: #98a2b3;
	background: linear-gradient(135deg, #eef6ff, #f8fbff);
}

.station-card__content {
	flex: 1;
	min-width: 0;
	padding: 0;
}

.station-card__head {
	display: flex;
	align-items: flex-start;
	justify-content: flex-start;
	gap: 16rpx;
}

.station-card__title {
	flex: 1;
	min-width: 0;
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.4;
	color: #101828;
	word-break: break-word;
}

.station-card__tags {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	flex-shrink: 0;
	gap: 10rpx;
}

.station-card__alarm {
	margin-top: 16rpx;
	padding: 14rpx 16rpx;
	border-radius: 12rpx;
	background: #fff7ed;
	font-size: 24rpx;
	font-weight: 600;
	line-height: 1.5;
	color: #b54708;
	word-break: break-word;
}

.station-card__body {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 28rpx;
	row-gap: 20rpx;
	margin-top: 22rpx;
}

.station-card__metric {
	min-width: 0;
	padding: 0;
	border-radius: 0;
	background: transparent;
	border: 0;
}

.station-card__metric--wide {
	grid-column: span 2;
}

.station-card__metric-value {
	display: block;
	font-size: 22rpx;
	color: #667085;
}

.station-card__metric-unit {
	display: block;
	margin-top: 8rpx;
	margin-left: 0;
	font-size: 26rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-all;
}
</style>
