<template>
	<view class="login-page">
		<!-- 生成图只负责装饰；品牌、文案和表单均为独立页面元素。 -->
		<view class="login-art login-art--hero" aria-hidden="true">
			<image class="login-art__image login-art__image--hero" src="/static/images/login-energy-background.jpg" mode="widthFix" />
		</view>
		<view class="login-art login-art--footer" aria-hidden="true">
			<image class="login-art__image login-art__image--footer" src="/static/images/login-energy-background.jpg" mode="widthFix" />
		</view>

		<view class="login-shell">
			<view class="login-hero">
				<view class="brand">
					<image class="brand__logo" src="/static/images/logo.png" mode="widthFix" />
					<view class="brand__content">
						<view class="brand__name">筑电数字</view>
						<view class="brand__desc">
							<text>智慧工厂</text>
							<view class="brand__dot"></view>
							<text>工业互联网平台</text>
						</view>
					</view>
				</view>

				<view class="login-hero__copy">
					<view class="login-hero__headline">连接能源</view>
					<view class="login-hero__headline">智造未来</view>
					<view class="login-hero__rule"></view>
					<view class="login-hero__caption">以数字之力</view>
					<view class="login-hero__caption">让工业更高效</view>
				</view>
			</view>

			<view class="login-card">
				<view class="login-card__title">账号登录</view>
				<view class="login-card__desc">统一进入智慧工厂、能源管理与工业互联网平台。</view>

				<view class="login-form">
					<view class="login-field">
						<view class="login-field__label">账号</view>
						<input
							v-model="登录账号"
							class="login-input"
							placeholder="请输入账号"
							placeholder-class="login-input__placeholder"
						/>
					</view>
					<view class="login-field login-field--password">
						<view class="login-field__label">密码</view>
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
								color="#7894BB"
							></uni-icons>
						</view>
					</view>
					<button class="login-button" hover-class="login-button--hover" @click="登录平台">
						<text>登录</text>
					</button>
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

<style scoped>
.login-page {
	position: relative;
	overflow: hidden;
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	/* 矮屏和键盘弹出时允许内容自然撑高，表单仍可滚动到达。 */
	min-height: 100vh;
	background: #F7FBFF;
	color: #102D6C;
}

.login-art {
	position: absolute;
	left: 0;
	width: 100%;
	overflow: hidden;
	pointer-events: none;
}

.login-art--hero {
	top: 0;
	height: 650rpx;
}

.login-art--hero::after {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	height: 40rpx;
	content: '';
	background: linear-gradient(180deg, rgba(247, 251, 255, 0), #F7FBFF);
}

.login-art--footer {
	bottom: 0;
	height: 248rpx;
}

.login-art--footer::after {
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	height: 48rpx;
	content: '';
	background: linear-gradient(180deg, #F7FBFF, rgba(247, 251, 255, 0));
}

.login-art__image {
	position: absolute;
	left: 0;
	display: block;
	width: 100%;
}

.login-art__image--hero {
	top: 0;
}

.login-art__image--footer {
	bottom: 0;
}

.login-shell {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	width: 100%;
	min-height: 100vh;
}

.login-hero {
	position: relative;
	flex: none;
	box-sizing: border-box;
	height: 620rpx;
	padding: 40rpx 54rpx 0;
}

.brand {
	display: flex;
	align-items: center;
}

.brand__logo {
	flex: none;
	width: 76rpx;
	margin-right: 16rpx;
}

.brand__content {
	min-width: 0;
}

.brand__name {
	font-size: 34rpx;
	line-height: 1.25;
	font-weight: 700;
	letter-spacing: 2rpx;
	color: #102D6C;
}

.brand__desc {
	display: flex;
	align-items: center;
	margin-top: 6rpx;
	font-size: 20rpx;
	line-height: 1.5;
	color: #5477A9;
	white-space: nowrap;
}

.brand__dot {
	flex: none;
	width: 4rpx;
	height: 4rpx;
	margin: 0 8rpx;
	border-radius: 50%;
	background: #5477A9;
}

.login-hero__copy {
	position: absolute;
	top: 190rpx;
	left: 56rpx;
}

.login-hero__headline {
	font-size: 26rpx;
	font-weight: 500;
	line-height: 1.75;
	letter-spacing: 10rpx;
	color: #1685F5;
}

.login-hero__rule {
	width: 32rpx;
	height: 2rpx;
	margin: 22rpx 0;
	background: #1685F5;
}

.login-hero__caption {
	font-size: 20rpx;
	line-height: 1.7;
	letter-spacing: 3rpx;
	color: #6C8FB9;
}

.login-card {
	box-sizing: border-box;
	width: 100%;
	padding: 0 56rpx;
}

.login-card__title {
	font-size: 56rpx;
	line-height: 1.3;
	font-weight: 700;
	letter-spacing: 2rpx;
	color: #102D6C;
}

.login-card__desc {
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.75;
	color: #5477A9;
	word-break: break-word;
}

.login-form {
	margin-top: 48rpx;
}

.login-field {
	position: relative;
	box-sizing: border-box;
	border-bottom: 1rpx solid #9FBCE0;
}

.login-field + .login-field {
	margin-top: 36rpx;
}

.login-field__label {
	font-size: 24rpx;
	line-height: 1.4;
	font-weight: 500;
	color: #102D6C;
}

.login-input {
	box-sizing: border-box;
	width: 100%;
	height: 72rpx;
	padding: 0;
	background: transparent;
	border: 0;
	border-radius: 0;
	font-size: 28rpx;
	color: #193D71;
}

.login-input--password {
	padding-right: 80rpx;
}

.login-input__placeholder {
	font-size: 28rpx;
	color: #7B98BF;
}

.login-password-toggle {
	position: absolute;
	right: -8rpx;
	bottom: 0;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 72rpx;
	height: 72rpx;
}

.login-button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 88rpx;
	margin-top: 48rpx;
	padding: 0 72rpx;
	border: 0;
	border-radius: 12rpx;
	line-height: 1;
	background: linear-gradient(90deg, #20BED9 0%, #1685F6 100%);
	box-shadow: none;
	color: #FFFFFF;
	font-size: 32rpx;
	font-weight: 600;
	letter-spacing: 4rpx;
}

.login-button::after {
	border: 0;
}

.login-button--hover {
	opacity: 0.9;
}

.login-support {
	margin-top: auto;
	padding: 96rpx 32rpx 36rpx;
	padding-bottom: calc(36rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(36rpx + env(safe-area-inset-bottom));
	text-align: center;
	font-size: 22rpx;
	line-height: 1.5;
	color: #7894BB;
}
</style>
