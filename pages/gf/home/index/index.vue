<template>
	<view class="page home-page">
		<view class="station-section">
			<view class="home-section-title">电站概况</view>
			<view class="station-grid">
				<view v-for="item in 状态数据" :key="item.标题" class="station-item">
					<DataCard
						:class="{ 'summary-card--alarm': item.标题 === '有报警' }"
						:title="item.标题"
						:value="item.数值"
						:unit="item.单位"
						:type="item.类型"
					/>
				</view>
			</view>
		</view>

		<view class="power-section">
			<image class="power-section__background" src="/static/images/home-solar-blue.jpg" mode="aspectFill" />
			<view class="power-section__shade"></view>
			<view class="power-composition">
				<view class="power-reading">
					<view class="power-heading">
						<text class="power-heading__label">当前发电功率</text>
						<view class="power-heading__live">
							<view class="power-heading__live-dot"></view>
							<text>实时</text>
						</view>
					</view>
					<view class="power-reading__amount">
						<text class="power-reading__value">{{ 当前功率显示.数值 }}</text>
						<text v-if="当前功率显示.单位" class="power-reading__unit">{{ 当前功率显示.单位 }}</text>
					</view>
					<view class="power-capacity">
						<text class="power-capacity__label">总装机容量</text>
						<view class="power-capacity__amount">
							<text class="power-capacity__value">{{ 装机容量显示.数值 }}</text>
							<text v-if="装机容量显示.单位" class="power-capacity__unit">{{ 装机容量显示.单位 }}</text>
						</view>
					</view>
				</view>
				<view class="power-dial">
					<qiun-data-charts
						class="power-dial__canvas"
						type="arcbar"
						canvas-id="homePowerArc"
						background="rgba(0, 0, 0, 0)"
						:canvas2d="true"
						:animation="false"
						:opts="发电功率图表配置"
						:chartData="发电功率图表数据"
						:disable-scroll="false"
						:in-scroll-view="true"
						:page-scroll-top="页面滚动高度"
					/>
					<view class="power-dial__reading">
						<view class="power-dial__number">
							<text class="power-dial__value">{{ 发电功率占比数值 }}</text>
							<text class="power-dial__unit">%</text>
						</view>
						<text class="power-dial__label">功率占比</text>
					</view>
				</view>
			</view>
		</view>

		<view class="generation-section">
			<view class="generation-heading">
				<view class="home-section-title">发电量</view>
				<view class="period-tabs">
					<view
						v-for="dimension in 时间维度"
						:key="dimension"
						class="period-tabs__item"
						:class="{ 'period-tabs__item--active': 当前维度 === dimension }"
						@click="切换时间维度(dimension)"
					>
						{{ dimension }}
					</view>
				</view>
			</view>

			<!-- 横向滑动查看全部日期，同时保留点击提示和页面纵向滚动。 -->
			<view class="generation-chart">
				<qiun-data-charts
					class="generation-chart__canvas"
					type="column"
					canvas-id="homeTrendColumn"
					background="#F6FAFF"
					:canvas2d="true"
					:animation="false"
					:opts="发电趋势图表配置"
					:chartData="发电趋势图表数据"
					:disable-scroll="false"
					:in-scroll-view="true"
					:page-scroll-top="页面滚动高度"
					:ontouch="true"
					tooltip-format="homePowerTooltip"
				/>
			</view>
		</view>

		<view class="statistics-section">
			<view class="home-section-title">发电统计</view>
			<view class="statistics-grid">
				<view
					v-for="metric in 发电指标"
					:key="metric.标题"
					class="statistics-item"
					:class="{ 'statistics-item--total': metric.标题 === '累计发电量' }"
				>
					<DataCard
						:title="metric.标题"
						:value="metric.数值"
						:unit="metric.单位"
					/>
				</view>
			</view>
		</view>

		<AppTabbar current="home" />
	</view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad, onPageScroll, onUnload } from '@dcloudio/uni-app'
import AppTabbar from '@/components/app-tabbar/app-tabbar.vue'
import DataCard from '@/components/data-card/data-card.vue'
import { 首页接口 } from '@/api/index.js'
import {
	首页状态数据,
	首页能源概览,
	首页发电指标,
	首页发电曲线
} from '@/config/page-data.js'

const 日期类型映射 = {
	日: '月',
	月: '年',
	年: '总'
}

// qiun-data-charts 圆环图配置，尺寸由外层容器固定，避免撑高顶部卡片。
const 发电功率图表配置 = {
	// 复用图表更新，避免 Canvas 2D 初始化期间进入旧版 ctx.draw() 清理流程。
	update: true,
	color: ['#2DCAFF'],
	padding: [0, 0, 0, 0],
	animation: false,
	dataLabel: false,
	legend: {
		show: false
	},
	title: {
		name: ''
	},
	subtitle: {
		name: ''
	},
	extra: {
		arcbar: {
			type: 'circle',
			width: 9,
			backgroundColor: '#315A7C',
			lineCap: 'round',
			linearType: 'custom',
			customColor: ['#16BFF5'],
			startAngle: 1.5,
			endAngle: 0.25,
			gap: 2
		}
	}
}

const 状态数据 = ref([])
const 能源概览 = ref({})
// 仅拆分展示用的数值与单位，原始字段仍用于接口更新和功率占比计算。
const 当前功率显示 = computed(() => 拆分能源显示(能源概览.value.当前发电功率))
const 装机容量显示 = computed(() => 拆分能源显示(能源概览.value.总装机容量))
const 发电指标 = ref([])
const 发电曲线 = ref([])
const 页面滚动高度 = ref(0)
const 滚动同步间隔 = 40
const 时间维度 = ['日', '月', '年']
const 当前维度 = ref('日')
// 只应用最后一次大屏请求结果，避免快速切换维度时旧响应覆盖新图表。
let 页面有效 = true
let 大屏请求序号 = 0
let 发电曲线已响应更新 = false
let 待同步滚动高度 = 0
let 滚动同步定时器 = null
const 发电趋势每屏数量 = 8
const 发电趋势可滚动 = computed(() => 发电曲线.value.length > 发电趋势每屏数量)
// 每屏保留清晰的日期间距，其余日期通过横向滑动查看。
const 发电趋势图表配置 = computed(() => ({
	// 复用图表更新，避免 Canvas 2D 初始化期间进入旧版 ctx.draw() 清理流程。
	update: true,
	color: ['#2478F5'],
	padding: [16, 10, 14, 10],
	animation: false,
	enableScroll: 发电趋势可滚动.value,
	scrollPosition: 'left',
	dataLabel: false,
	dataPointShape: false,
	legend: {
		show: false
	},
	xAxis: {
		disableGrid: true,
		axisLine: true,
		axisLineColor: '#DFEAF8',
		itemCount: 发电趋势每屏数量,
		labelCount: 0,
		scrollShow: 发电趋势可滚动.value,
		scrollAlign: 'left',
		scrollColor: '#68ABFF',
		scrollBackgroundColor: '#E4EDF9',
		formatter: (项目) => 格式化趋势横轴标签(项目),
		fontColor: '#7D90AC',
		fontSize: 11,
		lineHeight: 28,
		marginTop: 6
	},
	yAxis: {
		disabled: true,
		disableGrid: true
	},
	extra: {
		tooltip: {
			legendShow: true,
		},
		column: {
			type: 'group',
			width: 18,
			linearType: 'custom',
			customColor: ['#72D4FF'],
			barBorderCircle: true,
			// 圆顶半径跟随实际柱宽，兼容不同像素密度的屏幕。
			categoryGap: 4
		}
	}
}))
const 发电功率占比数值 = computed(() => {
	const 总装机容量 = Number.parseFloat(能源概览.value.总装机容量)
	const 当前发电功率 = Number.parseFloat(能源概览.value.当前发电功率)

	if (!总装机容量 || Number.isNaN(当前发电功率)) {
		return 0
	}

	return Math.min(100, Math.max(0, Math.round((当前发电功率 / 总装机容量) * 100)))
})
const 发电功率图表数据 = computed(() => ({
	series: [
		{
			name: '当前发电完成比例',
			data: 发电功率占比数值.value / 100
		}
	]
}))
const 发电趋势图表数据 = computed(() => ({
	categories: 发电曲线.value.map((项目) => String(项目.时间)),
	series: [
		{
			name: '发电量',
			data: 发电曲线.value.map((项目) => 项目.数值),
			unit: 'kWh'
		}
	]
}))

function 拆分能源显示(值) {
	const 文本 = String(值 ?? '')
	const 匹配 = 文本.match(/^(.*?)([a-zA-Z]+)$/)

	return 匹配 ? { 数值: 匹配[1].trim(), 单位: 匹配[2] } : { 数值: 文本, 单位: '' }
}

function 当前大屏请求是否有效(请求序号) {
	return 页面有效 && 请求序号 === 大屏请求序号
}

function 格式化趋势横轴标签(时间) {
	// 横向滚动已经提供足够间距，不再省略任何日期标签。
	return String(时间)
}

function 初始化页面() {
	状态数据.value = 首页状态数据
	能源概览.value = 首页能源概览
	发电指标.value = 首页发电指标
}

async function 延后初始化发电曲线(请求序号) {
	await nextTick()

	// 核心数据完成首轮渲染后再提供趋势兜底，真实响应或旧请求均不能被覆盖。
	if (!当前大屏请求是否有效(请求序号) || 发电曲线已响应更新) {
		return
	}

	发电曲线.value = 首页发电曲线
}

async function 加载光伏大屏数据() {
	const 日期类型 = 日期类型映射[当前维度.value] || '月'
	const 当前请求序号 = 大屏请求序号 + 1

	大屏请求序号 = 当前请求序号
	延后初始化发电曲线(当前请求序号)

	try {
		const 大屏数据 = await 首页接口.获取光伏大屏数据({
			日期类型
		})

		if (!当前大屏请求是否有效(当前请求序号)) {
			return
		}

		// 字段转换仍由 API 层完成，页面只负责先更新核心信息。
		const 核心数据 = 首页接口.标准化首页大屏核心数据(大屏数据, {
			状态数据: 状态数据.value,
			能源概览: 能源概览.value,
			发电指标: 发电指标.value
		})

		状态数据.value = 核心数据.状态数据
		能源概览.value = 核心数据.能源概览
		发电指标.value = 核心数据.发电指标

		// 让核心指标先完成一次 Vue 渲染，再标准化并更新计算量更大的趋势图。
		await nextTick()

		if (!当前大屏请求是否有效(当前请求序号)) {
			return
		}

		发电曲线.value = 首页接口.标准化首页发电曲线(大屏数据, 发电曲线.value)
		发电曲线已响应更新 = true
	} catch (错误) {
		// 请求层已统一提示错误，首页保留初始化兜底数据。
	}
}

function 切换时间维度(维度) {
	if (当前维度.value === 维度) {
		return
	}

	当前维度.value = 维度
	加载光伏大屏数据()
}

onLoad(() => {
	页面有效 = true
	发电曲线已响应更新 = false
	初始化页面()
	加载光伏大屏数据()
})

onPageScroll((事件) => {
	待同步滚动高度 = 事件.scrollTop || 0

	if (滚动同步定时器 !== null) {
		return
	}

	// 滚动期间约每 40ms 向图表同步最后位置，减少高频响应式刷新且不丢失收尾坐标。
	滚动同步定时器 = setTimeout(() => {
		滚动同步定时器 = null

		if (页面有效) {
			页面滚动高度.value = 待同步滚动高度
		}
	}, 滚动同步间隔)
})

onUnload(() => {
	页面有效 = false
	大屏请求序号 += 1

	if (滚动同步定时器 !== null) {
		clearTimeout(滚动同步定时器)
		滚动同步定时器 = null
	}
})
</script>

<style>
/* 首页专用样式：白底蓝色信息层级，光伏实景作为功率卡片背景。 */
.page.home-page {
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	min-height: 100vh;
	min-height: 100dvh;
	padding: 32rpx 28rpx 24rpx;
	background: #ffffff;
	color: #18202d;
	font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', Helvetica, Arial, sans-serif;
	font-variant-numeric: tabular-nums;
}

.home-page .home-section-title {
	position: relative;
	padding-left: 24rpx;
	font-size: 32rpx;
	font-weight: 600;
	line-height: 44rpx;
	color: #18202d;
}

.home-page .home-section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 5rpx;
	width: 8rpx;
	height: 34rpx;
	border-radius: 4rpx;
	background: #1677ff;
}

/* 六项概况保持单行，以细分隔线和状态数字区分。 */
.home-page .station-section {
	padding-bottom: 38rpx;
}

.home-page .station-grid {
	display: grid;
	grid-template-columns: 1.12fr repeat(5, minmax(0, 1fr));
	margin-top: 34rpx;
}

.home-page .station-item {
	position: relative;
	min-width: 0;
	padding: 0 10rpx;
}

.home-page .station-item + .station-item::before {
	content: '';
	position: absolute;
	left: 0;
	top: 2rpx;
	bottom: 5rpx;
	width: 1rpx;
	background: #e5e8ee;
}

.home-page .station-item:first-child {
	padding-left: 12rpx;
}

.home-page .station-item:last-child {
	padding-right: 0;
}

.home-page .station-grid .data-card {
	box-sizing: border-box;
	min-width: 0;
	height: 100%;
	padding: 0;
	border: 0;
	border-radius: 0;
	background: transparent;
	box-shadow: none;
}

.home-page .station-grid .data-card__label {
	font-size: 20rpx;
	font-weight: 400;
	line-height: 30rpx;
	text-align: center;
	white-space: nowrap;
	color: #676e7d;
}

.home-page .station-grid .data-card__value {
	justify-content: center;
	align-items: baseline;
	gap: 6rpx;
	margin-top: 9rpx;
	font-size: 44rpx;
	font-weight: 600;
	line-height: 1.1;
	color: #1677ff;
}

.home-page .station-grid .data-card__unit {
	font-size: 22rpx;
	font-weight: 400;
	color: #18202d;
}

.home-page .station-item:first-child .data-card__label {
	font-size: 22rpx;
	text-align: left;
	color: #18202d;
}

.home-page .station-item:first-child .data-card__value {
	justify-content: flex-start;
	margin-top: 3rpx;
	font-size: 62rpx;
	line-height: 1;
	letter-spacing: -2rpx;
}

.home-page .station-item:first-child .data-card__unit {
	font-size: 26rpx;
	letter-spacing: 0;
}

.home-page .station-grid .data-card--muted .data-card__value {
	color: #858a96;
}

.home-page .station-grid .data-card--warning .data-card__value {
	color: #f39800;
}

.home-page .station-grid .data-card--danger .data-card__value,
.home-page .station-grid .summary-card--alarm .data-card__value {
	color: #e83240;
}

/* 使用 image 节点加载本地资源，兼容小程序的静态图片路径。 */
.home-page .power-section {
	position: relative;
	margin: 0 -14rpx;
	padding: 44rpx 40rpx 38rpx;
	min-height: 368rpx;
	overflow: hidden;
	border-radius: 24rpx;
	background: #0b315b;
}

.home-page .power-section__background,
.home-page .power-section__shade {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}

.home-page .power-section__shade {
	background: linear-gradient(90deg, rgba(9, 49, 92, 0.76) 0%, rgba(9, 49, 92, 0.42) 48%, rgba(6, 35, 68, 0.08) 100%);
}

.home-page .power-composition {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 18rpx;
	min-width: 0;
}

.home-page .power-reading {
	flex: 1;
	min-width: 0;
}

.home-page .power-heading {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 16rpx;
}

.home-page .power-heading__label {
	font-size: 26rpx;
	font-weight: 600;
	line-height: 36rpx;
	color: #ffffff;
}

.home-page .power-heading__live {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 6rpx 14rpx;
	border-radius: 30rpx;
	background: rgba(190, 223, 255, 0.13);
	font-size: 20rpx;
	line-height: 26rpx;
	color: #c0d6ed;
}

.home-page .power-heading__live-dot {
	width: 10rpx;
	height: 10rpx;
	flex-shrink: 0;
	border-radius: 50%;
	background: #27c5ff;
}

.home-page .power-reading__amount {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 14rpx;
}

.home-page .power-reading__value {
	min-width: 0;
	max-width: 100%;
	font-size: 88rpx;
	font-weight: 700;
	line-height: 1.1;
	letter-spacing: -3rpx;
	color: #ffffff;
	word-break: break-all;
}

.home-page .power-reading__unit {
	font-size: 32rpx;
	font-weight: 400;
	line-height: 1.2;
	color: #f1f7ff;
}

.home-page .power-capacity {
	margin-top: 28rpx;
	padding-top: 22rpx;
	border-top: 1rpx solid rgba(211, 231, 252, 0.42);
}

.home-page .power-capacity__label {
	display: block;
	font-size: 22rpx;
	line-height: 30rpx;
	color: #bed0e5;
}

.home-page .power-capacity__amount {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 6rpx;
}

.home-page .power-capacity__value {
	max-width: 100%;
	font-size: 46rpx;
	font-weight: 600;
	line-height: 1.15;
	color: #ffffff;
	word-break: break-all;
}

.home-page .power-capacity__unit {
	font-size: 28rpx;
	font-weight: 400;
	line-height: 1.2;
	color: #f1f7ff;
}

/* 深蓝圆盘遮住背景纹理，外缘、轨道与内芯形成参考图的层次。 */
.home-page .power-dial {
	position: relative;
	flex-shrink: 0;
	width: 224rpx;
	height: 224rpx;
	border-radius: 50%;
	background: linear-gradient(145deg, rgba(9, 48, 83, 0.98), rgba(4, 33, 61, 0.98));
	box-shadow: 0 8rpx 22rpx rgba(0, 22, 46, 0.24), inset 0 0 0 2rpx rgba(118, 184, 236, 0.06);
}

.home-page .power-dial::before {
	content: '';
	position: absolute;
	left: 28rpx;
	right: 28rpx;
	top: 28rpx;
	bottom: 28rpx;
	border-radius: 50%;
	background: radial-gradient(circle at 35% 28%, #0b3a63 0%, #082e52 60%, #072746 100%);
	box-shadow: inset 0 0 18rpx rgba(27, 111, 174, 0.16);
	pointer-events: none;
}

.home-page .power-dial__canvas {
	position: absolute;
	left: 4rpx;
	top: 4rpx;
	z-index: 1;
	width: 216rpx;
	height: 216rpx;
}

.home-page .power-dial__reading {
	position: absolute;
	left: 0;
	top: 0;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	padding-bottom: 4rpx;
	pointer-events: none;
}

.home-page .power-dial__number {
	display: flex;
	align-items: baseline;
	justify-content: center;
	gap: 2rpx;
	color: #ffffff;
}

.home-page .power-dial__value {
	font-size: 44rpx;
	font-weight: 500;
	line-height: 1.1;
	letter-spacing: 1rpx;
	color: #ffffff;
}

.home-page .power-dial__unit {
	font-size: 26rpx;
	font-weight: 400;
	line-height: 1;
	color: #f1f7ff;
}

.home-page .power-dial__label {
	margin-top: 10rpx;
	font-size: 20rpx;
	font-weight: 400;
	line-height: 1.4;
	color: #a6bfd5;
}
.home-page .generation-section {
	padding-top: 44rpx;
}

.home-page .generation-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.home-page .period-tabs {
	display: flex;
	flex-shrink: 0;
	padding: 1rpx;
	border: 1rpx solid #e8ecf2;
	border-radius: 50rpx;
	background: #f5f6f8;
}

.home-page .period-tabs__item {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	min-height: 46rpx;
	border-radius: 46rpx;
	font-size: 24rpx;
	font-weight: 400;
	line-height: 1.4;
	color: #5f6674;
}

.home-page .period-tabs__item--active {
	background: #1677ff;
	font-weight: 500;
	color: #ffffff;
	box-shadow: 0 3rpx 8rpx rgba(22, 119, 255, 0.12);
}

.home-page .period-tabs__item:active {
	opacity: 0.8;
}

/* 淡蓝圆角底衬搭配渐变圆顶柱体，日期和滑动条保持清晰留白。 */
.home-page .generation-chart {
	position: relative;
	min-width: 0;
	margin-top: 26rpx;
	padding: 18rpx 12rpx 8rpx;
	overflow: hidden;
	border: 1rpx solid #e5effc;
	border-radius: 28rpx;
	background: #f6faff;
	box-shadow: 0 10rpx 28rpx rgba(42, 104, 180, 0.06);
}

.home-page .generation-chart__canvas {
	display: block;
	width: 100%;
	height: 336rpx;
}

/* 两列统计，分隔线保留留白，累计读数使用主题蓝。 */
.home-page .statistics-section {
	margin-top: 44rpx;
	margin-bottom: 30rpx;
}

.home-page .statistics-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 56rpx;
	margin-top: 30rpx;
}

.home-page .statistics-item {
	position: relative;
	min-width: 0;
	padding: 0 22rpx 24rpx;
}

.home-page .statistics-item:nth-child(n + 3) {
	padding-top: 24rpx;
	padding-bottom: 8rpx;
	border-top: 1rpx solid #e7eaf0;
}

.home-page .statistics-item:nth-child(even)::before {
	content: '';
	position: absolute;
	left: -28rpx;
	top: 0;
	bottom: 24rpx;
	width: 1rpx;
	background: #e7eaf0;
}

.home-page .statistics-item:nth-child(even):nth-child(n + 3)::before {
	top: 24rpx;
	bottom: 8rpx;
}

.home-page .statistics-grid .data-card {
	box-sizing: border-box;
	min-width: 0;
	height: 100%;
	padding: 0;
	border: 0;
	border-radius: 0;
	background: transparent;
	box-shadow: none;
}

.home-page .statistics-grid .data-card__label {
	font-size: 23rpx;
	font-weight: 400;
	line-height: 1.4;
	color: #626b7b;
}

.home-page .statistics-grid .data-card__value {
	display: flex;
	flex-direction: row;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-top: 10rpx;
	font-size: 50rpx;
	font-weight: 600;
	line-height: 1.2;
	letter-spacing: -1.4rpx;
	color: #18202d;
}

.home-page .statistics-grid .data-card__value-text {
	max-width: 100%;
	white-space: normal;
	word-break: break-all;
}

.home-page .statistics-grid .data-card__unit {
	font-size: 22rpx;
	font-weight: 400;
	line-height: 1.4;
	letter-spacing: 0;
	color: #626b7b;
}

.home-page .statistics-item--total .data-card__value {
	color: #1677ff;
}

@media (max-width: 360px) {
	.home-page .power-section {
		padding-right: 32rpx;
		padding-left: 32rpx;
	}

	.home-page .power-composition {
		gap: 14rpx;
	}

	.home-page .power-reading__value {
		font-size: 80rpx;
	}

	.home-page .statistics-item {
		padding-right: 14rpx;
		padding-left: 14rpx;
	}

	.home-page .statistics-grid .data-card__value {
		font-size: 46rpx;
	}
}
</style>
