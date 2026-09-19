<template>
	<view class="page">
		<view class="page__shape page__shape--circle"></view>
		<view class="page__shape page__shape--oval"></view>
		<view class="page__shape page__shape--triangle"></view>
		<view class="page__shape page__shape--block"></view>

		<view class="brand">
			<image class="brand__logo" src="/static/images/logo.png" mode="aspectFit"></image>
			<view class="brand__content">
				<view class="brand__title">筑电数字</view>
				<view class="brand__subtitle">智慧工厂 · 工业互联网平台</view>
			</view>
		</view>

		<view class="app-hall">
			<view class="app-hall__header">
				<view class="app-hall__title">应用模块</view>
				<view class="app-hall__marker"></view>
			</view>

			<view class="module-grid">
				<view
					v-for="module in 模块列表"
					:key="module.id"
					class="module-card"
					:class="[
						'module-card--' + module.id,
						{
							'module-card--disabled': !module.可用
						}
					]"
					:style="获取模块卡片样式(module)"
					hover-class="module-card--pressed"
					hover-stay-time="120"
					@click="打开模块(module)"
				>
					<view class="module-card__icon">
						<image
							v-if="是否图片图标(module.图标)"
							:src="module.图标"
							mode="aspectFit"
							style="width: 80rpx; height: 80rpx;"
						></image>
						<text
							v-else-if="是否Iconfont图标(module.图标)"
							class="iconfont"
							:class="module.图标"
						></text>
						<text v-else>{{ module.图标 || module.名称.slice(0, 1) }}</text>
					</view>
					<view class="module-card__body">
						<view class="module-card__title">{{ module.名称 }}</view>
					</view>
					<view class="module-card__entry">
						<text>进入</text>
						<uni-icons
							class="module-card__entry-icon"
							type="right"
							size="24rpx"
							:color="module.可用 ? 获取模块强调色(module) : '#829AB1'"
						></uni-icons>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { 首页接口, 用户接口 } from '@/api/index.js'
import { 切换标签页, 重启页面 } from '@/utils/navigation.js'
import { 显示建设中提示 } from '@/utils/toast.js'

const 模块列表 = ref([])
const 首页路径 = '/pages/gf/home/index/index'
const 正在进入新能源 = ref(false)
const 模块ID相关字段 = ['ID', 'id', '应用ID', '应用编号', '编码', 'code']
const 模块名称相关字段 = ['名称', '应用名称']
const 新能源模块标识列表 = ['new-energy', 'new_energy', 'newenergy', 'new', '光伏运维']
// 模块和权限请求都是异步流程，页面离开后不再回写入口状态。
let 页面有效 = true

function 读取首个真值字段(对象 = {}, 字段列表 = []) {
	let 字段值

	for (const 字段 of 字段列表) {
		字段值 = 对象[字段]
		if (字段值) {
			return 字段值
		}
	}

	return 字段值
}

function 初始化页面() {
	if (!用户接口.判断登录状态有效()) {
		// 登录态超过 7 天或本地缓存不完整时，清理旧数据并回到登录页重新认证。
		用户接口.清理登录状态()
		重启页面('/pages/login/index')
		return
	}

	加载应用模块列表()
}

function 根据权限过滤应用模块(列表 = []) {
	const 可见应用ID列表 = 用户接口.读取可见应用ID列表()

	// 对齐 public/src/views/home/index.vue：登录态中没有 appIds 时，不展示任何可见应用。
	if (!可见应用ID列表.length) {
		return []
	}

	const 可见应用ID集合 = new Set(可见应用ID列表.map((应用ID) => String(应用ID)))

	return 列表.filter((模块) => {
		const 模块ID = 读取首个真值字段(模块, 模块ID相关字段)

		return 模块ID !== undefined && 模块ID !== null && 可见应用ID集合.has(String(模块ID))
	})
}

async function 加载应用模块列表() {
	try {
		const 应用模块列表 = await 首页接口.获取应用模块列表()

		if (!页面有效) {
			return
		}

		模块列表.value = 根据权限过滤应用模块(应用模块列表)
	} catch (错误) {
		if (页面有效) {
			模块列表.value = []
		}
	}
}

function 隐藏首页按钮() {
	// #ifdef MP-WEIXIN
	uni.hideHomeButton()
	// #endif
}

function 是否新能源模块(模块 = {}) {
	const 模块标识列表 = [...模块ID相关字段, ...模块名称相关字段]
		.map((字段) => 模块[字段])
		.map((标识) => String(标识 || '').trim().toLowerCase())

	return 模块标识列表.some((标识) => 新能源模块标识列表.includes(标识) || 标识.includes('新能源'))
}

async function 打开模块(模块) {
	if (!是否新能源模块(模块)) {
		显示建设中提示('暂未开放')
		return
	}

	if (正在进入新能源.value) {
		return
	}

	正在进入新能源.value = true

	try {
		// 进入新能源模块前同步新能源后端权限，给报警等业务接口准备区域可见范围。
		await 用户接口.获取新能源用户权限()
		if (!页面有效) {
			return
		}
		切换标签页(首页路径)
	} catch (错误) {
		// 请求层已统一提示错误，这里只结束进入态。
	} finally {
		if (页面有效) {
			正在进入新能源.value = false
		}
	}
}

function 是否图片图标(图标) {
	const 图标文本 = String(图标 || '')

	return /^https?:\/\//.test(图标文本) || /^\/?static\//.test(图标文本) || /\.(png|jpe?g|svg|webp|gif)(\?.*)?$/i.test(图标文本)
}

function 是否Iconfont图标(图标) {
	const 图标文本 = String(图标 || '').trim()

	// 对齐 public：后端“图标”字段保存 iconfont 类名，形如 icon-guangfu。
	return /^icon-[A-Za-z0-9_-]+$/.test(图标文本)
}

function 标准化十六进制颜色(颜色) {
	const 颜色文本 = String(颜色 || '').trim()

	if (/^#[0-9a-fA-F]{6}$/.test(颜色文本)) {
		return 颜色文本
	}

	if (!/^#[0-9a-fA-F]{3}$/.test(颜色文本)) {
		return ''
	}

	return `#${颜色文本
		.slice(1)
		.split('')
		.map((字符) => `${字符}${字符}`)
		.join('')}`
}

function 十六进制转RGBA(颜色, 透明度) {
	const 标准颜色 = 标准化十六进制颜色(颜色)

	if (!标准颜色) {
		return ''
	}

	const 红色 = parseInt(标准颜色.slice(1, 3), 16)
	const 绿色 = parseInt(标准颜色.slice(3, 5), 16)
	const 蓝色 = parseInt(标准颜色.slice(5, 7), 16)

	return `rgba(${红色}, ${绿色}, ${蓝色}, ${透明度})`
}

function 获取模块强调色(模块) {
	// 模块背景色来自 public 的 C0读取全部，这里只把它转成卡片强调色，不改变接口数据。
	return 标准化十六进制颜色(模块.背景色) || '#1685F5'
}

function 获取模块卡片样式(模块) {
	const 强调色 = 获取模块强调色(模块)
	const 强调色浅层 = 十六进制转RGBA(强调色, 0.16)
	const 强调色中层 = 十六进制转RGBA(强调色, 0.28)
	const 强调色描边 = 十六进制转RGBA(强调色, 0.72)
	const 强调色阴影 = 十六进制转RGBA(强调色, 0.18)

	// 参照 public 首页卡片：保留深色底、强调色描边、左上短线和右下入口。
	return {
		'--module-accent': 强调色,
		'--module-accent-soft': 强调色浅层,
		'--module-accent-mid': 强调色中层,
		background: `radial-gradient(circle at 100% 50%, ${强调色中层} 0, rgba(255, 255, 255, 0) 42%), radial-gradient(circle at 0% 50%, ${强调色浅层} 0, rgba(255, 255, 255, 0) 48%), linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.98) 58%, rgba(236, 245, 252, 0.98))`,
		borderColor: 强调色描边,
		boxShadow: `0 18rpx 40rpx rgba(3, 18, 42, 0.2), 0 0 24rpx ${强调色阴影}, 0 1rpx 0 rgba(255, 255, 255, 0.08) inset`
	}
}

onLoad(() => {
	页面有效 = true
	初始化页面()
})

onShow(() => {
	隐藏首页按钮()
})

onUnload(() => {
	页面有效 = false
})
</script>

<style>
@import '@/static/iconfont/iconfont.css';

.page {
	position: relative;
	min-height: 100vh;
	box-sizing: border-box;
	padding: 44rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
	overflow: hidden;
	background: linear-gradient(180deg, #f7fbff 0%, #edf7ff 100%);
}

.page__shape {
	position: absolute;
	z-index: 0;
	pointer-events: none;
	will-change: transform;
}

.page__shape--circle {
	top: -92rpx;
	right: -120rpx;
	width: 360rpx;
	height: 360rpx;
	border-radius: 50%;
	opacity: 0.08;
	background: #27d8a2;
	animation: floatCircle 18s ease-in-out infinite;
}

.page__shape--oval {
	top: 88rpx;
	left: -150rpx;
	width: 390rpx;
	height: 220rpx;
	border-radius: 50%;
	opacity: 0.08;
	background: #7dc7ff;
	animation: floatOval 22s ease-in-out infinite;
}

.page__shape--triangle {
	top: 596rpx;
	right: 82rpx;
	width: 236rpx;
	height: 206rpx;
	border-radius: 42rpx;
	opacity: 0.06;
	background: #8fa6ff;
	clip-path: polygon(50% 0, 100% 100%, 0 100%);
	-webkit-clip-path: polygon(50% 0, 100% 100%, 0 100%);
	animation: floatTriangle 20s ease-in-out infinite;
}

.page__shape--block {
	left: 50%;
	bottom: 54rpx;
	width: 300rpx;
	height: 170rpx;
	border-radius: 58rpx 92rpx 66rpx 104rpx;
	opacity: 0.06;
	background: #9b8cff;
	transform: translateX(-50%) rotate(-8deg);
	animation: floatBlock 25s ease-in-out infinite;
}

.brand {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	padding: 12rpx 0 42rpx;
}

.brand__logo {
	flex-shrink: 0;
	width: 80rpx;
	height: 80rpx;
	margin-right: 22rpx;
	border-radius: 0;
	box-shadow: none;
}

.brand__content {
	min-width: 0;
}

.brand__title {
	font-size: 40rpx;
	font-weight: 700;
	line-height: 1.2;
	color: #102a43;
	word-break: break-word;
}

.brand__subtitle {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.35;
	color: #627d98;
	word-break: break-word;
}

.app-hall {
	position: relative;
	z-index: 1;
}

.app-hall__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.app-hall__title {
	font-size: 32rpx;
	font-weight: 700;
	line-height: 1.25;
	color: #102a43;
}

.app-hall__marker {
	width: 54rpx;
	height: 6rpx;
	border-radius: 999rpx;
	background: #1685f5;
	opacity: 0.24;
}

.module-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 24rpx;
}

.module-card {
	position: relative;
	isolation: isolate;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	flex: 0 1 calc(50% - 12rpx);
	width: calc(50% - 12rpx);
	height: 292rpx;
	box-sizing: border-box;
	padding: 30rpx 28rpx 28rpx;
	overflow: hidden;
	border-radius: 18rpx;
	border: 1rpx solid rgba(72, 224, 173, 0.68);
	background:
		radial-gradient(circle at 100% 50%, rgba(72, 224, 173, 0.28), rgba(255, 255, 255, 0) 42%),
		radial-gradient(circle at 0% 50%, rgba(72, 224, 173, 0.16), rgba(255, 255, 255, 0) 48%),
		linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.98) 58%, rgba(236, 245, 252, 0.98));
	box-shadow:
		0 18rpx 40rpx rgba(3, 18, 42, 0.2),
		0 0 24rpx rgba(72, 224, 173, 0.18),
		0 1rpx 0 rgba(255, 255, 255, 0.08) inset;
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.module-card::before {
	position: absolute;
	top: 30rpx;
	left: 32rpx;
	z-index: 1;
	width: 74rpx;
	height: 6rpx;
	border-radius: 999rpx;
	content: '';
	background: linear-gradient(90deg, var(--module-accent, #1685f5), rgba(255, 255, 255, 0));
	pointer-events: none;
}

.module-card::after {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 0;
	width: 100%;
	height: 100%;
	content: '';
	background:
		linear-gradient(108deg, rgba(255, 255, 255, 0) 0 72%, rgba(255, 255, 255, 0.04) 72% 100%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 42%);
	pointer-events: none;
}

.module-card--pressed {
	transform: translateY(2rpx) scale(0.98);
	box-shadow:
		0 10rpx 24rpx rgba(30, 80, 140, 0.09),
		0 1rpx 0 rgba(255, 255, 255, 0.42) inset;
	filter: saturate(0.96);
}

.module-card--disabled {
	opacity: 0.72;
}

.module-card__icon {
	position: relative;
	z-index: 1;
	width: 88rpx;
	height: 88rpx;
	margin-top: 46rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 76rpx;
	font-weight: 800;
	line-height: 1;
	color: var(--module-accent, #48e0ad);
	background: transparent;
	border: none;
	box-shadow: none;
	outline: none;
	text-shadow: none;
}

.module-card__icon .iconfont {
	font-size: inherit;
	line-height: 1;
}

.module-card__icon image {
	opacity: 1;
	filter: none;
}

.module-card--integrated .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card--device .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card--new-energy .module-card__icon,
.module-card--new .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card--storage .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card--charge .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card--building .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card--water .module-card__icon {
	color: var(--module-accent, #48e0ad);
}

.module-card__body {
	width: 100%;
	position: relative;
	z-index: 1;
	max-width: 100%;
	margin-top: 22rpx;
}

.module-card__title {
	font-size: 36rpx;
	font-weight: 800;
	line-height: 1.25;
	color: #102a43;
	word-break: break-word;
	text-shadow: 0 8rpx 18rpx rgba(255, 255, 255, 0.55);
}

.module-card__entry {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	position: relative;
	z-index: 1;
	margin-top: auto;
	width: 100%;
	box-sizing: border-box;
	font-size: 24rpx;
	font-weight: 700;
	line-height: 1.35;
	color: var(--module-accent, #1685f5);
	white-space: nowrap;
}

.module-card__entry-icon {
	margin-left: 4rpx;
}

.module-card--disabled .module-card__entry {
	color: #829ab1;
}

@keyframes floatCircle {
	0%,
	100% {
		transform: translate(0, 0);
	}

	50% {
		transform: translate(-58rpx, 72rpx);
	}
}

@keyframes floatOval {
	0%,
	100% {
		transform: translate(0, 0) rotate(-8deg);
	}

	50% {
		transform: translate(78rpx, -48rpx) rotate(8deg);
	}
}

@keyframes floatTriangle {
	0%,
	100% {
		transform: translate(0, 0) rotate(12deg);
	}

	50% {
		transform: translate(-58rpx, 68rpx) rotate(-12deg);
	}
}

@keyframes floatBlock {
	0%,
	100% {
		transform: translateX(-50%) translateY(0) rotate(-8deg);
	}

	50% {
		transform: translateX(-50%) translateY(-86rpx) rotate(12deg);
	}
}
</style>
