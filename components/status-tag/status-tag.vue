<template>
	<text class="status-tag" :class="标签类型">{{ text || status }}</text>
</template>

<script setup>
import { computed } from 'vue'

const 成功状态列表 = ['在线', '正常', '无报警', '已恢复', '已开通']
const 警告状态列表 = ['部分离线', '有离线', '离线', '发生中', '重要']
const 危险状态列表 = ['严重', '有告警', '有报警']

const props = defineProps({
	status: {
		type: String,
		default: ''
	},
	text: {
		type: String,
		default: ''
	}
})

const 标签类型 = computed(() => {
	if (成功状态列表.includes(props.status)) {
		return 'status-tag--success'
	}

	if (警告状态列表.includes(props.status)) {
		return 'status-tag--warning'
	}

	if (危险状态列表.includes(props.status)) {
		return 'status-tag--danger'
	}

	return 'status-tag--muted'
})
</script>

<style>
.status-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	max-width: 100%;
	min-width: 88rpx;
	padding: 6rpx 14rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 600;
	line-height: 1.4;
	white-space: nowrap;
}

.status-tag--success {
	color: #027a48;
	background: #ecfdf3;
}

.status-tag--warning {
	color: #b54708;
	background: #fffaeb;
}

.status-tag--danger {
	color: #b42318;
	background: #fef3f2;
}

.status-tag--muted {
	color: #475467;
	background: #f2f4f7;
}
</style>
