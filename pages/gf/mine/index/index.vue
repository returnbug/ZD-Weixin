<template>
	<view class="page">
		<view class="profile-card">
			<view class="profile-card__avatar">{{ 用户头像文字 }}</view>
			<view class="profile-card__main">
				<view class="profile-card__name">{{ 用户.名称 }}</view>
				<view class="profile-card__role">{{ 用户.角色 }}</view>
				<view class="profile-card__info">
					<view class="profile-card__row">
						<text>所属商家</text>
						<text>{{ 用户.所属商家 }}</text>
					</view>
					<view class="profile-card__row">
						<text>所属公司</text>
						<text>{{ 用户.所属公司 }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="entry-panel">
			<view class="panel-title">我的功能</view>
			<view class="entry-list">
				<view
					v-for="entry in 功能入口"
					:key="entry.标题"
					class="entry-item"
					:class="{ 'entry-item--danger': entry.类型 === 'logout' }"
					@click="打开入口(entry)"
				>
					<view>
						<view class="entry-item__title">{{ entry.标题 }}</view>
						<view v-if="entry.描述" class="entry-item__desc">{{ entry.描述 }}</view>
					</view>
					<view class="entry-item__arrow">›</view>
				</view>
			</view>
		</view>
		<AppTabbar current="mine" />
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import AppTabbar from '@/components/app-tabbar/app-tabbar.vue'
import { 用户接口, 读取首个有效字段, 转为文本, 是否普通对象 } from '@/api/index.js'
import { 用户信息 as 默认用户信息, 我的入口列表 } from '@/config/page-data.js'
import { 跳转页面, 重启页面 } from '@/utils/navigation.js'
import { 显示建设中提示 } from '@/utils/toast.js'

const 用户 = ref({
	名称: '',
	角色: '',
	所属商家: '',
	所属公司: ''
})
const 功能入口 = ref([])
let 退出确认显示中 = false
const 返回平台入口 = { 标题: '返回平台', 描述: '返回应用平台首页', 类型: 'platform' }
const 退出登录入口 = { 标题: '退出登录', 类型: 'logout' }
const 用户展示字段映射 = {
	名称: ['名称', '姓名', '昵称', '用户名称', '用户名', '用户'],
	角色: ['角色', '角色名称', '岗位', '职位', '权限'],
	所属商家: ['所属商家', '商家', '商家名称'],
	所属公司: ['所属公司', '公司', '公司名称', '企业名称', '组织名称']
}
const 用户头像文字 = computed(() => 用户.value.名称.slice(0, 1).toUpperCase())

function 初始化页面() {
	功能入口.value = [...我的入口列表, 返回平台入口, 退出登录入口]
}

function 读取缓存字段(缓存用户信息, 字段列表 = []) {
	const 候选用户信息 = [
		缓存用户信息,
		缓存用户信息.userInfo,
		缓存用户信息.用户信息,
		缓存用户信息.结果
	].filter(是否普通对象)

	for (const 用户信息 of 候选用户信息) {
		const 字段值 = 转为文本(读取首个有效字段(用户信息, 字段列表))

		if (字段值) {
			return 字段值
		}
	}

	return ''
}

function 生成用户展示信息() {
	const 缓存用户信息 = 用户接口.读取缓存用户信息()

	// 登录接口返回结构存在多种中文/英文字段，这里只做展示字段的兼容读取。
	return {
		名称:
			读取缓存字段(缓存用户信息, 用户展示字段映射.名称) ||
			默认用户信息.名称,
		角色:
			读取缓存字段(缓存用户信息, 用户展示字段映射.角色) ||
			默认用户信息.角色,
		所属商家:
			读取缓存字段(缓存用户信息, 用户展示字段映射.所属商家) ||
			默认用户信息.所属商家,
		所属公司:
			读取缓存字段(缓存用户信息, 用户展示字段映射.所属公司) ||
			默认用户信息.所属公司
	}
}

function 刷新用户信息() {
	if (!用户接口.判断登录状态有效()) {
		用户接口.清理登录状态()
		重启页面('/pages/login/index')
		return
	}

	用户.value = 生成用户展示信息()
}

function 打开入口(入口) {
	switch (入口.类型) {
		case 'settings':
			跳转页面('/pages/gf/mine/settings/index')
			break
		case 'platform':
			返回平台()
			break
		case 'logout':
			确认退出登录()
			break
		default:
			显示建设中提示('功能入口待接入')
	}
}

function 返回平台() {
	// 直接进入应用模块页，由该页面统一检查登录态，避免经过登录页中转。
	重启页面('/pages/login/module')
}

function 确认退出登录() {
	if (退出确认显示中) {
		return
	}

	退出确认显示中 = true
	uni.showModal({
		title: '退出登录',
		content: '是否确认退出当前账号？',
		confirmText: '退出',
		confirmColor: '#d92d20',
		cancelText: '取消',
		success(结果) {
			if (!结果.confirm) {
				return
			}

			用户接口.退出登录()
			重启页面('/pages/login/index')
		},
		complete() {
			// success 和 fail 都从 complete 释放，防止异常路径留下永久点击锁。
			退出确认显示中 = false
		}
	})
}

onLoad(() => {
	初始化页面()
})

onShow(() => {
	刷新用户信息()
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

.profile-card {
	display: flex;
	align-items: flex-start;
	padding: 30rpx;
	border-radius: 18rpx;
	background: linear-gradient(135deg, #1677ff, #12b76a);
	color: #ffffff;
}

.profile-card__avatar {
	flex-shrink: 0;
	width: 96rpx;
	height: 96rpx;
	border-radius: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	background: rgba(255, 255, 255, 0.2);
	font-size: 42rpx;
	font-weight: 800;
}

.profile-card__main {
	flex: 1;
	min-width: 0;
}

.profile-card__name {
	font-size: 36rpx;
	font-weight: 800;
	word-break: break-word;
}

.profile-card__role {
	margin-top: 8rpx;
	font-size: 24rpx;
	opacity: 0.86;
}

.profile-card__info {
	margin-top: 20rpx;
	padding-top: 18rpx;
	border-top: 1rpx solid rgba(255, 255, 255, 0.24);
}

.profile-card__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.4;
}

.profile-card__row:first-child {
	margin-top: 0;
}

.profile-card__row text:first-child {
	flex-shrink: 0;
	opacity: 0.78;
}

.profile-card__row text:last-child {
	min-width: 0;
	text-align: right;
	font-weight: 700;
	word-break: break-word;
}

.entry-panel {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 18rpx;
	background: #ffffff;
	border: 1rpx solid #edf2f7;
	box-shadow: 0 8rpx 24rpx rgba(16, 24, 40, 0.06);
}

.panel-title {
	font-size: 32rpx;
	font-weight: 800;
	color: #101828;
}

.entry-list {
	margin-top: 16rpx;
}

.entry-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid #edf2f7;
}

.entry-item:last-child {
	border-bottom: 0;
}

.entry-item > view:first-child {
	min-width: 0;
}

.entry-item__title {
	font-size: 28rpx;
	font-weight: 800;
	color: #101828;
	word-break: break-word;
}

.entry-item__desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #667085;
	word-break: break-word;
}

.entry-item--danger .entry-item__title,
.entry-item--danger .entry-item__arrow {
	color: #d92d20;
}

.entry-item__arrow {
	flex-shrink: 0;
	font-size: 44rpx;
	line-height: 1;
	color: #98a2b3;
}
</style>
