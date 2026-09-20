<template>
	<view class="page">
		<view v-if="设备主信息.是否显示" class="device-header">
			<view>
				<view v-if="设备主信息.类型" class="device-header__type">{{ 设备主信息.类型 }}</view>
				<view v-if="设备主信息.名称" class="device-header__name">{{ 设备主信息.名称 }}</view>
				<view v-if="设备主信息.附加字段" class="device-header__meta">
					{{ 设备主信息.附加字段.名称 }}：{{ 设备主信息.附加字段.数值 }}
				</view>
			</view>
			<StatusTag v-if="设备主信息.通讯状态" :status="设备主信息.通讯状态" />
		</view>

		<view v-if="基础信息字段列表.length" class="section">
			<view class="section__title">基础信息</view>
			<view class="info-grid">
				<view v-for="item in 基础信息字段列表" :key="item.名称" class="info-item">
					<view class="info-item__label">{{ item.名称 }}</view>
					<view class="info-item__value">{{ item.数值 }}</view>
				</view>
			</view>
		</view>

		<view v-if="设备参数展示列表.length" class="section">
			<view class="section__title">设备参数</view>
			<view class="info-grid">
				<view v-for="item in 设备参数展示列表" :key="item.名称" class="info-item">
					<view class="info-item__label">{{ item.名称 }}</view>
					<view class="info-item__value">{{ item.数值 }}</view>
				</view>
			</view>
		</view>

		<view v-for="tableItem in 实时数据表格列表" :key="tableItem._key" class="section">
			<view v-if="tableItem.名称" class="section__title">{{ tableItem.名称 }}</view>
			<!-- 多列数据只在表格内横向滚动，页面仍保持当前屏幕宽度。 -->
			<scroll-view class="table-scroll" scroll-x>
				<view class="table" :style="读取表格宽度(tableItem.字段列表.length, tableItem.数据列表)">
					<view
						v-if="tableItem.字段列表.length"
						class="table__row table__row--head"
						:style="读取表格列样式(tableItem.字段列表.length)"
					>
						<text v-for="(fieldName, fieldIndex) in tableItem.字段列表" :key="fieldIndex">
							{{ fieldName }}
						</text>
					</view>
					<view
						v-for="(rowData, rowIndex) in tableItem.数据列表"
						:key="rowIndex"
						class="table__row"
						:style="读取表格列样式(tableItem.字段列表.length || rowData.length)"
					>
						<text v-for="(cell, cellIndex) in rowData" :key="cellIndex">
							{{ cell }}
						</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<view class="section">
			<view class="section__head">
				<view class="section__title">报警日志</view>
				<view class="alarm-tabs">
					<view
						v-for="status in 报警状态列表"
						:key="status"
						class="alarm-tabs__item"
						:class="{ 'alarm-tabs__item--active': 当前报警状态 === status }"
						@click="切换报警状态(status)"
					>
						{{ status }}
					</view>
				</view>
			</view>

			<scroll-view v-if="筛选报警列表.length" class="table-scroll" scroll-x>
				<view
					class="table alarm-table"
					:style="读取表格宽度(报警表格字段列表.length)"
				>
					<view
						class="table__row table__row--head"
						:style="读取表格列样式(报警表格字段列表.length)"
					>
						<text v-for="(fieldName, fieldIndex) in 报警表格字段列表" :key="fieldIndex">
							{{ fieldName }}
						</text>
					</view>
					<view
						v-for="alarm in 筛选报警列表"
						:key="alarm._key"
						class="table__row"
						:style="读取表格列样式(报警表格字段列表.length)"
					>
						<text v-for="(fieldName, fieldIndex) in 报警表格字段列表" :key="fieldIndex">
							{{ 读取报警字段值(alarm, fieldName) }}
						</text>
					</view>
				</view>
			</scroll-view>
			<EmptyState v-else title="暂无报警" description="当前设备没有匹配状态的报警" />
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import StatusTag from '@/components/status-tag/status-tag.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import { 设备接口 } from '@/api/index.js'
import { 解析路由参数 } from '@/utils/navigation.js'

const 空设备详情 = {
	表单字段列表: [],
	设备参数列表: [],
	实时数据表格列表: []
}

const 设备ID = ref('')
const 路由设备SN = ref('')
const 路由设备类型 = ref('')
const 设备详情 = ref({ ...空设备详情 })
const 报警数据 = ref([])
const 当前报警状态 = ref('全部')
const 页面加载中 = ref(false)
let 页面有效 = true
let 页面请求序号 = 0

const 表单字段列表 = computed(() => 设备详情.value.表单字段列表 || [])
const 设备参数列表 = computed(() => 设备详情.value.设备参数列表 || [])
const 实时数据表格列表 = computed(() => 设备详情.value.实时数据表格列表 || [])
const 基础信息隐藏字段 = new Set(['区域1ID', '区域2ID', '区域3ID', '设备类型', '从站地址'])
const 基础信息字段列表 = computed(() => {
	return 表单字段列表.value.filter((字段) => !基础信息隐藏字段.has(字段.名称))
})
const 设备参数展示列表 = computed(() => {
	return 设备参数列表.value.filter((字段) => !是否设备名称字段(字段))
})

const 设备主信息 = computed(() => {
	const 全部字段 = [...表单字段列表.value, ...设备参数列表.value]
	const 类型字段 = 全部字段.find((字段) => 字段.名称 === '设备类型')
	const 名称字段 = 全部字段.find(是否设备名称字段)
	const 通讯字段 = 全部字段.find((字段) => 字段.名称 === '通讯状态')
	const 类型 = 类型字段 ? 类型字段.数值 : 路由设备类型.value
	const 名称 = 名称字段 ? 名称字段.数值 : ''
	const 通讯状态 = 通讯字段 ? 通讯字段.数值 : ''
	const 设备SN = String(类型).includes('逆变器') ? 路由设备SN.value : ''

	return {
		类型,
		名称,
		通讯状态,
		附加字段: 设备SN ? { 名称: '设备SN', 数值: 设备SN } : null,
		是否显示: Boolean(类型 || 名称 || 通讯状态 || 设备SN)
	}
})

const 报警状态列表 = computed(() => {
	const 状态列表 = 报警数据.value.map((报警) => 报警.状态).filter(Boolean)

	return ['全部', ...new Set(状态列表)]
})

const 筛选报警列表 = computed(() => {
	if (当前报警状态.value === '全部') {
		return 报警数据.value
	}

	return 报警数据.value.filter((报警) => 报警.状态 === 当前报警状态.value)
})

const 报警表格字段列表 = computed(() => {
	const 字段名称列表 = []

	筛选报警列表.value.forEach((报警) => {
		;(报警.展示字段 || []).forEach((字段) => {
			if (字段.名称 && !字段名称列表.includes(字段.名称)) {
				字段名称列表.push(字段.名称)
			}
		})
	})

	return 字段名称列表
})

function 是否设备名称字段(字段) {
	// 主信息取名与参数列表隐藏名称使用同一规则，设备模版名称仍正常展示。
	return 字段.名称 === '名称' ||
		(!/模[版板]名称/.test(字段.名称) && /(编号名称|设备名称|设备信息)$/.test(字段.名称))
}

function 初始化页面(参数 = {}) {
	const 路由参数 = 解析路由参数(参数)
	// 详情使用设备列表返回的数据库 ID；兼容旧版本曾使用的中文参数和设备SN。
	路由设备SN.value = 路由参数.deviceSn || 路由参数.设备SN || ''
	设备ID.value = 路由参数.deviceId || 路由参数.设备ID || 路由参数.ID || 路由设备SN.value
	路由设备类型.value = 路由参数.deviceType || 路由参数.设备类型 || ''
	设备详情.value = { ...空设备详情 }
	报警数据.value = []
	当前报警状态.value = '全部'
}

async function 加载设备详情() {
	if (!设备ID.value || 页面加载中.value) {
		return
	}

	const 当前设备ID = 设备ID.value
	const 当前请求序号 = 页面请求序号 + 1

	页面请求序号 = 当前请求序号
	页面加载中.value = true

	try {
		// Web 端 sb读取传 ID，BJ设备日志传设备ID，参数名必须分别保持一致。
		const [详情结果, 日志结果] = await Promise.all([
			设备接口.sb读取({ ID: 当前设备ID }).catch(() => null),
			设备接口.BJ设备日志({ 设备ID: 当前设备ID }).catch(() => null)
		])

		if (!页面有效 || 当前请求序号 !== 页面请求序号 || 当前设备ID !== 设备ID.value) {
			return
		}

		if (详情结果) {
			设备详情.value = 详情结果
		}

		if (Array.isArray(日志结果)) {
			报警数据.value = 日志结果
		}
	} finally {
		if (页面有效 && 当前请求序号 === 页面请求序号) {
			页面加载中.value = false
		}
	}
}

function 读取表格列样式(列数) {
	return {
		gridTemplateColumns: `repeat(${Math.max(Number(列数) || 1, 1)}, minmax(0, 1fr))`
	}
}

function 读取表格宽度(列数, 数据列表 = []) {
	// 无表头时按实际数据列数预留宽度，少列填满容器，多列在表格内横向滚动。
	const 实际列数 = 数据列表.reduce((最大列数, 行) => Math.max(最大列数, 行.length), Number(列数) || 1)

	return {
		minWidth: '100%',
		width: `${Math.max(实际列数 * 220, 620)}rpx`
	}
}

function 读取报警字段值(报警, 字段名称) {
	const 字段 = (报警.展示字段 || []).find((项目) => 项目.名称 === 字段名称)

	return 字段 ? 字段.数值 : '--'
}

function 切换报警状态(状态) {
	当前报警状态.value = 状态
}

onLoad((参数) => {
	页面有效 = true
	初始化页面(参数)
	加载设备详情()
})

onUnload(() => {
	页面有效 = false
	页面请求序号 += 1
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

.device-header,
.section {
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.device-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20rpx;
	padding: 30rpx;
	background: linear-gradient(135deg, #eff8ff, #ffffff);
}

.device-header > view:first-child {
	min-width: 0;
}

.device-header__type {
	font-size: 24rpx;
	font-weight: 800;
	color: #1677ff;
}

.device-header__name {
	margin-top: 8rpx;
	font-size: 40rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.device-header__meta {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #667085;
	word-break: break-all;
}

.section {
	margin-top: 24rpx;
	padding: 28rpx;
}

.section__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section__head > view:first-child {
	min-width: 0;
}

.section__title {
	font-size: 32rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 20rpx;
}

.info-item {
	min-width: 0;
	padding: 20rpx;
	border-radius: 16rpx;
	background: #f9fafb;
}

.info-item__label {
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.info-item__value {
	margin-top: 8rpx;
	font-size: 28rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-all;
}

.table {
	box-sizing: border-box;
	margin-top: 20rpx;
	border-radius: 14rpx;
	overflow: hidden;
	border: 1rpx solid #edf2f7;
}

.table__row {
	display: grid;
	grid-template-columns: 1.1fr 1fr 1fr 1.2fr;
	min-height: 64rpx;
	align-items: center;
	border-bottom: 1rpx solid #edf2f7;
	background: #ffffff;
}

.table__row:last-child {
	border-bottom: 0;
}

.table__row--head {
	background: #f9fafb;
	font-weight: 800;
	color: #475467;
}

.table__row text {
	box-sizing: border-box;
	min-width: 0;
	padding: 14rpx 12rpx;
	font-size: 22rpx;
	color: #344054;
	word-break: break-all;
}

.alarm-tabs {
	display: flex;
	flex-shrink: 0;
	padding: 6rpx;
	border-radius: 12rpx;
	background: #f2f4f7;
}

.alarm-tabs__item {
	min-width: 88rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 10rpx;
	font-size: 22rpx;
	font-weight: 700;
	color: #667085;
}

.alarm-tabs__item--active {
	background: #ffffff;
	color: #1677ff;
}

.table-scroll {
	box-sizing: border-box;
	width: 100%;
	max-width: 100%;
	min-width: 0;
}
</style>
