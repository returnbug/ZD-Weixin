<template>
	<view class="page">
		<view class="filter-bar">
			<view class="status-tabs">
				<view
					v-for="status in 报警状态"
					:key="status"
					class="status-tabs__item"
					:class="{ 'status-tabs__item--active': 当前状态 === status }"
					@click="切换状态(status)"
				>
					{{ status }}
				</view>
			</view>
			<button class="filter-button" @click="切换筛选">筛选</button>
		</view>

		<view v-if="是否显示筛选" class="filter-panel">
			<view class="filter-panel__title">
				<uni-icons type="tune" size="40rpx" color="#1677ff"></uni-icons>
				<text>筛选条件</text>
			</view>
			<view class="filter-panel__form">
				<view class="filter-field">
					<text class="filter-field__label">设备类型</text>
					<picker mode="selector" :range="报警下拉.设备类型" :value="当前设备类型索引" @change="选择设备类型">
						<view class="filter-field__control">
							<text class="filter-field__value">{{ 筛选条件.设备类型 || '请选择设备类型' }}</text>
							<uni-icons class="filter-field__icon" type="down" size="28rpx" color="#1677ff"></uni-icons>
						</view>
					</picker>
				</view>
				<view class="filter-field">
					<text class="filter-field__label">发生时间</text>
					<view class="filter-field__control">
						<picker class="filter-field__date-picker" mode="date" fields="day" :value="筛选条件.开始时间" @change="选择开始时间">
							<view class="filter-field__date-value">
								<text class="filter-field__value" :class="{ 'filter-field__value--placeholder': !筛选条件.开始时间 }">{{ 筛选条件.开始时间 || '请选择发生时间' }}</text>
								<uni-icons v-if="!筛选条件.开始时间" class="filter-field__icon" type="calendar" size="32rpx" color="#1677ff"></uni-icons>
							</view>
						</picker>
						<button v-if="筛选条件.开始时间" class="filter-field__clear" aria-label="清除发生时间" @click.stop="清除发生时间">
							<uni-icons type="clear" size="32rpx" color="#7894bb"></uni-icons>
						</button>
					</view>
				</view>
			</view>
		</view>

		<view class="alarm-list">
			<uni-transition :show="是否显示首次加载" mode-class="fade" :duration="180">
				<view v-if="是否显示首次加载" class="alarm-loading">
					<uni-load-more status="loading" icon-type="circle" :icon-size="24" color="#98a2b3" :content-text="加载提示文案"></uni-load-more>
				</view>
			</uni-transition>
			<template v-if="筛选报警列表.length">
				<view v-for="alarm in 筛选报警列表" :key="alarm.id" class="alarm-card" @click="查看报警详情(alarm)">
					<view class="alarm-card__head">
						<view class="alarm-card__title">{{ alarm.标题 }}</view>
						<StatusTag :status="alarm.状态" />
					</view>
					<view class="alarm-card__meta">{{ alarm.电站名称 }} · {{ alarm.设备类型 }}</view>
					<view class="alarm-card__time">
						<text>发生：{{ alarm.发生时间 }}</text>
						<text v-if="alarm.恢复时间">恢复：{{ alarm.恢复时间 }}</text>
					</view>
				</view>
			</template>
			<EmptyState v-else-if="!是否显示首次加载" title="暂无报警" description="当前状态下没有报警记录" />
			<view v-if="是否显示底部加载" class="alarm-list__footer">
				<uni-load-more :status="列表加载状态" icon-type="circle" :icon-size="18" color="#98a2b3" :content-text="加载提示文案"></uni-load-more>
			</view>
		</view>
		<AppTabbar current="alarm" />
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom, onUnload } from '@dcloudio/uni-app'
import AppTabbar from '@/components/app-tabbar/app-tabbar.vue'
import StatusTag from '@/components/status-tag/status-tag.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import { 报警状态列表 } from '@/config/index.js'
import { 报警接口 } from '@/api/index.js'
import { 跳转页面 } from '@/utils/navigation.js'

const 每页显条 = 50
const 状态恢复参数映射 = {
	全部: '全部状态',
	发生中: '未恢复',
	已恢复: '已恢复'
}
const 加载提示文案 = {
	contentdown: '上拉显示更多',
	contentrefresh: '加载中...',
	contentnomore: '没有更多了'
}
const 报警状态 = ref([])
const 当前状态 = ref('全部')
const 报警数据 = ref([])
const 是否显示筛选 = ref(false)
const 加载中 = ref(false)
const 初始化加载中 = ref(true)
const 当前页 = ref(1)
const 是否还有更多 = ref(true)
const 报警下拉 = ref({
	设备类型: ['全部类型'],
	区域类型: '区域1'
})
const 筛选条件 = ref({
	设备类型: '全部类型',
	开始时间: '',
	区域类型: '区域1'
})
// 筛选条件切换时允许新查询覆盖旧查询，旧响应返回后不再污染当前列表。
let 页面有效 = true
let 报警列表请求序号 = 0

const 筛选报警列表 = computed(() => {
	const 开始日期 = 筛选条件.value.开始时间

	if (!开始日期) {
		return 报警数据.value
	}

	return 报警数据.value.filter((报警) => 报警.发生日期 === 开始日期)
})
const 是否显示首次加载 = computed(() => (初始化加载中.value || 加载中.value) && !筛选报警列表.value.length)
const 是否显示底部加载 = computed(() => 筛选报警列表.value.length && (加载中.value || !是否还有更多.value))
const 列表加载状态 = computed(() => {
	if (!筛选报警列表.value.length) {
		return 'more'
	}

	if (加载中.value) {
		return 'loading'
	}

	return 是否还有更多.value ? 'more' : 'noMore'
})

const 当前设备类型索引 = computed(() => 读取下拉索引(报警下拉.value.设备类型, 筛选条件.value.设备类型))

function 读取下拉索引(下拉列表 = [], 当前值 = '') {
	const 索引 = 下拉列表.findIndex((选项) => 选项 === 当前值)

	return 索引 > -1 ? 索引 : 0
}

function 读取默认选项(下拉列表 = [], 优先值 = '') {
	if (优先值 && 下拉列表.includes(优先值)) {
		return 优先值
	}

	return 下拉列表[0] || ''
}

function 读取状态恢复参数(状态 = 当前状态.value) {
	return 状态恢复参数映射[状态] || '全部状态'
}

function 初始化筛选条件(下拉数据 = {}) {
	const 设备类型 = Array.isArray(下拉数据.设备类型) && 下拉数据.设备类型.length ? 下拉数据.设备类型 : ['全部类型']
	const 区域类型 = 下拉数据.区域类型 || '区域1'

	报警下拉.value = {
		设备类型,
		区域类型
	}
	筛选条件.value = {
		设备类型: 读取默认选项(设备类型, '全部类型'),
		开始时间: '',
		区域类型
	}
}

async function 初始化页面() {
	初始化加载中.value = true

	try {
		报警状态.value = 报警状态列表
		const 下拉数据 = await 加载报警下拉()

		if (!页面有效) {
			return
		}

		初始化筛选条件(下拉数据)
		await 查询报警列表()
	} finally {
		if (页面有效) {
			初始化加载中.value = false
		}
	}
}

async function 加载报警下拉() {
	try {
		return await 报警接口.其他下拉()
	} catch (错误) {
		return {}
	}
}

async function 查询报警列表(是否重置 = true) {
	if (!是否重置 && (加载中.value || !是否还有更多.value)) {
		return
	}

	let 查询页码 = 是否重置 ? 1 : 当前页.value
	const 当前请求序号 = 报警列表请求序号 + 1

	报警列表请求序号 = 当前请求序号

	if (是否重置) {
		当前页.value = 1
		是否还有更多.value = true
		报警数据.value = []
	}

	加载中.value = true

	try {
		const 查询日期 = 筛选条件.value.开始时间
		const 查询参数 = {
			显条: 每页显条,
			设备类型: 筛选条件.value.设备类型,
			恢复状态: 读取状态恢复参数(),
			区域类型: 筛选条件.value.区域类型,
			// 后端“条件”会搜索开始时间，先限定候选数据，再分页。
			条件: 查询日期
		}
		const 本次报警数据 = []
		let 本次还有更多 = true

		do {
			const 本页报警数据 = await 报警接口.获取报警列表({
				...查询参数,
				当页: 查询页码
			})

			if (!页面有效 || 当前请求序号 !== 报警列表请求序号) {
				return
			}

			// “条件”也搜索日志内容；只保留发生日期相符的记录，避免文案里的日期误命中。
			const 本页匹配数据 = 查询日期
				? 本页报警数据.filter((报警) => 报警.发生日期 === 查询日期)
				: 本页报警数据
			本次报警数据.push(...本页匹配数据)
			本次还有更多 = 本页报警数据.length >= 每页显条
			查询页码 += 1
			// 候选页可能全部误命中，继续补足一页有效记录或查到末页，不能提前显示“暂无报警”。
		} while (查询日期 && 本次还有更多 && 本次报警数据.length < 每页显条)

		报警数据.value = 是否重置 ? 本次报警数据 : [...报警数据.value, ...本次报警数据]
		当前页.value = 查询页码
		是否还有更多.value = 本次还有更多
	} catch (错误) {
		const 当前请求仍然有效 = 页面有效 && 当前请求序号 === 报警列表请求序号

		if (当前请求仍然有效) {
			if (是否重置) {
				报警数据.value = []
			}

			是否还有更多.value = false
		}
	} finally {
		if (页面有效 && 当前请求序号 === 报警列表请求序号) {
			加载中.value = false
		}
	}
}

function 切换状态(状态) {
	if (当前状态.value === 状态) {
		return
	}

	当前状态.value = 状态
	查询报警列表()
}

function 切换筛选() {
	是否显示筛选.value = !是否显示筛选.value
}

function 选择设备类型(事件) {
	筛选条件.value.设备类型 = 报警下拉.value.设备类型[Number(事件.detail.value)] || ''
	查询报警列表()
}

function 选择开始时间(事件) {
	const 日期 = 事件.detail.value || ''

	if (日期 === 筛选条件.value.开始时间) {
		return
	}

	筛选条件.value.开始时间 = 日期
	查询报警列表()
}

function 清除发生时间() {
	if (!筛选条件.value.开始时间) {
		return
	}

	筛选条件.value.开始时间 = ''
	查询报警列表()
}

function 查看报警详情(报警) {
	报警接口.写入报警详情缓存(报警)
	跳转页面('/pages/gf/alarm/detail/index', {
		alarmId: 报警.id
	})
}

onLoad(() => {
	页面有效 = true
	初始化页面()
})

onReachBottom(() => {
	查询报警列表(false)
})

onUnload(() => {
	页面有效 = false
	报警列表请求序号 += 1
})
</script>

<style>
.page {
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	min-height: 100vh;
	/* AppTabbar 已预留底栏和安全区高度。 */
	padding: 24rpx 24rpx 58rpx;
	background: #f5f7fa;
}

.filter-bar {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.status-tabs {
	display: flex;
	flex: 1;
	min-width: 0;
	padding: 6rpx;
	border-radius: 14rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
}

.status-tabs__item {
	flex: 1;
	height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #667085;
}

.status-tabs__item--active {
	background: #1677ff;
	color: #ffffff;
}

.filter-button {
	flex-shrink: 0;
	width: 104rpx;
	height: 70rpx;
	border-radius: 14rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	font-size: 24rpx;
	font-weight: 700;
	color: #344054;
}

.filter-panel {
	margin-top: 16rpx;
	padding: 24rpx;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #e2ebf7;
	box-shadow: 0 6rpx 20rpx rgba(22, 119, 255, 0.035);
}

.filter-panel__title {
	display: flex;
	align-items: center;
	gap: 16rpx;
	font-size: 28rpx;
	font-weight: 700;
	line-height: 40rpx;
	color: #101828;
}

.filter-panel__form {
	display: flex;
	gap: 24rpx;
	margin-top: 32rpx;
}

.filter-panel .filter-field {
	flex: 1;
	min-width: 0;
}

.filter-panel .filter-field__label {
	display: block;
	margin-bottom: 10rpx;
	font-size: 24rpx;
	font-weight: 600;
	line-height: 1.4;
	color: #667085;
}

.filter-panel .filter-field picker {
	display: block;
	width: 100%;
	min-width: 0;
}

.filter-panel .filter-field__control {
	display: flex;
	align-items: center;
	gap: 12rpx;
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	min-height: 82rpx;
	padding: 18rpx 22rpx;
	border-radius: 14rpx;
	border: 1rpx solid #dfebff;
	background: #f3f7ff;
}

.filter-panel .filter-field__value {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	font-size: 24rpx;
	line-height: 1.5;
	color: #101828;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.filter-panel .filter-field__value--placeholder {
	color: #52658e;
}

.filter-panel .filter-field__icon {
	flex-shrink: 0;
	line-height: 1;
}

.filter-panel .filter-field .filter-field__date-picker {
	flex: 1;
	width: auto;
}

.filter-panel .filter-field__date-value {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
}

.filter-panel .filter-field__clear {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 56rpx;
	height: 56rpx;
	margin: -10rpx -10rpx -10rpx 0;
	padding: 0;
	border: 0;
	background: transparent;
	line-height: 1;
}

.filter-panel .filter-field__clear::after {
	border: 0;
}

.alarm-list {
	margin-top: 24rpx;
	padding-bottom: 16rpx;
}

.alarm-loading {
	min-height: 360rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.alarm-card {
	margin-bottom: 18rpx;
	padding: 28rpx;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.alarm-card__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}

.alarm-card__title {
	flex: 1;
	min-width: 0;
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.4;
	color: #101828;
	word-break: break-word;
}

.alarm-card__meta {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #667085;
	word-break: break-word;
}

.alarm-card__time {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #98a2b3;
	word-break: break-word;
}

.alarm-list__footer {
	padding: 18rpx 0 4rpx;
	text-align: center;
	font-size: 24rpx;
	color: #98a2b3;
}
</style>
