<template>
	<view class="page">
		<view class="page__grid"></view>
		<view class="page__glow page__glow--top"></view>
		<view class="page__glow page__glow--bottom"></view>
		<view class="page__line page__line--one"></view>
		<view class="page__line page__line--two"></view>

		<view class="login-shell">
			<view class="brand">
				<image class="brand__logo" src="/static/images/logo.png" mode="widthFix" />
				<view class="brand__name">筑电数字</view>
				<view class="brand__desc">
					<text>智慧工厂</text>
					<view class="brand__dot"></view>
					<text>工业互联网平台</text>
				</view>
			</view>

			<view class="login-card">
				<view class="login-card__title">账号登录</view>
				<view class="login-card__desc">统一进入智慧工厂、能源管理与工业互联网平台。</view>

				<view class="login-form">
					<view class="login-field">
						<input
							v-model="登录账号"
							class="login-input"
							placeholder="请输入账号"
							placeholder-class="login-input__placeholder"
						/>
					</view>
					<view class="login-field login-field--password">
						<input
							v-model="登录密码"
							class="login-input login-input--password"
							:password="!显示密码"
							placeholder="请输入密码"
							placeholder-class="login-input__placeholder"
						/>
						<view class="login-password-toggle" @click="切换密码显示">
							<uni-icons
								:type="显示密码 ? 'eye' : 'eye-slash'"
								size="40rpx"
								color="#829AB1"
							></uni-icons>
						</view>
					</view>
					<button class="login-button" hover-class="login-button--hover" @click="登录平台">登录</button>
				</view>
			</view>

			<view class="login-support">技术支持 · 筑电数字工业互联网平台</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { 用户接口 } from '@/api/index.js'
import { 重启页面 } from '@/utils/navigation.js'

const 登录账号 = ref('')
const 登录密码 = ref('')
const 显示密码 = ref(false)
const 正在登录 = ref(false)
// 登录请求返回时页面可能已跳转，避免卸载后继续回写按钮状态。
let 页面有效 = true

function 初始化页面() {
	if (用户接口.判断登录状态有效()) {
		// 本地登录态未过期时直接进入应用模块页，避免用户重复输入账号密码。
		重启页面('/pages/login/module')
		return
	}

	用户接口.清理登录状态()

	uni.setNavigationBarTitle({
		title: '登录'
	})
	uni.setNavigationBarColor({
		frontColor: '#000000',
		backgroundColor: '#F7FBFF'
	})
}

function 显示登录提示(标题) {
	uni.showToast({
		title: 标题,
		icon: 'none'
	})
}

function 切换密码显示() {
	显示密码.value = !显示密码.value
}

async function 登录平台() {
	if (正在登录.value) {
		return
	}

	if (!登录账号.value.trim() || !登录密码.value) {
		显示登录提示('请输入账号和密码')
		return
	}

	正在登录.value = true

	try {
		const 当前登录用户 = 登录账号.value.trim()

		await 用户接口.login({
			用户: 当前登录用户,
			密码: 登录密码.value
		})
		// 对齐 public 登录流程：可见应用 ID 已由登录接口返回并缓存，模块页直接按 appIds 过滤。
		重启页面('/pages/login/module')
	} catch (错误) {
		// 请求层已统一处理错误提示，这里只阻止页面事件抛出未处理异常
	} finally {
		if (页面有效) {
			正在登录.value = false
		}
	}
}

onLoad(() => {
	页面有效 = true
	初始化页面()
})

onUnload(() => {
	页面有效 = false
})
</script>

<style>
.page {
	position: relative;
	overflow: hidden;
	box-sizing: border-box;
	height: 100vh;
	padding: 56rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
	background:
		radial-gradient(circle at 16% 12%, rgba(40, 199, 232, 0.12) 0, rgba(40, 199, 232, 0) 34%),
		radial-gradient(circle at 90% 24%, rgba(22, 133, 245, 0.1) 0, rgba(22, 133, 245, 0) 30%),
		linear-gradient(180deg, #F7FBFF 0%, #F5FAFF 42%, #EAF7FF 74%, #DCEEFF 100%);
}

.page__grid,
.page__glow,
.page__line {
	position: absolute;
	pointer-events: none;
}

.page__grid {
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	opacity: 0.04;
	background-image:
		linear-gradient(rgba(40, 150, 220, 0.16) 1rpx, transparent 1rpx),
		linear-gradient(90deg, rgba(40, 150, 220, 0.16) 1rpx, transparent 1rpx);
	background-size: 72rpx 72rpx;
}

.page__glow {
	width: 420rpx;
	height: 420rpx;
	border-radius: 50%;
	opacity: 0.1;
	background: radial-gradient(circle, rgba(40, 199, 232, 0.72), rgba(40, 199, 232, 0));
}

.page__glow--top {
	top: -180rpx;
	left: -180rpx;
}

.page__glow--bottom {
	right: -220rpx;
	bottom: 120rpx;
	background: radial-gradient(circle, rgba(22, 133, 245, 0.54), rgba(22, 133, 245, 0));
}

.page__line {
	width: 2rpx;
	height: 520rpx;
	opacity: 0.1;
	background: linear-gradient(180deg, rgba(40, 150, 220, 0), rgba(40, 150, 220, 0.1), rgba(40, 150, 220, 0));
	transform: rotate(28deg);
}

.page__line--one {
	top: 16rpx;
	right: 184rpx;
}

.page__line--two {
	left: 74rpx;
	bottom: -160rpx;
}

.login-shell {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	height: 100%;
	width: 100%;
	max-width: 680rpx;
	margin: 0 auto;
}

.brand {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 38rpx;
	text-align: center;
}

.brand__logo {
	width: 150rpx;
}

.brand__name {
	margin-top: 22rpx;
	font-size: 36rpx;
	line-height: 1.2;
	font-weight: 700;
	color: #12344D;
}

.brand__desc {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.5;
	color: #607D94;
	word-break: break-word;
}

.brand__dot {
	flex: none;
	margin: 0 12rpx;
	width: 6rpx;
	height: 6rpx;
	border-radius: 999rpx;
	background: #12344D;
}

.login-card {
	box-sizing: border-box;
	width: 100%;
	margin-top: 64rpx;
	padding: 40rpx 32rpx 36rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.75);
	border: 1rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 0 12rpx 40rpx rgba(30, 100, 150, 0.12);
	-webkit-backdrop-filter: blur(20rpx);
	backdrop-filter: blur(20rpx);
}

.login-card__title {
	font-size: 36rpx;
	line-height: 1.25;
	font-weight: 700;
	color: #102A43;
}

.login-card__desc {
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.6;
	color: #627D98;
	word-break: break-word;
}

.login-form {
	margin-top: 32rpx;
}

.login-field {
	box-sizing: border-box;
	height: 96rpx;
	margin-bottom: 24rpx;
	border-radius: 16rpx;
}

.login-field--password {
	position: relative;
}

.login-input {
	box-sizing: border-box;
	width: 100%;
	height: 96rpx;
	padding: 0 28rpx;
	border-radius: 16rpx;
	background: rgba(255, 255, 255, 0.9);
	border: 1rpx solid #D9E8F5;
	font-size: 28rpx;
	color: #243B53;
}

.login-input--password {
	padding-right: 96rpx;
}

.login-input__placeholder {
	font-size: 26rpx;
	color: #829AB1;
}

.login-password-toggle {
	position: absolute;
	top: 50%;
	right: 20rpx;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	transform: translateY(-50%);
}

.login-button {
	width: 100%;
	height: 96rpx;
	margin-top: 8rpx;
	padding: 0;
	border-radius: 48rpx;
	line-height: 96rpx;
	background: linear-gradient(90deg, #28C7E8 0%, #1685F5 100%);
	box-shadow: 0 8rpx 20rpx rgba(22, 133, 245, 0.25);
	color: #FFFFFF;
	font-size: 32rpx;
	font-weight: 700;
}

.login-button::after {
	border: 0;
}

.login-button--hover {
	opacity: 0.9;
}

.login-support {
	margin-top: auto;
	padding-top: 48rpx;
	text-align: center;
	font-size: 24rpx;
	line-height: 1.5;
	color: #829AB1;
}
</style>
