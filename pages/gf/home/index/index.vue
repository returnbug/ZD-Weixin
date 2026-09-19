<template>
	<view class="page">
		<view class="summary-grid">
			<DataCard
				v-for="item in 状态数据"
				:key="item.标题"
				:class="{ 'summary-card--alarm': item.标题 === '有报警' }"
				:title="item.标题"
				:value="item.数值"
				:unit="item.单位"
				:type="item.类型"
			/>
		</view>

		<view class="power-panel">
			<view class="power-overview">
				<view class="power-chart">
					<qiun-data-charts
						class="power-chart__canvas"
						type="arcbar"
						canvas-id="homePowerArc"
						:canvas2d="true"
						:animation="false"
						:opts="发电功率图表配置"
						:chartData="发电功率图表数据"
						:disable-scroll="true"
						:in-scroll-view="true"
						:page-scroll-top="页面滚动高度"
					/>
					<text class="power-chart__value">{{ 发电功率占比 }}</text>
				</view>
				<view class="power-stats">
					<view class="power-stat">
						<text class="power-stat__label">总装机容量</text>
						<text class="power-stat__value">{{ 能源概览.总装机容量 }}</text>
					</view>
					<view class="power-stat">
						<text class="power-stat__label">当前发电功率</text>
						<text class="power-stat__value">{{ 能源概览.当前发电功率 }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="chart-panel">
			<view class="panel-header">
				<view>
					<view class="section-title">发电量</view>
				</view>
				<view class="segmented">
					<view
						v-for="dimension in 时间维度"
						:key="dimension"
						class="segmented__item"
						:class="{ 'segmented__item--active': 当前维度 === dimension }"
						@click="切换时间维度(dimension)"
					>
						{{ dimension }}
					</view>
				</view>
			</view>

			<view class="bar-chart">
				<qiun-data-charts
					class="bar-chart__canvas"
					type="column"
					canvas-id="homeTrendColumn"
					:canvas2d="true"
					:animation="false"
					:opts="发电趋势图表配置"
					:chartData="发电趋势图表数据"
					:disable-scroll="true"
					:in-scroll-view="true"
					:page-scroll-top="页面滚动高度"
					tooltip-format="homePowerTooltip"
				/>
			</view>
		</view>

		<view class="metric-grid">
			<view
				v-for="metric in 发电指标"
				:key="metric.标题"
				class="metric-card"
			>
				<DataCard
					:title="metric.标题"
					:value="metric.数值"
					:unit="metric.单位"
				/>
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
	color: ['#16B978'],
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
			width: 12,
			backgroundColor: '#E8F3FF',
			startAngle: 1.5,
			endAngle: 0.25,
			gap: 2
		}
	}
}

const 状态数据 = ref([])
const 能源概览 = ref({})
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
const 发电趋势柱宽 = computed(() => 发电曲线.value.length > 20 ? 6 : 12)
// qiun-data-charts 柱状图配置，日趋势点位较多时自动缩窄柱体。
const 发电趋势图表配置 = computed(() => ({
	color: ['#12b76a'],
	padding: [8, 4, 0, 4],
	animation: false,
	enableScroll: false,
	dataLabel: false,
	dataPointShape: false,
	legend: {
		show: false
	},
	xAxis: {
		disableGrid: true,
		axisLine: false,
		formatter: (项目, 索引) => 格式化趋势横轴标签(项目, 索引),
		fontColor: '#98a2b3',
		fontSize: 发电曲线.value.length > 20 ? 9 : 10
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
			width: 发电趋势柱宽.value,
			linearType: 'custom',
			customColor: ['#1677ff', '#12b76a'],
			barBorderCircle: true,
			barBorderRadius: [8, 8, 0, 0],
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
const 发电功率占比 = computed(() => `${发电功率占比数值.value}%`)
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

function 当前大屏请求是否有效(请求序号) {
	return 页面有效 && 请求序号 === 大屏请求序号
}

function 格式化趋势横轴标签(时间, 索引) {
	// 日、年维度横轴点位较密，从首项开始隔一个显示。
	if (['日', '年'].includes(当前维度.value)) {
		return 索引 % 2 === 0 ? String(时间) : ''
	}

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
.page {
	box-sizing: border-box;
	min-height: 100vh;
	padding: 28rpx 24rpx 24rpx;
	padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
	padding-bottom: calc(160rpx + constant(safe-area-inset-bottom));
	background: #f5f8fc;
	font-variant-numeric: tabular-nums;
}

/* 顶部状态统计卡片：弱化边框，用状态文字和小色点表达设备状态。 */
.summary-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
}

.summary-grid .data-card {
	min-height: 128rpx;
	padding: 24rpx 20rpx 22rpx;
	border: 1rpx solid #eef2f7;
	border-radius: 20rpx;
	background: #ffffff;
	box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.04);
}

.summary-grid .data-card__label {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 22rpx;
	font-weight: 600;
	letter-spacing: 0;
}

.summary-grid .data-card__label::before {
	content: '';
	width: 10rpx;
	height: 10rpx;
	flex-shrink: 0;
	border-radius: 50%;
	background: #1677ff;
	box-shadow: 0 0 0 6rpx rgba(22, 119, 255, 0.08);
}

.summary-grid .data-card__value {
	margin-top: 16rpx;
	font-size: 52rpx;
	font-weight: 800;
	line-height: 1;
	color: #071b36;
}

.summary-grid .data-card__unit {
	font-size: 22rpx;
	font-weight: 600;
	color: #5e728c;
}

.summary-grid .data-card--primary .data-card__label {
	color: #1677ff;
}

.summary-grid .data-card--muted .data-card__label {
	color: #475467;
}

.summary-grid .data-card--warning .data-card__label {
	color: #ffb020;
}

.summary-grid .data-card--danger .data-card__label {
	color: #ff5a5f;
}

.summary-grid .data-card--success .data-card__label {
	color: #16b978;
}

.summary-grid .data-card--primary .data-card__label::before {
	background: #1677ff;
	box-shadow: 0 0 0 6rpx rgba(22, 119, 255, 0.08);
}

.summary-grid .data-card--muted .data-card__label::before {
	background: #475467;
	box-shadow: 0 0 0 6rpx rgba(71, 84, 103, 0.1);
}

.summary-grid .data-card--warning .data-card__label::before {
	background: #ffb020;
	box-shadow: 0 0 0 6rpx rgba(255, 176, 32, 0.1);
}

.summary-grid .data-card--danger .data-card__label::before {
	background: #ff5a5f;
	box-shadow: 0 0 0 6rpx rgba(255, 90, 95, 0.1);
}

.summary-grid .data-card--success .data-card__label::before {
	background: #16b978;
	box-shadow: 0 0 0 6rpx rgba(22, 185, 120, 0.1);
}

/* 指定状态卡颜色覆盖：避免相同 type 的卡片颜色串用。 */
.summary-grid .summary-card--alarm .data-card__label,
.summary-grid .summary-card--alarm .data-card__unit {
	color: #b42318 !important;
}

.summary-grid .summary-card--alarm .data-card__label::before {
	background: #b42318 !important;
	box-shadow: 0 0 0 6rpx rgba(180, 35, 24, 0.1) !important;
}

/* 中部核心数据卡片：白底、弱阴影，突出装机容量和实时功率。 */
.power-panel,
.chart-panel {
	margin-top: 24rpx;
	padding: 32rpx;
	border: 1rpx solid #eef2f7;
	border-radius: 24rpx;
	background: #ffffff;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
}

.power-panel {
	padding: 40rpx 34rpx;
	overflow: hidden;
	box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.04);
}

/* 底部发电统计卡片：保持四宫格，累计发电量轻量高亮。 */
.metric-grid {
	display: flex;
	flex-wrap: wrap;
	margin: 28rpx -6rpx -10rpx;
}

.metric-card {
	box-sizing: border-box;
	width: 50%;
	padding: 0 6rpx 16rpx;
}

.metric-card .data-card {
	min-height: 140rpx;
	padding: 32rpx 30rpx 28rpx;
	border-color: transparent;
	border-radius: 20rpx;
	background: #ffffff;
	box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.04);
}

.metric-card:nth-child(4) .data-card {
	background: #f3f8ff;
}

.metric-card .data-card__label {
	font-size: 26rpx;
	font-weight: 600;
	color: #63758f;
}

.metric-card .data-card__value {
	margin-top: 16rpx;
	font-size: 60rpx;
	font-weight: 700;
	color: #071b36;
	line-height: 1.06;
}

.metric-card:nth-child(4) .data-card__value {
	color: #1677ff;
}

.metric-card .data-card__unit {
	font-size: 22rpx;
	font-weight: 500;
	color: #7b8da4;
}

.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.panel-header > view:first-child {
	min-width: 0;
}

.section-title {
	padding-left: 14rpx;
	border-left: 6rpx solid #1677ff;
	font-size: 32rpx;
	font-weight: 800;
	line-height: 1.15;
	color: #101828;
	word-break: break-word;
}

.section-subtitle {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.power-overview {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 72rpx;
	min-height: 220rpx;
}

.power-chart {
	position: relative;
	flex-shrink: 0;
	width: 180rpx;
	height: 180rpx;
	margin-left: 8rpx;
	border-radius: 50%;
	background: #f8fbff;
	overflow: hidden;
}

.power-chart__canvas {
	position: absolute;
	left: 0;
	top: 0;
	width: 180rpx;
	height: 180rpx;
}

.power-chart__value {
	position: absolute;
	left: 0;
	top: 0;
	z-index: 2;
	width: 180rpx;
	height: 180rpx;
	font-size: 48rpx;
	font-weight: 800;
	line-height: 180rpx;
	text-align: center;
	color: #071b36;
	pointer-events: none;
}

.power-stats {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 34rpx;
}

.power-stat {
	min-width: 0;
}

.power-stat__label,
.power-stat__value {
	display: block;
	word-break: break-word;
}

.power-stat__label {
	display: inline-flex;
	align-items: center;
	width: auto;
	font-size: 26rpx;
	font-weight: 600;
	color: #60718a;
}

.power-stat:nth-child(2) .power-stat__label::after {
	content: '实时';
	margin-left: 12rpx;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(22, 185, 120, 0.1);
	font-size: 20rpx;
	font-weight: 700;
	line-height: 1.2;
	color: #16b978;
}

.power-stat__value {
	margin-top: 14rpx;
	font-size: 54rpx;
	font-weight: 700;
	line-height: 1.08;
	color: #071b36;
	word-break: break-all;
}

.power-stat:first-child .power-stat__value {
	font-size: 60rpx;
}

.segmented {
	display: flex;
	flex-shrink: 0;
	padding: 6rpx;
	border: 1rpx solid #edf2f7;
	border-radius: 14rpx;
	background: #f3f6fa;
}

.segmented__item {
	min-width: 56rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 10rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #60718a;
}

.segmented__item--active {
	background: #ffffff;
	color: #1677ff;
	box-shadow: 0 6rpx 14rpx rgba(0, 0, 0, 0.06);
}

.bar-chart {
	position: relative;
	height: 276rpx;
	margin-top: 34rpx;
	overflow: hidden;
}

.bar-chart__canvas {
	width: 100%;
	height: 276rpx;
}

</style>
