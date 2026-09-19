<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {})
onShow(() => {})
onHide(() => {})
</script>

<style lang="scss">
@import '@/uni_modules/uni-scss/index.scss';

page {
	min-height: 100%;
	background-color: #f5f7fa;
	color: #1d2939;
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

view,
text,
button,
input {
	box-sizing: border-box;
}

button {
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	line-height: 1;
}

button::after {
	border: 0;
}
</style>
