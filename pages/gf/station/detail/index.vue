<template>
	<view class="page">
		<view class="device-overview section">
			<view class="section__title">设备总概览</view>
			<view class="device-overview__list">
				<view v-for="item in 设备总览列表" :key="item.名称" class="overview-row">
					<view class="overview-row__icon" :style="{ backgroundColor: item.背景色 }">
						<uni-icons :type="item.图标" size="38rpx" :color="item.颜色"></uni-icons>
					</view>
					<view class="overview-row__content">
						<view class="overview-row__name">{{ item.名称 }}</view>
						<view class="overview-row__count">{{ item.数量 }}</view>
						<view class="overview-row__meta">{{ item.离线数量 }} 离线 / {{ item.报警数量 }} 报警</view>
					</view>
				</view>
			</view>
		</view>

		<view class="energy-panel section">
			<view class="energy-tabs">
				<view
					v-for="item in 能量页签列表"
					:key="item"
					class="energy-tabs__item"
					:class="{ 'energy-tabs__item--active': 当前能量页签 === item }"
					@tap="切换能量页签(item)"
				>
					{{ item }}
				</view>
			</view>

			<view v-if="当前能量页签 === '能量流向'" class="energy-flow-map">
				<view class="energy-flow-map__row">
					<view class="flow-generation">
						<view class="flow-icon-card flow-icon-card--solar">
							<uni-icons type="cloud-upload" size="42rpx" color="#2f6bff"></uni-icons>
							<text>{{ 能量流向数据.发电效率 }}</text>
						</view>
					</view>

					<view class="flow-line-group flow-line-group--left">
						<view class="flow-line-label flow-line-label--top">
							<text>发电功率</text>
							<text>{{ 能量流向数据.发电功率 }}</text>
						</view>
						<view
							class="flow-line"
							:class="{ 'flow-line--active': 能量流向状态.发电到并网柜 }"
						></view>
						<view class="flow-line-label flow-line-label--bottom">装机 {{ 能量流向数据.装机容量 }}</view>
					</view>

					<view class="flow-icon-card flow-icon-card--cabinet">
						<uni-icons type="gear-filled" size="38rpx" color="#f59e0b"></uni-icons>
						<text>并网柜</text>
					</view>

					<view class="flow-line-group flow-line-group--right">
						<view class="flow-line-label flow-line-label--top">
							<text>电网功率</text>
							<text>{{ 能量流向数据.电网功率 }}</text>
						</view>
						<view
							class="flow-line flow-line--reverse"
							:class="{ 'flow-line--active': 能量流向状态.电网到并网柜 }"
						></view>
					</view>

					<view class="flow-grid">
						<view class="flow-icon-card flow-icon-card--grid">
							<uni-icons type="shop-filled" size="38rpx" color="#8b95a1"></uni-icons>
							<text>电网</text>
						</view>
					</view>
				</view>

				<view
					class="flow-vertical-line"
					:class="{ 'flow-vertical-line--active': 能量流向状态.并网柜到用电 }"
				></view>

				<view class="flow-load">
					<view class="flow-icon-card flow-icon-card--load">
						<uni-icons type="home" size="38rpx" color="#ff5a5f"></uni-icons>
						<text>用电</text>
					</view>
					<view class="flow-copy flow-copy--load">
						<view class="flow-copy__main">
							<text>用电功率</text>
						</view>
						<view class="flow-copy__sub">{{ 能量流向数据.用电功率 }}</view>
					</view>
				</view>
			</view>

			<view v-else-if="当前能量页签 === '发电'" class="energy-tab-panel">
				<view class="power-summary power-summary--generation">
					<view class="power-ring-chart">
						<qiun-data-charts
							class="power-ring-chart__canvas"
							type="arcbar"
							canvas-id="stationPowerEfficiencyArc"
							:canvas2d="true"
							:animation="false"
							:opts="发电效率圆环图表配置"
							:chartData="发电效率圆环图表数据"
							:disable-scroll="false"
							:in-scroll-view="true"
						/>
						<text class="power-ring-chart__value">{{ 发电概览.发电效率 }}</text>
					</view>
					<view class="power-summary__content">
						<view class="power-summary__line">
							<text>发电功率</text>
							<text>{{ 发电概览.发电功率 }}</text>
							<text>kW</text>
						</view>
						<view class="power-summary__line">
							<text>装机容量</text>
							<text>{{ 发电概览.装机容量 }}</text>
							<text>kW</text>
						</view>
					</view>
				</view>

				<view class="energy-stat-grid">
					<view v-for="item in 发电统计列表" :key="item.标题" class="energy-stat-card">
						<view class="energy-stat-card__title">{{ item.标题 }}</view>
						<view class="energy-stat-card__value">{{ item.数值 }}</view>
						<view class="energy-stat-card__unit">{{ item.单位 }}</view>
					</view>
				</view>
			</view>

			<view v-else-if="当前能量页签 === '用电'" class="energy-tab-panel">
				<view class="single-power-summary">
					<uni-icons type="home" size="64rpx" color="#2f6bff"></uni-icons>
					<view class="single-power-summary__text">
						<text>用电功率</text>
						<text>{{ 用电概览.用电功率 }} kW</text>
					</view>
				</view>

				<view class="energy-stat-grid">
					<view v-for="item in 用电统计列表" :key="item.标题" class="energy-stat-card">
						<view class="energy-stat-card__title">{{ item.标题 }}</view>
						<view class="energy-stat-card__value">{{ item.数值 }}</view>
						<view class="energy-stat-card__unit">{{ item.单位 }}</view>
					</view>
				</view>
			</view>

			<view v-else class="energy-tab-panel">
				<view class="single-power-summary">
					<uni-icons type="shop-filled" size="64rpx" color="#2f6bff"></uni-icons>
					<view class="single-power-summary__text">
						<text>电网功率</text>
						<text>{{ 电网概览.电网功率 }} kW</text>
					</view>
				</view>

				<view class="grid-energy-table">
					<view class="grid-energy-table__cell grid-energy-table__cell--empty"></view>
					<view v-for="item in 电网表头" :key="item" class="grid-energy-table__cell grid-energy-table__head">{{ item }}</view>
					<view
						v-for="item in 电网表格单元"
						:key="item.key"
						class="grid-energy-table__cell"
						:class="[item.单元类型, item.类型]"
					>
						<text v-if="item.是否标题">{{ item.标题 }}</text>
						<view v-else class="grid-energy-table__content">
							<view class="grid-energy-table__value">{{ item.数值 }}</view>
							<view class="grid-energy-table__unit">{{ item.单位 }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<view class="section__title">发电量</view>
				<view class="period-tabs">
					<view
						v-for="item in 发电统计维度列表"
						:key="item"
						class="period-tabs__item"
						:class="{ 'period-tabs__item--active': 发电统计维度 === item }"
						@tap="切换发电统计维度(item)"
					>
						{{ item }}
					</view>
				</view>
			</view>
			<view class="chart-summary">
				<view class="chart-summary__item">
					<text>日发电量</text>
					<text>{{ 电站信息.当日发电量 || '--' }}</text>
				</view>
				<view class="chart-summary__item">
					<text>辐照量</text>
					<text>{{ 电站信息.日辐照量 || '--' }}</text>
				</view>
				<view class="chart-summary__item">
					<text>满发小时</text>
					<text>{{ 电站信息.当日发电小时数 || '--' }}</text>
				</view>
			</view>
			<view class="generation-chart">
				<qiun-data-charts
					class="generation-chart__canvas"
					type="area"
					canvas-id="stationGenerationArea"
					:canvas2d="true"
					:animation="false"
					:opts="发电曲线图表配置"
					:chartData="发电曲线图表数据"
					:disable-scroll="false"
					:in-scroll-view="true"
				/>
			</view>
		</view>

		<view class="section">
			<view class="section__title">消纳率分析</view>
			<view class="absorption-list">
				<view v-for="group in 消纳率分析列表" :key="group.标题" class="absorption-panel">
					<view class="absorption-panel__head">
						<text class="absorption-panel__label">{{ group.标题 }}</text>
						<text class="absorption-panel__value">{{ group.总量 }}</text>
					</view>
					<view class="absorption-panel__track">
						<view
							v-for="(item, index) in group.明细"
							:key="`${item.名称}-进度`"
							class="absorption-panel__track-fill"
							:class="index === 0 ? 'absorption-panel__track-fill--left' : 'absorption-panel__track-fill--right'"
							:style="读取消纳率进度条样式(item)"
						></view>
					</view>
					<view class="absorption-panel__grid">
						<view v-for="item in group.明细" :key="item.名称" class="absorption-card">
							<view class="absorption-card__content">
								<view class="absorption-card__name">
									<view class="absorption-card__dot" :style="{ backgroundColor: item.颜色 }"></view>
									<text>{{ item.名称 }}</text>
								</view>
								<view class="absorption-card__energy">{{ item.数值 }}</view>
							</view>
							<view class="absorption-card__percent">{{ item.占比 }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="section saving-panel">
			<view class="section__title">节能减排</view>
			<view class="saving-list">
				<view v-for="item in 节能减排列表" :key="item.名称" class="saving-row">
					<view class="saving-row__icon" :style="{ backgroundColor: item.背景色 }">
						<uni-icons :type="item.图标" size="38rpx" color="#ffffff"></uni-icons>
					</view>
					<view class="saving-row__content">
						<view class="saving-row__name">{{ item.显示名称 }}</view>
						<view class="saving-row__value">{{ item.显示数值 }}</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { 光伏电站接口 } from '@/api/index.js'
import { 解析路由参数 } from '@/utils/navigation.js'

const 发电统计维度列表 = ['日', '月', '年', '总']
const 能量页签列表 = ['能量流向', '发电', '用电', '电网']
const 电网表头 = ['日', '月', '年', '总']
const 发电量单位 = 'kW·h'
const 发电统计字段配置 = [
	{ 标题: '日发电量', 字段: '日发电量' },
	{ 标题: '月发电量', 字段: '月发电量' },
	{ 标题: '年发电量', 字段: '年发电量' },
	{ 标题: '总发电量', 字段: '总发电量' }
]
const 用电统计字段配置 = [
	{ 标题: '日用电', 字段: '日用电量' },
	{ 标题: '月用电', 字段: '月用电量' },
	{ 标题: '年用电', 字段: '年用电量' },
	{ 标题: '总用电', 字段: '总用电量' }
]
const 系统概要图标映射 = {
	逆变器: 'gear-filled',
	电表: 'info-filled',
	采集器: 'image',
	变压器: 'cloud-upload',
	'el-icon-cpu': 'gear-filled',
	'el-icon-odometer': 'info-filled',
	'el-icon-data-line': 'image',
	'el-icon-partly-cloudy': 'cloud-upload'
}
const 环保图标映射 = {
	'el-icon-office-building': 'shop-filled',
	'el-icon-cloudy': 'cloud-upload',
	'el-icon-tree': 'medal-filled'
}
const 深色背景映射 = {
	蓝色: '#2f6bff',
	绿色: '#16a34a',
	青色: '#06b6d4',
	橙色: '#ea7a1a'
}
const 节能减排名称映射 = {
	节约标煤: '节约标准煤',
	CO2排放量: 'CO₂减排量'
}

const 电站编号 = ref('')
const 电站信息 = ref({})
const 光伏电站看板原始数据 = ref({})
const 看板数据 = ref({
	系统概要: [],
	图表数据: {},
	电能数据: {},
	环保数据: []
})
const 发电统计维度 = ref('日')
const 当前能量页签 = ref('能量流向')

// 看板周期切换会触发异步请求，只保留当前页面最后一次返回的数据。
let 页面有效 = true
let 看板请求序号 = 0

const 发电效率圆环图表配置 = {
	color: ['#2563eb'],
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
			backgroundColor: '#e5edf8',
			startAngle: 1.5,
			endAngle: 0.25,
			gap: 3,
			lineCap: 'round',
			linearType: 'custom',
			customColor: ['#60a5fa']
		}
	}
}

const 发电曲线图表配置 = {
	color: ['#1677ff', '#57bf3f'],
	padding: [12, 18, 0, 8],
	animation: false,
	dataLabel: false,
	dataPointShape: false,
	legend: {
		show: true,
		position: 'bottom',
		float: 'center'
	},
	xAxis: {
		disableGrid: true,
		axisLine: false,
		fontColor: '#98a2b3',
		fontSize: 10,
		labelCount: 5,
		lineHeight: 16,
		marginTop: 4
	},
	yAxis: {
		gridType: 'dash',
		dashLength: 4,
		data: [
			{
				min: 0,
				fontColor: '#98a2b3'
			}
		]
	},
	extra: {
		area: {
			type: 'curve',
			opacity: 0.18,
			addLine: true,
			width: 2,
			gradient: true
		}
	}
}

const 能量流向数据 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return {
		发电效率: 格式化百分比(数据.发电效率),
		发电功率: 格式化带单位(数据.发电功率, 'kW'),
		装机容量: 格式化带单位(数据.装机容量, 'kW'),
		电网功率: 格式化带单位(数据.电网功率, 'kW'),
		用电功率: 格式化带单位(数据.用电功率, 'kW')
	}
})

const 能量流向状态 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return {
		发电到并网柜: !是否零值或空值(数据.发电功率),
		电网到并网柜: !是否零值或空值(数据.电网功率),
		并网柜到用电: !是否零值或空值(数据.用电功率)
	}
})

const 发电效率圆环图表数据 = computed(() => ({
	series: [
		{
			name: '发电效率',
			data: 读取百分比图表数值(光伏电站看板原始数据.value.发电效率)
		}
	]
}))

const 发电概览 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return {
		发电效率: 格式化百分比(数据.发电效率),
		发电功率: 格式化能量数值(数据.发电功率),
		装机容量: 格式化能量数值(数据.装机容量)
	}
})

const 发电统计列表 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return 发电统计字段配置.map((配置) => 创建发电统计项(配置.标题, 数据[配置.字段]))
})

const 用电概览 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return {
		用电功率: 格式化能量数值(数据.用电功率, true)
	}
})

const 用电统计列表 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return 用电统计字段配置.map((配置) => 创建能量统计项(配置.标题, 数据[配置.字段], true))
})

const 电网概览 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return {
		电网功率: 格式化能量数值(数据.电网功率)
	}
})

const 电网统计列表 = computed(() => {
	const 数据 = 光伏电站看板原始数据.value

	return [
		{
			标题: '并网',
			类型: 'is-grid',
			数据: [
				创建能量统计项('日', 数据.并网当日),
				创建能量统计项('月', 数据.并网当月),
				创建能量统计项('年', 数据.并网当年),
				创建能量统计项('总', 数据.并网总)
			]
		},
		{
			标题: '购电',
			类型: 'is-buy',
			数据: [
				创建能量统计项('日', 数据.购电当日),
				创建能量统计项('月', 数据.购电当月),
				创建能量统计项('年', 数据.购电当年),
				创建能量统计项('总', 数据.购电总)
			]
		}
	]
})

const 电网表格单元 = computed(() => {
	return 电网统计列表.value.reduce((单元列表, 行) => {
		单元列表.push({
			key: `${行.标题}-标题`,
			标题: 行.标题,
			是否标题: true,
			单元类型: 'grid-energy-table__row-title',
			类型: 行.类型
		})

		行.数据.forEach((项目) => {
			单元列表.push({
				...项目,
				key: `${行.标题}-${项目.标题}`,
				是否标题: false
			})
		})

		return 单元列表
	}, [])
})

const 发电曲线图表数据 = computed(() => {
	const 图表数据 = 读取对象(看板数据.value.图表数据)
	const x轴 = 读取数组(图表数据.x轴)
	const 实际发电 = 读取数组(图表数据.实际发电)
	const 计划发电 = 读取数组(图表数据.计划发电)
	const 单位 = 图表数据.单位 || 发电量单位
	const series = [
		{
			name: '实际发电',
			data: x轴.map((时间, 索引) => 读取图表数值(实际发电[索引])),
			unit: 单位
		}
	]

	if (计划发电.length) {
		series.push({
			name: '计划发电',
			data: x轴.map((时间, 索引) => 读取图表数值(计划发电[索引])),
			unit: 单位
		})
	}

	return {
		categories: x轴.map((时间) => 格式化发电曲线X轴标签(时间)),
		series
	}
})

const 设备总览列表 = computed(() => {
	return 读取数组(看板数据.value.系统概要).map((项目) => 标准化设备总览项(项目))
})

const 节能减排列表 = computed(() => {
	return 读取数组(看板数据.value.环保数据)
		.filter((项目) => 项目.名称 !== '累计收入')
		.map((项目) => 标准化节能减排项(项目))
})

const 消纳率分析列表 = computed(() => 创建消纳率分析列表(看板数据.value.电能数据, 光伏电站看板原始数据.value))

function 初始化页面(参数 = {}) {
	const 路由参数 = 解析路由参数(参数)
	电站编号.value = 路由参数.stationId || 路由参数.电站编号 || ''
	电站信息.value = {}
	光伏电站看板原始数据.value = {}
	
	看板数据.value = {
		系统概要: [],
		图表数据: {},
		电能数据: {},
		环保数据: []
	}
}

function 读取当前日期() {
	const 当前日期 = new Date()
	const 年 = 当前日期.getFullYear()
	const 月 = String(当前日期.getMonth() + 1).padStart(2, '0')
	const 日 = String(当前日期.getDate()).padStart(2, '0')

	return `${年}-${月}-${日}`
}

function 根据图表周期生成图表日期(图表周期) {
	const 当前日期 = 读取当前日期()

	// 后端按图表周期要求不同日期精度：日到天、月到月、年到年。
	if (图表周期 === '月') {
		return 当前日期.slice(0, 7)
	}

	if (图表周期 === '年') {
		return 当前日期.slice(0, 4)
	}

	// 日查询保持原来的完整日期格式，避免影响现有日数据。
	return 当前日期
}

async function 加载光伏电站看板数据(图表周期 = 发电统计维度.value) {
	const 电站ID = 电站编号.value

	if (!电站ID) {
		return
	}

	const 当前请求序号 = 看板请求序号 + 1

	看板请求序号 = 当前请求序号

	try {
		const 请求参数 = {
			ID: 电站ID,
			图表周期,
			图表日期: 根据图表周期生成图表日期(图表周期)
		}

		// 详情页看板数据直接来自 gf读取，页面只按当前模块做展示层整理。
		const 数据 = await 光伏电站接口.gf读取(请求参数)

		if (!页面有效 || 当前请求序号 !== 看板请求序号) {
			return
		}

		应用光伏电站看板数据(数据)
	} catch (错误) {
		// 请求层已统一提示错误，详情页保留当前看板数据。
	}
}

function 应用光伏电站看板数据(数据 = {}) {
	const 原始数据 = 读取对象(数据)
	光伏电站看板原始数据.value = 原始数据
	看板数据.value = {
		系统概要: 读取数组(原始数据.系统概要),
		图表数据: 读取对象(原始数据.图表数据),
		电能数据: 读取对象(原始数据.电能数据),
		环保数据: 读取数组(原始数据.环保数据)
	}
	电站信息.value = {
		发电功率: 格式化带单位(原始数据.发电功率, 'kW'),
		电网功率: 格式化带单位(原始数据.电网功率, 'kW'),
		用电功率: 格式化带单位(原始数据.用电功率, 'kW'),
		当日发电量: 格式化带单位(原始数据.日发电量, 发电量单位),
		日辐照量: 格式化带单位(原始数据.日辐照量, 'kWh/m2'),
		当日发电小时数: 格式化带单位(原始数据.日满发小时, 'h')
	}
}

function 读取图表数值(值) {
	const 数字 = Number.parseFloat(值)

	return Number.isFinite(数字) ? 数字 : 0
}

function 格式化发电曲线X轴标签(值) {
	const 文本 = String(值 ?? '').trim()
	const 小时匹配 = 文本.match(/^(\d{1,2}):\d{2}/)

	return 小时匹配 ? 小时匹配[1].padStart(2, '0') : 文本
}

function 读取百分比图表数值(值) {
	const 数字 = Number.parseFloat(值)

	if (!Number.isFinite(数字)) {
		return 0
	}

	return Math.min(1, Math.max(0, 数字 / 100))
}

function 读取对象(值) {
	return 值 && typeof 值 === 'object' && !Array.isArray(值) ? 值 : {}
}

function 读取数组(值) {
	return Array.isArray(值) ? 值 : []
}

function 读取字段值(值, 默认值) {
	return 是否空值(值) ? 默认值 : 值
}

function 是否空值(值) {
	return 值 === undefined || 值 === null || 值 === ''
}

function 格式化数值(值) {
	return 是否空值(值) ? '--' : String(值).trim()
}

function 格式化带单位(值, 单位 = '') {
	const 数值文本 = 格式化数值(值)

	if (数值文本 === '--') {
		return 数值文本
	}

	return 单位 ? `${数值文本} ${单位}` : 数值文本
}

function 创建能量统计项(标题, 值, 零显示短横 = false) {
	return {
		标题,
		数值: 格式化能量数值(值, 零显示短横),
		单位: 发电量单位
	}
}

function 创建发电统计项(标题, 值) {
	return {
		标题,
		数值: 格式化万级发电量(值),
		单位: 发电量单位
	}
}

function 格式化万级发电量(值) {
	const 数值文本 = 格式化能量数值(值)
	const 数字 = Number.parseFloat(数值文本)

	// 只压缩发电汇总的万级数值，其余数值格式与单位保持原样。
	return Number.isFinite(数字) && 数字 > 10000
		? `${(数字 / 10000).toFixed(1)}w`
		: 数值文本
}

function 格式化能量数值(值, 零显示短横 = false) {
	if (是否空值(值)) {
		return '--'
	}

	if (零显示短横 && 是否零值(值)) {
		return '--'
	}

	return String(值).trim()
}

function 格式化百分比(值) {
	if (是否空值(值)) {
		return '--'
	}

	const 百分比文本 = String(值).trim()

	return 百分比文本.includes('%') ? 百分比文本 : `${百分比文本}%`
}

function 是否零值(值) {
	const 数字 = Number.parseFloat(值)

	return Number.isFinite(数字) && 数字 === 0
}

function 是否零值或空值(值) {
	return 是否空值(值) || 是否零值(值)
}

function 读取消纳率进度条样式(项目 = {}) {
	return {
		width: 格式化进度条宽度(项目.占比),
		backgroundColor: 项目.颜色 || '#2f6bff'
	}
}

function 格式化进度条宽度(值) {
	const 数字 = Number.parseFloat(值)

	if (!Number.isFinite(数字)) {
		return '0%'
	}

	return `${Math.min(100, Math.max(0, 数字))}%`
}

function 标准化设备总览项(项目 = {}) {
	const 名称 = 格式化数值(项目.名称)

	// 详情页直接消费 gf读取 当前约定字段，缺失时只做展示兜底，不再枚举历史字段别名。
	return {
		名称,
		数量: 格式化数值(读取字段值(项目.数量, 0)),
		离线数量: 格式化数值(读取字段值(项目.离线数, 0)),
		报警数量: 格式化数值(读取字段值(项目.报警数, 0)),
		图标: 读取系统概要图标(项目),
		颜色: '#2f6bff',
		背景色: '#eff6ff'
	}
}

function 读取系统概要图标(项目 = {}) {
	return 系统概要图标映射[项目.图标] || 系统概要图标映射[项目.名称] || 'info-filled'
}

function 创建消纳率分析列表(电能数据 = {}, 原始数据 = {}) {
	const 发电量 = 读取字段值(电能数据.发电量, 原始数据.日发电量)
	const 自用电量 = 电能数据.自用电量
	const 并网量 = 读取字段值(电能数据.并网量, 原始数据.并网当日)
	const 用电量 = 读取字段值(电能数据.用电量, 原始数据.日用电量)
	const 来自发电 = 读取字段值(电能数据.来自发电, 自用电量)
	const 购电量 = 读取字段值(电能数据.购电量, 原始数据.购电当日)

	return [
		{
			标题: '发电量',
			总量: 格式化带单位(发电量, 发电量单位),
			明细: [
				{
					名称: '用于用电',
					数值: 格式化带单位(自用电量, 发电量单位),
					占比: 格式化百分比(电能数据.用于用电占比),
					颜色: '#2f6bff'
				},
				{
					名称: '用于并网',
					数值: 格式化带单位(并网量, 发电量单位),
					占比: 格式化百分比(电能数据.用于并网占比),
					颜色: '#57bf3f'
				}
			]
		},
		{
			标题: '用电量',
			总量: 格式化带单位(用电量, 发电量单位),
			明细: [
				{
					名称: '来自发电',
					数值: 格式化带单位(来自发电, 发电量单位),
					占比: 格式化百分比(电能数据.来自发电占比),
					颜色: '#2f6bff'
				},
				{
					名称: '来自购电',
					数值: 格式化带单位(购电量, 发电量单位),
					占比: 格式化百分比(电能数据.来自购电占比),
					颜色: '#e49b35'
				}
			]
		}
	]
}

function 标准化节能减排项(项目 = {}) {
	const 配置 = 读取节能减排图标配置(项目)

	return {
		...项目,
		...配置,
		显示名称: 格式化节能减排名称(项目.名称),
		显示数值: 格式化节能减排数值(项目.数值, 项目.单位)
	}
}

function 读取节能减排图标配置(项目 = {}) {
	const 名称 = 项目.名称 || ''
	const 颜色 = 项目.颜色 || ''

	if (名称.includes('CO2') || 名称.includes('碳')) {
		return {
			图标: 环保图标映射[项目.图标] || 'cloud-upload',
			背景色: 读取深色背景(颜色, '#16a34a')
		}
	}

	if (名称.includes('植树')) {
		return {
			图标: 环保图标映射[项目.图标] || 'medal-filled',
			背景色: 读取深色背景(颜色, '#2f6bff')
		}
	}

	return {
		图标: 环保图标映射[项目.图标] || 'shop-filled',
		背景色: 读取深色背景(颜色, '#2f6bff')
	}
}

function 读取深色背景(颜色 = '', 默认颜色 = '#2f6bff') {
	return 深色背景映射[颜色] || 默认颜色
}

function 格式化节能减排名称(名称 = '') {
	return 节能减排名称映射[名称] || 名称
}

function 格式化节能减排数值(数值 = '', 单位 = '') {
	if (是否空值(数值)) {
		return '--'
	}

	const 数值文本 = String(数值).trim()

	if (!数值文本 || 数值文本 === '--') {
		return '--'
	}

	return `${数值文本}${单位 ? ` ${单位}` : ''}`
}

function 切换发电统计维度(维度) {
	if (发电统计维度.value === 维度) {
		return
	}

	发电统计维度.value = 维度
	加载光伏电站看板数据(维度)
}

function 切换能量页签(页签) {
	当前能量页签.value = 页签
}

onLoad((参数) => {
	页面有效 = true
	初始化页面(参数)
	加载光伏电站看板数据()
})

onUnload(() => {
	页面有效 = false
	看板请求序号 += 1
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
	background:
		linear-gradient(180deg, #f8fbff 0%, #f4f7fb 42%, #eef3f8 100%);
}

.section.device-overview {
	margin-top: 0;
}

.device-overview__list {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 20rpx;
}

.saving-list {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	margin-top: 20rpx;
}

.overview-row,
.saving-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	min-width: 0;
	padding: 18rpx;
	border-radius: 16rpx;
	background: linear-gradient(180deg, #fbfdff 0%, #f7faff 100%);
	border: 1rpx solid #e6edf6;
	box-shadow: 0 8rpx 20rpx rgba(16, 24, 40, 0.035);
}

.overview-row__icon,
.saving-row__icon {
	flex-shrink: 0;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	box-shadow: 0 8rpx 16rpx rgba(47, 107, 255, 0.12);
}

.overview-row__content,
.saving-row__content {
	flex: 1;
	min-width: 0;
}

.overview-row__name,
.saving-row__name {
	font-size: 24rpx;
	line-height: 1.35;
	color: #667085;
	word-break: break-word;
}

.overview-row__count,
.saving-row__value {
	margin-top: 4rpx;
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.2;
	color: #101828;
	word-break: break-all;
	font-variant-numeric: tabular-nums;
}

.overview-row__meta {
	margin-top: 6rpx;
	font-size: 22rpx;
	line-height: 1.35;
	color: #667085;
	word-break: break-word;
}

.energy-panel {
	padding: 0;
	overflow: hidden;
}

.energy-tabs {
	display: flex;
	align-items: center;
	height: 86rpx;
	padding: 0 30rpx;
	border-bottom: 1rpx solid #e8eef7;
	background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.energy-tabs__item {
	position: relative;
	height: 86rpx;
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 500;
	line-height: 1;
	color: #344054;
}

.energy-tabs__item--active {
	font-weight: 800;
	color: #0f2f7f;
}

.energy-tabs__item--active::after {
	content: '';
	position: absolute;
	left: 18rpx;
	right: 18rpx;
	bottom: 0;
	height: 4rpx;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #2f6bff 0%, #22c55e 100%);
	box-shadow: 0 0 12rpx rgba(47, 107, 255, 0.32);
}

.energy-flow-map {
	padding: 40rpx 24rpx 0rpx;
}

.energy-flow-map__row {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-width: 0;
}

.flow-generation,
.flow-grid,
.flow-load {
	display: flex;
	align-items: center;
	min-width: 0;
}

.flow-generation {
	width: 92rpx;
}

.flow-grid {
	width: 92rpx;
	justify-content: flex-end;
}

.flow-load {
	justify-content: center;
	gap: 16rpx;
	width: 252rpx;
	margin: 0 auto;
}

.flow-icon-card {
	box-sizing: border-box;
	width: 86rpx;
	height: 86rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
	font-size: 21rpx;
	font-weight: 800;
	line-height: 1.15;
	box-shadow: 0 10rpx 22rpx rgba(16, 24, 40, 0.06);
}

.flow-icon-card--solar {
	border: 1rpx solid #8fc2ff;
	background: linear-gradient(180deg, #f3f8ff 0%, #e8f1ff 100%);
	color: #2f6bff;
}

.flow-icon-card--cabinet {
	border: 1rpx solid #fed7aa;
	background: linear-gradient(180deg, #fff8ed 0%, #fff1d7 100%);
	color: #f59e0b;
}

.flow-icon-card--grid {
	border: 1rpx solid #d0d5dd;
	background: linear-gradient(180deg, #fbfdff 0%, #eef3f8 100%);
	color: #8b95a1;
}

.flow-icon-card--load {
	border: 1rpx solid #fecdd3;
	background: linear-gradient(180deg, #fff5f6 0%, #ffecef 100%);
	color: #ff5a5f;
}

.flow-copy {
	min-width: 0;
}

.flow-copy--load {
	margin-left: 0;
	flex: 1;
	min-width: 0;
}

.flow-copy__main {
	display: flex;
	align-items: baseline;
	gap: 6rpx;
	min-width: 0;
	font-size: 25rpx;
	font-weight: 800;
	line-height: 1.25;
	color: #101828;
	white-space: normal;
	word-break: keep-all;
}

.flow-load .flow-copy__main text {
	white-space: nowrap;
}

.flow-copy__sub {
	margin-top: 6rpx;
	font-size: 22rpx;
	line-height: 1.25;
	color: #7b8794;
	white-space: normal;
	word-break: break-all;
}

.flow-line-group {
	position: relative;
	z-index: 1;
	flex: 1;
	height: 108rpx;
	min-width: 0;
	display: flex;
	align-items: center;
}

.flow-line-group--left {
	margin: 0 8rpx 0 6rpx;
}

.flow-line-group--right {
	margin: 0 6rpx 0 8rpx;
}

.flow-line-label {
	flex-wrap: wrap;
	position: absolute;
	left: -12rpx;
	right: -12rpx;
	min-width: 0;
	display: flex;
	align-items: baseline;
	gap: 4rpx;
	font-size: 20rpx;
	line-height: 1.15;
	color: #7b8794;
	word-break: keep-all;
	z-index: 3;
}

.flow-line-label--top {
	top: -20rpx;
	font-weight: 800;
	color: #101828;
}

.flow-line-label--bottom {
	bottom: 4rpx;
	font-size: 22rpx;
	color: #7b8794;
}

.flow-line-label text {
	min-width: 0;
	max-width: 100%;
	white-space: normal;
	word-break: break-all;
}

.flow-line-group--right .flow-line-label--top {
	justify-content: flex-end;
}

.flow-line {
	position: relative;
	width: 100%;
	height: 12rpx;
	border-radius: 999rpx;
	background: #d7e0ec;
	overflow: hidden;
}

.flow-line--active {
	background: #2f6bff;
}

.flow-line--active::after {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	width: 100%;
	background: repeating-linear-gradient(
		90deg,
		rgba(255, 255, 255, 0) 0,
		rgba(255, 255, 255, 0) 18rpx,
		rgba(255, 255, 255, 0.7) 18rpx,
		rgba(255, 255, 255, 0.7) 30rpx,
		rgba(255, 255, 255, 0) 30rpx,
		rgba(255, 255, 255, 0) 52rpx
	);
	background-size: 52rpx 100%;
	animation: flow-line-left-to-right 1.1s linear infinite;
}

.flow-line--reverse.flow-line--active {
	background: #2f6bff;
}

.flow-line--reverse.flow-line--active::after {
	left: auto;
	right: 0;
	animation-name: flow-line-right-to-left;
}

.flow-vertical-line {
	position: relative;
	width: 14rpx;
	height: 84rpx;
	margin: 0 auto;
	border-radius: 999rpx;
	background: #dce2ea;
	overflow: hidden;
}

.flow-vertical-line--active {
	background: #2f6bff;
}

.flow-vertical-line--active::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 100%;
	background: repeating-linear-gradient(
		180deg,
		rgba(255, 255, 255, 0) 0,
		rgba(255, 255, 255, 0) 18rpx,
		rgba(255, 255, 255, 0.7) 18rpx,
		rgba(255, 255, 255, 0.7) 30rpx,
		rgba(255, 255, 255, 0) 30rpx,
		rgba(255, 255, 255, 0) 52rpx
	);
	background-size: 100% 52rpx;
	animation: flow-line-top-to-bottom 1.1s linear infinite;
}

@keyframes flow-line-left-to-right {
	from {
		background-position: 0 0;
	}

	to {
		background-position: 52rpx 0;
	}
}

@keyframes flow-line-right-to-left {
	from {
		background-position: 52rpx 0;
	}

	to {
		background-position: 0 0;
	}
}

@keyframes flow-line-top-to-bottom {
	from {
		background-position: 0 0;
	}

	to {
		background-position: 0 52rpx;
	}
}

.flow-generation,
.flow-grid,
.flow-icon-card {
	position: relative;
	z-index: 1;
}

.energy-tab-panel {
	padding: 34rpx 18rpx 30rpx;
}

.power-summary,
.single-power-summary {
	display: flex;
	align-items: center;
	gap: 28rpx;
	padding-bottom: 30rpx;
	border-bottom: 1rpx solid #e8eef7;
}

.power-ring-chart {
	position: relative;
	width: 180rpx;
	height: 180rpx;
	flex-shrink: 0;
	border-radius: 50%;
	overflow: hidden;
	background: #ffffff;
	box-shadow: inset 0 0 0 1rpx #e5edf8;
}

.power-ring-chart__canvas {
	position: absolute;
	left: 0;
	top: 0;
	width: 180rpx;
	height: 180rpx;
}

.power-ring-chart__value {
	position: absolute;
	left: 40rpx;
	top: 40rpx;
	z-index: 2;
	width: 120rpx;
	height: 120rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	font-weight: 800;
	line-height: 1;
	text-align: center;
	color: #101828;
	letter-spacing: -0.5rpx;
	font-variant-numeric: tabular-nums;
	pointer-events: none;
}

.power-summary__content {
	flex: 1;
	min-width: 0;
}

.power-summary__line {
	display: grid;
	grid-template-columns: 140rpx minmax(0, 1fr) 54rpx;
	align-items: baseline;
	gap: 10rpx;
	min-height: 70rpx;
	border-bottom: 1rpx solid #eef3f8;
	font-variant-numeric: tabular-nums;
}

.power-summary__line:last-child {
	border-bottom: 0;
}

.power-summary__line text:first-child,
.single-power-summary__text text:first-child {
	font-size: 26rpx;
	color: #7b8794;
}

.power-summary__line text:nth-child(2),
.single-power-summary__text text:nth-child(2) {
	min-width: 0;
	max-width: 100%;
	font-size: 44rpx;
	font-weight: 800;
	color: #101828;
	white-space: normal;
	word-break: break-all;
}

.power-summary__line text:last-child {
	font-size: 24rpx;
	color: #7b8794;
}

.single-power-summary {
	min-height: 132rpx;
}

.single-power-summary__text {
	display: flex;
	flex-wrap: wrap;
	flex: 1;
	align-items: baseline;
	gap: 14rpx;
	min-width: 0;
	font-variant-numeric: tabular-nums;
}

.energy-stat-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 6rpx;
	margin-top: 20rpx;
}

.energy-stat-card {
	min-width: 0;
	min-height: 162rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 18rpx 4rpx;
	border-radius: 12rpx;
	background: linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%);
	border: 1rpx solid #edf3fb;
	text-align: center;
}

.energy-stat-card__title {
	font-size: 24rpx;
	line-height: 1.25;
	color: #7b8794;
	word-break: break-word;
}

.energy-stat-card__value {
	max-width: 100%;
	margin-top: 26rpx;
	font-size: 32rpx;
	font-weight: 800;
	line-height: 1.1;
	color: #101828;
	white-space: normal;
	word-break: break-all;
}

.energy-stat-card__unit {
	margin-top: 28rpx;
	font-size: 22rpx;
	line-height: 1.2;
	color: #7b8794;
}

.grid-energy-table {
	display: grid;
	grid-template-columns: 94rpx repeat(4, minmax(0, 1fr));
	gap: 8rpx;
	margin-top: 20rpx;
}

.grid-energy-table__cell {
	min-width: 0;
	min-height: 86rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10rpx 6rpx;
	border-radius: 10rpx;
	background: linear-gradient(180deg, #fbfdff 0%, #f6f9fd 100%);
	border: 1rpx solid #edf3fb;
	text-align: center;
}

.grid-energy-table__cell--empty {
	background: #f8fafc;
}

.grid-energy-table__head {
	font-size: 26rpx;
	font-weight: 800;
	color: #101828;
}

.grid-energy-table__row-title {
	font-size: 24rpx;
	font-weight: 800;
}

.grid-energy-table__row-title.is-grid {
	color: #20c933;
}

.grid-energy-table__row-title.is-buy {
	color: #f59e0b;
}

.grid-energy-table__content {
	min-width: 0;
}

.grid-energy-table__value {
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.15;
	color: #101828;
	word-break: break-all;
}

.grid-energy-table__unit {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #7b8794;
}

.chart-summary {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 22rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid #edf3fb;
}

.chart-summary__item {
	min-width: 0;
	text-align: center;
}

.chart-summary__item text:first-child {
	display: block;
	font-size: 22rpx;
	color: #667085;
	word-break: break-word;
}

.chart-summary__item text:last-child {
	display: block;
	margin-top: 8rpx;
	font-size: 26rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-all;
	font-variant-numeric: tabular-nums;
}

.generation-chart {
	height: 300rpx;
	margin-top: 22rpx;
	overflow: hidden;
}

.generation-chart__canvas {
	width: 100%;
	height: 300rpx;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.section-header .section__title {
	min-width: 0;
}

.period-tabs {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 4rpx;
	overflow: hidden;
	border: 1rpx solid #dbe7ff;
	border-radius: 14rpx;
	background: #f8fbff;
	box-shadow: 0 6rpx 18rpx rgba(47, 107, 255, 0.08);
}

.period-tabs__item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 52rpx;
	height: 40rpx;
	border-radius: 9rpx;
	font-size: 24rpx;
	font-weight: 500;
	line-height: 1;
	color: #344054;
	transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.period-tabs__item:not(:last-child)::after {
	content: '';
	position: absolute;
	top: 8rpx;
	right: -3rpx;
	bottom: 8rpx;
	width: 1rpx;
	background: #d8e2f0;
}

.period-tabs__item--active {
	background: linear-gradient(180deg, #3f7cff 0%, #2f6bff 100%);
	box-shadow: 0 6rpx 12rpx rgba(47, 107, 255, 0.22);
	font-weight: 800;
	color: #ffffff;
}

.period-tabs__item--active::after {
	display: none;
}

.section {
	position: relative;
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
	border: 1rpx solid #e6edf6;
	box-shadow: 0 12rpx 32rpx rgba(16, 24, 40, 0.045);
	overflow: hidden;
}

.section__title {
	position: relative;
	padding-left: 14rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.section__title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 7rpx;
	bottom: 7rpx;
	width: 5rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, #2f6bff 0%, #22c55e 100%);
}

.absorption-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	margin-top: 22rpx;
}

.absorption-panel {
	padding: 24rpx;
	border-radius: 14rpx;
	border: 1rpx solid #e6edf6;
	background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
	box-shadow: 0 8rpx 20rpx rgba(16, 24, 40, 0.035);
}

.absorption-panel__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.absorption-panel__label {
	min-width: 0;
	font-size: 28rpx;
	line-height: 1.35;
	color: #667085;
	word-break: break-word;
}

.absorption-panel__value {
	min-width: 0;
	max-width: 100%;
	font-size: 34rpx;
	font-weight: 800;
	line-height: 1.2;
	color: #101828;
	text-align: right;
	word-break: break-all;
	font-variant-numeric: tabular-nums;
}

.absorption-panel__track {
	position: relative;
	height: 16rpx;
	margin-top: 24rpx;
	border-radius: 999rpx;
	background: #edf2f7;
	box-shadow: inset 0 1rpx 2rpx rgba(16, 24, 40, 0.08);
	overflow: hidden;
}

.absorption-panel__track-fill {
	position: absolute;
	top: 0;
	bottom: 0;
	min-width: 0;
	box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.32);
}

.absorption-panel__track-fill--left {
	left: 0;
	border-radius: 999rpx 0 0 999rpx;
}

.absorption-panel__track-fill--right {
	right: 0;
	border-radius: 0 999rpx 999rpx 0;
}

.absorption-panel__grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 18rpx;
}

.absorption-card {
	box-sizing: border-box;
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
	min-width: 0;
	padding: 20rpx;
	border-radius: 12rpx;
	border: 1rpx solid #e8eef7;
	background: #ffffff;
	box-shadow: 0 6rpx 16rpx rgba(16, 24, 40, 0.025);
}

.absorption-card__content {
	min-width: 0;
}

.absorption-card__name {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
	font-size: 24rpx;
	line-height: 1.35;
	color: #667085;
	word-break: break-word;
}

.absorption-card__dot {
	flex-shrink: 0;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	box-shadow: 0 0 0 5rpx rgba(16, 24, 40, 0.06);
}

.absorption-card__energy {
	margin-top: 12rpx;
	padding-left: 26rpx;
	font-size: 24rpx;
	line-height: 1.3;
	color: #667085;
	word-break: break-all;
}

.absorption-card__percent {
	min-width: 0;
	max-width: 100%;
	word-break: break-all;
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.2;
	color: #101828;
	text-align: right;
	font-variant-numeric: tabular-nums;
}
</style>
