<template>
	<view class="page">
		<view class="toolbar">
			<view class="view-tabs">
				<view
					v-for="view in 视图列表"
					:key="view"
					class="view-tabs__item"
					:class="{ 'view-tabs__item--active': 当前视图 === view }"
					@click="切换视图(view)"
				>
					{{ view }}
				</view>
			</view>
			<view v-if="当前视图 === '电站'" class="toolbar__actions">
				<button class="toolbar-button" @click="打开搜索">搜索</button>
				<button class="toolbar-button toolbar-button--primary" @click="添加内容">添加</button>
			</view>
		</view>

		<view v-if="当前视图 === '电站'" class="station-list">
			<uni-transition :show="是否显示电站首次加载" mode-class="fade" :duration="180">
				<view v-if="是否显示电站首次加载" class="station-loading">
					<uni-load-more status="loading" icon-type="circle" :icon-size="24" color="#98a2b3" :content-text="加载提示文案"></uni-load-more>
				</view>
			</uni-transition>
			<template v-if="电站数据.length">
				<view v-for="station in 电站数据" :key="station._key" class="clickable-card" @click="打开电站详情(station)">
					<StationCard :station="station" />
				</view>
			</template>
			<EmptyState v-else-if="!是否显示电站首次加载" title="暂无电站" description="当前区域下没有电站数据" />
			<view v-if="是否显示电站底部加载" class="station-list__footer">
				<uni-load-more :status="电站列表加载状态" icon-type="circle" :icon-size="18" color="#98a2b3" :content-text="加载提示文案"></uni-load-more>
			</view>
		</view>

		<view v-else class="device-view">
			<view class="filter-row">
				<view
					v-for="type in 设备类型列表"
					:key="type"
					class="filter-chip"
					:class="{ 'filter-chip--active': 当前设备类型 === type }"
					@click="选择设备类型(type)"
				>
					{{ type }}
				</view>
			</view>

			<view class="list-panel">
				<template v-if="展示设备列表.length">
					<view
						v-for="device in 展示设备列表"
						:key="device._key || device.sn"
						class="device-card"
						@click="打开设备详情(device)"
					>
						<DeviceRow :device="device" />
					</view>
				</template>
				<view v-else-if="!设备加载中" class="device-empty-card">
					<EmptyState title="暂无设备" description="当前筛选条件下没有设备数据" />
				</view>
			</view>

			<button
				v-if="设备加载中 || 是否可加载更多"
				class="load-more"
				:disabled="设备加载中"
				@click="加载更多设备"
			>
				{{ 设备加载中 ? '加载中...' : '加载更多' }}
			</button>
		</view>
		<AppTabbar current="station" />
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom, onUnload } from '@dcloudio/uni-app'
import AppTabbar from '@/components/app-tabbar/app-tabbar.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import StationCard from '../components/station-card.vue'
import DeviceRow from '../components/device-row.vue'
import { 光伏电站接口, 设备接口 } from '@/api/index.js'
import { 跳转页面 } from '@/utils/navigation.js'
import { 显示建设中提示 } from '@/utils/toast.js'

const 视图列表 = ['电站', '设备']
const 电站每页显条 = 10
const 加载提示文案 = {
	contentdown: '上拉显示更多',
	contentrefresh: '加载中...',
	contentnomore: '没有更多了'
}
const 当前视图 = ref('电站')
const 电站数据 = ref([])
const 电站区域类型 = ref('区域1')
const 电站加载中 = ref(false)
const 电站初始化加载中 = ref(true)
const 电站当前页 = ref(1)
const 电站是否还有更多 = ref(true)
const 设备类型列表 = ref([])
const 设备数据 = ref([])
const 当前设备类型 = ref('')
const 设备区域类型 = ref('区域1')
const 设备加载中 = ref(false)
const 设备列表已初始化 = ref(false)
const 设备当前页 = ref(1)
const 设备每页显条 = 100
const 设备总条数 = ref(null)
const 设备本页数量 = ref(0)
// 分页请求以最后一次为准，页面卸载后不再追加列表数据。
let 页面有效 = true
let 电站列表请求序号 = 0
let 设备列表请求序号 = 0

const 展示设备列表 = computed(() => {
	return 设备数据.value
})

const 是否可加载更多 = computed(() => {
	if (设备总条数.value !== null) {
		return 设备数据.value.length < 设备总条数.value
	}

	return 设备列表已初始化.value && 设备本页数量.value >= 设备每页显条
})

const 是否显示电站首次加载 = computed(() => (电站初始化加载中.value || 电站加载中.value) && !电站数据.value.length)
const 是否显示电站底部加载 = computed(() => 电站数据.value.length && (电站加载中.value || !电站是否还有更多.value))
const 电站列表加载状态 = computed(() => {
	if (!电站数据.value.length) {
		return 'more'
	}

	if (电站加载中.value) {
		return 'loading'
	}

	return 电站是否还有更多.value ? 'more' : 'noMore'
})

async function 初始化页面() {
	设备数据.value = []
	设备列表已初始化.value = false
	await 初始化电站列表()
}

async function 初始化电站列表() {
	电站初始化加载中.value = true

	try {
		const 下拉数据 = await 加载电站下拉()

		if (!页面有效) {
			return
		}

		电站区域类型.value = 下拉数据.区域类型 || '区域1'
		设备区域类型.value = 电站区域类型.value
		应用设备类型下拉(下拉数据)
		await 查询电站列表()
	} finally {
		if (页面有效) {
			电站初始化加载中.value = false
		}
	}
}

async function 加载电站下拉() {
	try {
		return await 光伏电站接口.其他下拉()
	} catch (错误) {
		return {}
	}
}

function 应用设备类型下拉(下拉数据 = {}) {
	// 设备分类完全来自已有“其他下拉”接口，不使用本地固定设备类型。
	const 类型列表 = Array.isArray(下拉数据.设备类型) ? 下拉数据.设备类型 : []

	设备类型列表.value = 类型列表
	if (!类型列表.includes(当前设备类型.value)) {
		当前设备类型.value = 类型列表[0] || ''
	}
}

async function 准备设备列表() {
	if (!当前设备类型.value) {
		const 下拉数据 = await 加载电站下拉()

		if (!页面有效) {
			return
		}

		设备区域类型.value = 下拉数据.区域类型 || 设备区域类型.value
		应用设备类型下拉(下拉数据)
	}

	if (当前设备类型.value && !设备列表已初始化.value) {
		查询设备列表(true)
	}
}

async function 查询设备列表(是否重置 = true) {
	if (!当前设备类型.value || 设备加载中.value || (!是否重置 && !是否可加载更多.value)) {
		return
	}

	const 请求设备类型 = 当前设备类型.value
	const 查询页码 = 是否重置 ? 1 : 设备当前页.value
	const 当前请求序号 = 设备列表请求序号 + 1

	设备列表请求序号 = 当前请求序号
	if (是否重置) {
		设备数据.value = []
		设备当前页.value = 1
		设备总条数.value = null
		设备本页数量.value = 0
		设备列表已初始化.value = false
	}

	设备加载中.value = true

	try {
		// 系统类型、设备模版和状态筛选沿用 API 层相同的默认值。
		const 列表结果 = await 设备接口.获取设备列表({
			显条: 设备每页显条,
			当页: 查询页码,
			区域类型: 设备区域类型.value,
			设备类型: 请求设备类型
		})

		if (!页面有效 || 当前请求序号 !== 设备列表请求序号 || 请求设备类型 !== 当前设备类型.value) {
			return
		}

		const 本页设备数据 = Array.isArray(列表结果.数据) ? 列表结果.数据 : []

		// 字段接口已在 API 层按顺序映射数据，页面仅负责当前设备类型的分页展示。
		设备数据.value = 是否重置 ? 本页设备数据 : [...设备数据.value, ...本页设备数据]
		设备当前页.value = 查询页码 + 1
		设备总条数.value = 列表结果.条数
		设备本页数量.value = 本页设备数据.length
		设备列表已初始化.value = true
	} catch (错误) {
		if (页面有效 && 当前请求序号 === 设备列表请求序号 && 请求设备类型 === 当前设备类型.value) {
			if (是否重置) {
				设备数据.value = []
			}

			设备本页数量.value = 0
		}
	} finally {
		if (页面有效 && 当前请求序号 === 设备列表请求序号) {
			设备加载中.value = false
		}
	}
}

async function 查询电站列表(是否重置 = true) {
	if (电站加载中.value || (!是否重置 && !电站是否还有更多.value)) {
		return
	}

	const 查询页码 = 是否重置 ? 1 : 电站当前页.value
	const 当前请求序号 = 电站列表请求序号 + 1

	电站列表请求序号 = 当前请求序号

	if (是否重置) {
		电站当前页.value = 1
		电站是否还有更多.value = true
		电站数据.value = []
	}

	电站加载中.value = true

	try {
		const 本页电站数据 = await 光伏电站接口.gf加载数据({
			显条: 电站每页显条,
			当页: 查询页码,
			区域类型: 电站区域类型.value
		})

		if (!页面有效 || 当前请求序号 !== 电站列表请求序号) {
			return
		}

		// 电站列表按后端分页追加，页面直接消费接口层统一后的对象数据。
		电站数据.value = 是否重置 ? 本页电站数据 : [...电站数据.value, ...本页电站数据]
		电站当前页.value = 查询页码 + 1
		电站是否还有更多.value = 本页电站数据.length >= 电站每页显条
	} catch (错误) {
		const 当前请求仍然有效 = 页面有效 && 当前请求序号 === 电站列表请求序号

		if (当前请求仍然有效) {
			if (是否重置) {
				电站数据.value = []
			}

			电站是否还有更多.value = false
		}
	} finally {
		if (页面有效 && 当前请求序号 === 电站列表请求序号) {
			电站加载中.value = false
		}
	}
}

function 切换视图(视图) {
	当前视图.value = 视图

	if (视图 === '设备') {
		准备设备列表()
	}
}

function 选择设备类型(类型) {
	if (当前设备类型.value === 类型) {
		if (!设备加载中.value && !设备列表已初始化.value) {
			查询设备列表(true)
		}
		return
	}

	// 切换类型时让旧响应失效；不同类型可以立即发起自己的字段与数据请求。
	设备列表请求序号 += 1
	设备加载中.value = false
	当前设备类型.value = 类型
	设备数据.value = []
	设备当前页.value = 1
	设备总条数.value = null
	设备本页数量.value = 0
	设备列表已初始化.value = false
	查询设备列表(true)
}

function 加载更多设备() {
	查询设备列表(false)
}

function 打开电站详情(电站) {
	// 路由统一使用英文参数名，避免模拟器和真机对中文键名的解码差异。
	跳转页面('/pages/gf/station/detail/index', {
		stationId: 电站.id,
	})
}

function 打开设备详情(设备) {
	跳转页面('/pages/gf/station/device-detail/index', {
		deviceId: 设备.ID || '',
		deviceSn: String(设备.类型 || '').includes('逆变器')
			? (设备.sn || '')
			: '',
		deviceType: 设备.类型
	})
}

function 打开搜索() {
	显示建设中提示('搜索功能待接入')
}

function 添加内容() {
	显示建设中提示('添加功能待接入')
}

onLoad(() => {
	页面有效 = true
	初始化页面()
})

onReachBottom(() => {
	if (当前视图.value === '电站') {
		查询电站列表(false)
		return
	}

	if (是否可加载更多.value) {
		加载更多设备()
	}
})

onUnload(() => {
	页面有效 = false
	电站列表请求序号 += 1
	设备列表请求序号 += 1
})
</script>

<style>
.page {
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	min-height: 100vh;
	/* AppTabbar 已预留底栏和安全区高度。 */
	padding: 24rpx 24rpx 48rpx;
	background: #f5f7fa;
}

.toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-bottom: 24rpx;
}

.view-tabs {
	display: flex;
	flex: 1;
	min-width: 0;
	padding: 6rpx;
	border-radius: 14rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
}

.view-tabs__item {
	flex: 1;
	height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	font-size: 26rpx;
	font-weight: 700;
	color: #667085;
}

.view-tabs__item--active {
	background: #1677ff;
	color: #ffffff;
}

.toolbar__actions {
	display: flex;
	flex-shrink: 0;
	gap: 12rpx;
}

.toolbar-button {
	width: 96rpx;
	height: 68rpx;
	border-radius: 12rpx;
	background: #ffffff;
	font-size: 24rpx;
	font-weight: 700;
	color: #344054;
	border: 1rpx solid #edf2f7;
}

.toolbar-button--primary {
	color: #ffffff;
	background: #1677ff;
	border-color: #1677ff;
}

.station-list {
	display: flex;
	flex-direction: column;
	gap: 22rpx;
}

.station-loading {
	min-height: 360rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.station-list__footer {
	padding: 18rpx 0 4rpx;
	text-align: center;
	font-size: 24rpx;
	color: #98a2b3;
}

.clickable-card {
	display: block;
	min-width: 0;
}

.filter-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.filter-chip {
	padding: 14rpx 22rpx;
	border-radius: 999rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	font-size: 24rpx;
	font-weight: 700;
	color: #667085;
	word-break: break-word;
}

.filter-chip--active {
	color: #1677ff;
	background: #eff8ff;
	border-color: #b2ddff;
}

.list-panel {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-top: 24rpx;
	padding: 0;
	background: transparent;
	border: 0;
}

.device-card,
.device-empty-card {
	padding: 0 24rpx;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
}

.load-more {
	width: 100%;
	height: 72rpx;
	margin-top: 20rpx;
	border-radius: 14rpx;
	background: #ffffff;
	border: 1rpx solid #d0d5dd;
	font-size: 26rpx;
	font-weight: 700;
	color: #344054;
}
</style>
