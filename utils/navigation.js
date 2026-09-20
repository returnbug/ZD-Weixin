const 重复导航间隔 = 500
let 上次导航类型 = ''
let 上次导航地址 = ''
let 上次导航时间 = 0

function 是否重复导航(导航类型, 导航地址) {
	const 当前时间 = Date.now()
	const 是否重复 = 上次导航类型 === 导航类型 &&
		上次导航地址 === 导航地址 &&
		当前时间 - 上次导航时间 < 重复导航间隔

	if (是否重复) {
		return true
	}

	// 只拦截同类型、同完整地址的短时间重复导航，不影响用户切换到其他目标。
	上次导航类型 = 导航类型
	上次导航地址 = 导航地址
	上次导航时间 = 当前时间
	return false
}

function 拼接查询参数(参数 = {}) {
	const 查询 = Object.keys(参数)
		.filter((键) => 参数[键] !== undefined && 参数[键] !== null && 参数[键] !== '')
		.map((键) => `${encodeURIComponent(键)}=${encodeURIComponent(参数[键])}`)
		.join('&')

	return 查询 ? `?${查询}` : ''
}

function 解析路由参数(参数 = {}) {
	// 真机可能保留编码后的参数名和值；只解码一层，并兼容旧的中文参数名。
	function 解码(值) {
		if (typeof 值 !== 'string') {
			return 值
		}

		try {
			return decodeURIComponent(值)
		} catch (错误) {
			// 原始文本含有不完整的百分号编码时保留原值，避免中断页面初始化。
			return 值
		}
	}

	const 路由参数 = {}
	Object.keys(参数).forEach((键) => {
		路由参数[解码(键)] = 解码(参数[键])
	})
	return 路由参数
}

function 跳转页面(路径, 参数 = {}) {
	const 导航地址 = `${路径}${拼接查询参数(参数)}`

	if (是否重复导航('navigateTo', 导航地址)) {
		return
	}

	uni.navigateTo({
		url: 导航地址
	})
}

function 切换标签页(路径) {
	if (是否重复导航('switchTab', 路径)) {
		return
	}

	uni.switchTab({
		url: 路径
	})
}

function 重启页面(路径) {
	if (是否重复导航('reLaunch', 路径)) {
		return
	}

	uni.reLaunch({
		url: 路径
	})
}

function 返回上一页() {
	uni.navigateBack()
}

export {
	拼接查询参数,
	解析路由参数,
	跳转页面,
	切换标签页,
	重启页面,
	返回上一页
}
