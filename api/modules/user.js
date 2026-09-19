import {
	新能源基础地址,
	登录有效时间,
	读取登录过期时间,
	统一请求,
	提取响应数据,
	读取对象字段,
	解析Json,
	是否普通对象
} from '../base.js'

const 用户信息缓存键 = '用户信息'
const 用户权限缓存键 = '用户权限'
const 新能源用户权限缓存键 = '新能源用户权限'
const 操作权限缓存键 = '操作权限'
const 应用模块缓存键 = '应用模块列表'
const 报警详情临时缓存键 = '报警详情临时缓存'
const 旧报警详情缓存前缀 = '报警详情:'
const 新能源权限缓存键列表 = [
	新能源用户权限缓存键,
	操作权限缓存键,
	'区域1ID',
	'区域1层级',
	'区域2ID',
	'区域2层级',
	'区域3ID',
	'区域3层级'
]
function 读取登录结果(响应数据) {
	const 登录结果 = 读取对象字段(响应数据, ['结果'])

	return 是否普通对象(登录结果) ? 登录结果 : {}
}

function 标准化应用ID列表(应用ID) {
	const 应用ID列表 = 解析Json(应用ID, [])

	if (Array.isArray(应用ID列表)) {
		return 应用ID列表
	}

	return 应用ID列表 === undefined || 应用ID列表 === null || 应用ID列表 === '' ? [] : [应用ID列表]
}

function 解析登录应用ID列表(响应数据) {
	const 登录结果 = 读取登录结果(响应数据)
	const 应用ID = 响应数据.应用ID || 登录结果.应用ID || 响应数据.appIds || 登录结果.appIds

	return 标准化应用ID列表(应用ID)
}

function 读取登录Token(响应数据, 当前用户) {
	const 登录结果 = 读取登录结果(响应数据)

	return 响应数据.token || 登录结果.token || `legacy-token:${当前用户}`
}

function 合并登录用户信息(响应数据, 当前用户) {
	const 登录结果 = 读取登录结果(响应数据)
	const 响应用户信息 = 响应数据.userInfo || 登录结果.userInfo || {}
	const 应用ID列表 = 解析登录应用ID列表(响应数据)
	const 应用ID = 响应数据.应用ID || 登录结果.应用ID || 响应数据.appIds || 登录结果.appIds || ''
	const 当前时间 = Date.now()

	return {
		...登录结果,
		...(响应用户信息 && typeof 响应用户信息 === 'object' && !Array.isArray(响应用户信息) ? 响应用户信息 : {}),
		用户: 当前用户,
		username: 当前用户,
		token: 读取登录Token(响应数据, 当前用户),
		appIds: 应用ID列表,
		应用ID,
		应用ID列表,
		登录时间: 当前时间,
		登录过期时间: 当前时间 + 登录有效时间
	}
}

function 读取当前登录用户(参数 = {}) {
	if (参数.用户) {
		return 参数.用户
	}

	const 用户信息 = uni.getStorageSync(用户信息缓存键) || {}

	return 用户信息.用户 || 用户信息.username || 用户信息.用户名 || ''
}

function 读取缓存用户信息() {
	return uni.getStorageSync(用户信息缓存键) || {}
}

function 读取可见应用ID列表() {
	const 用户信息 = 读取缓存用户信息()
	const 登录结果 = 是否普通对象(用户信息.结果) ? 用户信息.结果 : {}
	const 应用ID = 用户信息.appIds || 用户信息.应用ID列表 || 用户信息.应用ID || 登录结果.应用ID || []

	return 标准化应用ID列表(应用ID)
}

function 读取有效权限值(值) {
	if (值 === undefined || 值 === null) {
		return ''
	}

	if (typeof 值 === 'string') {
		const 文本 = 值.trim()

		return !文本 || 文本 === 'null' || 文本 === 'undefined' ? '' : 文本
	}

	return 值
}

function 转为权限缓存值(值) {
	const 有效值 = 读取有效权限值(值)

	if (有效值 === '') {
		return ''
	}

	return typeof 有效值 === 'string' ? 有效值 : JSON.stringify(有效值)
}

function 写入本地权限缓存(缓存键, 值) {
	uni.setStorageSync(缓存键, 转为权限缓存值(值))
}

function 写入操作权限缓存(值) {
	const 缓存值 = 转为权限缓存值(值)

	if (!缓存值) {
		uni.removeStorageSync(操作权限缓存键)
		return
	}

	uni.setStorageSync(操作权限缓存键, 缓存值)
}

function 缓存新能源用户权限(权限数据 = {}) {
	const 缓存用户信息 = 读取缓存用户信息()

	uni.setStorageSync(新能源用户权限缓存键, 权限数据)
	写入操作权限缓存(权限数据.操作)
	写入本地权限缓存('区域1ID', 权限数据.区域1ID)
	写入本地权限缓存('区域1层级', 权限数据.区域1层级)
	写入本地权限缓存('区域2ID', 权限数据.区域2ID)
	写入本地权限缓存('区域2层级', 权限数据.区域2层级)
	写入本地权限缓存('区域3ID', 权限数据.区域3ID)
	写入本地权限缓存('区域3层级', 权限数据.区域3层级)

	// 同步写回用户信息，后续业务页可从登录态或独立缓存中读取区域权限。
	if (缓存用户信息 && typeof 缓存用户信息 === 'object' && !Array.isArray(缓存用户信息)) {
		uni.setStorageSync(用户信息缓存键, {
			...缓存用户信息,
			操作权限: 权限数据.操作,
			区域1ID: 转为权限缓存值(权限数据.区域1ID),
			区域1层级: 转为权限缓存值(权限数据.区域1层级),
			区域2ID: 转为权限缓存值(权限数据.区域2ID),
			区域2层级: 转为权限缓存值(权限数据.区域2层级),
			区域3ID: 转为权限缓存值(权限数据.区域3ID),
			区域3层级: 转为权限缓存值(权限数据.区域3层级)
		})
	}
}

function 判断登录状态有效() {
	const 用户信息 = 读取缓存用户信息()
	const 当前用户 = 用户信息.用户 || 用户信息.username || 用户信息.用户名
	const 登录过期时间 = 读取登录过期时间(用户信息)

	if (!当前用户 || !用户信息.token || !登录过期时间) {
		return false
	}

	return Date.now() < 登录过期时间
}

function 清理权限相关缓存() {
	uni.removeStorageSync(用户权限缓存键)
	uni.removeStorageSync(应用模块缓存键)
	uni.removeStorageSync(报警详情临时缓存键)
	新能源权限缓存键列表.forEach((缓存键) => {
		uni.removeStorageSync(缓存键)
	})

	// 升级后顺带移除历史按报警 ID 生成的键，避免旧版本已累积的数据继续占用 Storage。
	if (typeof uni.getStorageInfoSync === 'function') {
		try {
			const 存储信息 = uni.getStorageInfoSync() || {}
			const 缓存键列表 = Array.isArray(存储信息.keys) ? 存储信息.keys : []

			缓存键列表.forEach((缓存键) => {
				if (缓存键.startsWith(旧报警详情缓存前缀)) {
					uni.removeStorageSync(缓存键)
				}
			})
		} catch (错误) {
			// 历史数据迁移失败不应阻断登录或退出流程。
		}
	}
}

function 清理登录状态() {
	// 登录过期或用户主动退出时清掉本地登录态，避免继续使用旧 token 和旧模块缓存。
	uni.removeStorageSync(用户信息缓存键)
	清理权限相关缓存()
}

function 退出登录() {
	清理登录状态()
}

async function login(登录参数 = {}) {
	const 响应数据 = await 统一请求({
		url: '/登录',
		method: 'POST',
		data: {
			用户: 登录参数.用户,
			密码: 登录参数.密码
		}
	})

	if (响应数据.状态 && 响应数据.状态 !== '成功') {
		const 提示 = 响应数据.提示 || '登录失败'

		uni.showToast({
			title: 提示,
			icon: 'none'
		})
		throw new Error(提示)
	}

	// 切换账号后清理旧权限和旧应用缓存，避免不同账号之间串用数据
	清理权限相关缓存()

	const 缓存用户信息 = 合并登录用户信息(响应数据, 登录参数.用户)

	// 保存 7 天有效的本地登录态，未过期时下次进入小程序可直接进入模块页。
	uni.setStorageSync(用户信息缓存键, 缓存用户信息)

	return 缓存用户信息
}

async function 获取用户权限(参数 = {}) {
	const 用户 = 读取当前登录用户(参数)

	const 响应数据 = await 统一请求({
		url: '/获取权限',
		method: 'POST',
		// 获取权限接口后端读取 request.POST['用户']，必须用POST表单携带当前登录用户
		data: {
			用户
		}
	})
	const 权限数据 = 提取响应数据(响应数据)

	// 缓存权限数据，避免后续页面重复请求，提高页面响应速度
	uni.setStorageSync(用户权限缓存键, 权限数据)

	return 权限数据
}

async function 获取新能源用户权限(参数 = {}) {
	const 用户 = 读取当前登录用户(参数)

	if (!用户) {
		throw new Error('未获取到当前登录用户')
	}

	const 响应数据 = await 统一请求({
		url: '/获取权限',
		method: 'POST',
		baseURL: 新能源基础地址,
		// 新能源权限接口和管理端一致，请求当前用户后返回操作权限与区域可见范围。
		data: {
			用户
		}
	})
	const 权限数据 = 提取响应数据(响应数据)

	缓存新能源用户权限(权限数据)

	return 权限数据
}

const 用户接口 = {
	login,
	获取用户权限,
	获取新能源用户权限,
	判断登录状态有效,
	清理登录状态,
	退出登录,
	读取缓存用户信息,
	读取可见应用ID列表
}

export {
	用户接口
}
