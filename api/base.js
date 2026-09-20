const 基础地址 = 'https://gg.thezd.cn'
// const 基础地址 = 'http://47.116.199.141:8000/'
const 新能源基础地址 = 'https://gf.thezd.cn'
// const 新能源基础地址 = 'http://47.116.199.141:8003/'
const 请求超时时间 = 250000
const 登录有效时间 = 7 * 24 * 60 * 60 * 1000
const 默认字段名列表 = ['名称', '字段名称', '列名', '字段']

function 拼接请求地址(接口路径 = '', 请求基础地址 = 基础地址) {
	if (/^https?:\/\//.test(接口路径)) {
		return 接口路径
	}

	const 标准基础地址 = (请求基础地址 || 基础地址).replace(/\/$/, '')
	const 标准接口路径 = 接口路径.startsWith('/') ? 接口路径 : `/${接口路径}`

	return `${标准基础地址}${标准接口路径}`
}

function 读取对象字段(对象, 字段列表 = []) {
	if (!对象 || typeof 对象 !== 'object') {
		return undefined
	}

	for (const 字段 of 字段列表) {
		if (Object.prototype.hasOwnProperty.call(对象, 字段)) {
			return 对象[字段]
		}
	}

	return undefined
}

function 是否普通对象(值) {
	return Boolean(值 && typeof 值 === 'object' && !Array.isArray(值))
}

function 转为文本(值, 配置 = {}) {
	const { 去除首尾空格 = true, 对象返回空 = true } = 配置

	if (值 === undefined || 值 === null) {
		return ''
	}

	if (对象返回空 && typeof 值 === 'object') {
		return ''
	}

	const 文本 = String(值)

	return 去除首尾空格 ? 文本.trim() : 文本
}

function 解析Json(值, 默认值) {
	// sb读取的表单、基本信息和表格列表包含 JSON 字符串，统一解析并保留空值兜底。
	if (值 === undefined || 值 === null || 值 === '') {
		return 默认值
	}

	if (typeof 值 !== 'string') {
		return 值
	}

	try {
		return JSON.parse(值)
	} catch (错误) {
		return 默认值
	}
}

function 读取数组(值) {
	const 数据 = 解析Json(值, [])

	return Array.isArray(数据) ? 数据 : []
}

function 读取首个有效字段(对象, 字段列表 = [], 默认值 = '') {
	if (!是否普通对象(对象)) {
		return 默认值
	}

	for (const 字段 of 字段列表) {
		const 值 = 对象[字段]

		if (值 !== undefined && 值 !== null && 值 !== '') {
			return 值
		}
	}

	return 默认值
}

function 读取区域类型值(区域类型 = '') {
	if (是否普通对象(区域类型)) {
		return 转为文本(读取首个有效字段(区域类型, ['ID', 'id', '值', 'value', '名称', 'name', 'label']))
	}

	return 转为文本(区域类型)
}

function 匹配区域类型(区域类型 = '') {
	const 区域类型文本 = 读取区域类型值(区域类型)

	if (区域类型文本 === '1') {
		return '区域1'
	}

	if (区域类型文本 === '2') {
		return '区域2'
	}

	if (区域类型文本 === '3') {
		return '区域3'
	}

	const 匹配结果 = 区域类型文本.match(/区域[123]/)
	return 匹配结果 ? 匹配结果[0] : ''
}

function 标准化区域类型(区域类型 = '', 默认区域类型 = '区域1') {
	return 匹配区域类型(区域类型) || 默认区域类型
}

function 读取默认区域类型(区域类型列表 = [], 默认区域类型 = '区域1') {
	const 下拉列表 = 读取数组(区域类型列表)
	const 候选列表 = 下拉列表.length ? 下拉列表 : [区域类型列表]

	for (const 区域类型 of 候选列表) {
		const 区域类型值 = 匹配区域类型(区域类型)

		if (区域类型值) {
			return 区域类型值
		}
	}

	return 默认区域类型
}

function 读取可见区域ID(区域类型 = '区域1', 默认区域类型 = '区域1') {
	// 新能源权限登录后会把各级区域 ID 写入本地缓存，业务接口用它限制可见数据范围。
	const 可见区域类型 = 标准化区域类型(区域类型, 默认区域类型)
	const 缓存区域ID = uni.getStorageSync(`${可见区域类型}ID`)

	return 转为文本(缓存区域ID)
}

function 新能源请求(接口路径, 请求数据 = {}) {
	return 统一请求({
		url: 接口路径,
		method: 'POST',
		data: 请求数据,
		baseURL: 新能源基础地址
	})
}

function 解析下拉对象(响应数据) {
	const 下拉 = 读取对象字段(响应数据, ['下拉'])

	return 是否普通对象(下拉) ? 下拉 : {}
}

function 解析下拉列表(列表) {
	// 其他下拉的设备类型、恢复状态为文本数组；保留已有对象选项的兼容读取。
	return 读取数组(列表).map((项) => {
		const 值 = 是否普通对象(项)
			? 读取对象字段(项, ['名称', 'name', 'label', '值', 'value', 'ID', 'id'])
			: 项
		return 转为文本(值)
	}).filter(Boolean)
}

function 创建参数缓存键(参数 = {}) {
	if (!是否普通对象(参数)) {
		return JSON.stringify(参数 || {})
	}

	// 接口参数是扁平对象，固定键顺序即可复用同参数请求。
	const 排序参数 = {}
	Object.keys(参数).sort().forEach((键) => {
		排序参数[键] = 参数[键]
	})
	return JSON.stringify(排序参数)
}

function 清空缓存对象(缓存对象) {
	Object.keys(缓存对象).forEach((键) => {
		delete 缓存对象[键]
	})
}

function 读取有效内存缓存(缓存对象, 键, 有效时间) {
	const 缓存 = 缓存对象[键]
	if (缓存 && Date.now() - 缓存.time <= 有效时间) {
		return 缓存.data
	}

	delete 缓存对象[键]
	return null
}

function 复用在途请求(缓存对象, 键, 发送请求) {
	if (!缓存对象[键]) {
		// 只复用进行中的 Promise，成功或失败后都释放；结果是否缓存由业务模块决定。
		const 请求 = 发送请求().finally(() => {
			// 会话切换后同键可能已有新请求，旧请求不能删除它。
			if (缓存对象[键] === 请求) {
				delete 缓存对象[键]
			}
		})
		缓存对象[键] = 请求
	}
	return 缓存对象[键]
}

function 读取字段定义名称(字段, 字段名列表 = []) {
	if (是否普通对象(字段)) {
		return 转为文本(读取首个有效字段(字段, 字段名列表)) || 转为文本(字段.名称)
	}

	return 转为文本(字段)
}

function 解析字段列表(响应数据, 字段名列表 = 默认字段名列表) {
	// gf/bj 字段接口都返回字段定义，统一抽出可用于二维数组映射的真实字段名。
	const 字段 = Array.isArray(响应数据) ? 响应数据 : 读取对象字段(响应数据, ['字段'])

	return 读取数组(字段)
		.map((项) => {
			if (是否普通对象(项)) {
				return {
					...项,
					名称: 读取字段定义名称(项, 字段名列表)
				}
			}

			return {
				名称: 读取字段定义名称(项, 字段名列表)
			}
		})
		.filter((项) => 项.名称)
}

function 读取响应列表数据(响应数据) {
	if (Array.isArray(响应数据)) {
		return 响应数据
	}

	const 数据 = 读取对象字段(响应数据, ['数据', '列表'])

	return 读取数组(数据)
}

function 二维行转对象(行, 字段列表 = []) {
	const 行对象 = {}

	字段列表.forEach((字段, 索引) => {
		const 字段名 = 读取字段定义名称(字段, 默认字段名列表)

		if (字段名) {
			行对象[字段名] = 行[索引]
		}
	})

	return 行对象
}

function 解析数据行列表(响应数据, 字段列表 = [], 文本字段名 = '名称') {
	// 列表接口可能返回对象数组或二维数组，二维数组按字段接口顺序转成对象。
	const 列表 = 读取响应列表数据(响应数据)

	return 列表.map((行) => {
		if (Array.isArray(行)) {
			return 二维行转对象(行, 字段列表)
		}

		if (是否普通对象(行)) {
			return {
				...行
			}
		}

		return {
			[文本字段名]: 转为文本(行)
		}
	})
}

function 读取后端错误信息(响应数据, 默认提示 = '请求失败') {
	return (
		读取对象字段(响应数据, ['message', 'msg', 'error', '提示', '错误信息', '信息']) ||
		默认提示
	)
}

function 判断业务请求成功(响应数据) {
	if (!响应数据 || typeof 响应数据 !== 'object' || Array.isArray(响应数据)) {
		return true
	}

	const 状态码 = 读取对象字段(响应数据, ['code', 'Code', '状态码'])
	if (状态码 !== undefined && 状态码 !== null && 状态码 !== '') {
		return [0, 1, 200, '0', '1', '200', 'success', 'SUCCESS'].includes(状态码)
	}

	const 成功状态 = 读取对象字段(响应数据, ['success', 'Success', '成功'])
	if (成功状态 !== undefined) {
		return 成功状态 !== false
	}

	return true
}

function 提取响应数据(响应数据) {
	if (!响应数据 || typeof 响应数据 !== 'object' || Array.isArray(响应数据)) {
		return 响应数据
	}

	// 对齐 public/src/api/index.ts：公共平台只自动拆一层小写 data，legacy 的 结果/数据 保持原样交给页面解析。
	const 数据 = 读取对象字段(响应数据, ['data'])

	return 数据 !== undefined ? 数据 : 响应数据
}

function 转换Legacy表单值(值) {
	if (Array.isArray(值) || (值 && typeof 值 === 'object')) {
		return JSON.stringify(值)
	}

	return String(值)
}

function 转换Legacy表单数据(数据 = {}) {
	if (!数据 || typeof 数据 !== 'object') {
		return {}
	}

	return Object.entries(数据).reduce((表单数据, [键, 值]) => {
		if (值 === undefined || 值 === null) {
			return 表单数据
		}

		// 对齐 public 的 toFormData：跳过空值，对数组/对象做 JSON.stringify，其余值转字符串。
		表单数据[键] = 转换Legacy表单值(值)
		return 表单数据
	}, {})
}

function 清理Multipart字段名(字段名) {
	return String(字段名).replace(/["\r\n]/g, '')
}

function 创建LegacyMultipart数据(数据 = {}) {
	const 边界 = `----WebKitFormBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
	const 表单数据 = 转换Legacy表单数据(数据)
	const 请求体 = Object.entries(表单数据)
		.map(([键, 值]) => {
			return `--${边界}\r\nContent-Disposition: form-data; name="${清理Multipart字段名(键)}"\r\n\r\n${值}\r\n`
		})
		.join('')

	return {
		contentType: `multipart/form-data; boundary=${边界}`,
		body: `${请求体}--${边界}--\r\n`
	}
}

function 读取登录Token() {
	const 用户信息 = uni.getStorageSync('用户信息') || {}
	const 登录过期时间 = 读取登录过期时间(用户信息)

	if (!登录过期时间 || Date.now() >= 登录过期时间) {
		return ''
	}

	return 用户信息.token || 用户信息.Authorization || ''
}

function 读取登录过期时间(用户信息 = {}) {
	const 登录过期时间 = Number(用户信息.登录过期时间 || 0)

	if (登录过期时间) {
		return 登录过期时间
	}

	const 登录时间 = Number(用户信息.登录时间 || 0)

	return 登录时间 ? 登录时间 + 登录有效时间 : 0
}

function 读取当前缓存会话标识() {
	const 用户信息 = uni.getStorageSync('用户信息') || {}
	const 当前用户 = 转为文本(用户信息.用户 || 用户信息.username || 用户信息.用户名)
	const 登录时间 = Number(用户信息.登录时间 || 0)
	const 登录过期时间 = 读取登录过期时间(用户信息)

	if (!当前用户 || !登录时间 || !登录过期时间 || Date.now() >= 登录过期时间) {
		return ''
	}

	// 用户名与登录时间共同标识一次登录，避免切换账号或重新登录后复用旧业务缓存。
	return `${当前用户}:${登录时间}`
}

function 显示请求错误(提示) {
	uni.showToast({
		title: 提示,
		icon: 'none'
	})
}

function 统一请求({ url = '', method = 'GET', data = {}, header = {}, baseURL = 基础地址 } = {}) {
	const 请求方法 = String(method).toUpperCase()
	const 请求头 = {
		...header
	}
	let 请求数据 = data

	const token = 读取登录Token()
	if (token && !请求头.Authorization && !请求头.authorization) {
		请求头.Authorization = `Bearer ${token}`
	}

	if (请求方法 === 'POST' && !请求头['content-type'] && !请求头['Content-Type']) {
		// YZ 使用 request.POST 读取中文参数，继续提交表单，不能改为 JSON 请求体。
		const legacy数据 = 创建LegacyMultipart数据(data)
		请求头['content-type'] = legacy数据.contentType
		请求数据 = legacy数据.body
	}

	return new Promise((resolve, reject) => {
		uni.request({
			url: 拼接请求地址(url, baseURL),
			method: 请求方法,
			data: 请求数据,
			timeout: 请求超时时间,
			header: 请求头,
			success(响应) {
				const 响应数据 = 响应.data
				const 状态码 = 响应.statusCode

				if (状态码 < 200 || 状态码 >= 300 || !判断业务请求成功(响应数据)) {
					const 提示 = 读取后端错误信息(响应数据)

					显示请求错误(提示)
					reject(new Error(提示))
					return
				}

				resolve(提取响应数据(响应数据))
			},
			fail(错误) {
				const 提示 = 错误.errMsg || '网络请求失败'

				显示请求错误(提示)
				reject(new Error(提示))
			}
		})
	})
}

function 读取缓存(缓存键, 有效时间 = 0) {
	const 缓存数据 = uni.getStorageSync(缓存键)

	if (!缓存数据) {
		return null
	}

	const 缓存格式有效 = typeof 缓存数据 === 'object' &&
		Object.prototype.hasOwnProperty.call(缓存数据, 'data')
	const 当前会话标识 = 读取当前缓存会话标识()
	const 缓存已过期 = 有效时间 > 0 &&
		(!缓存数据.time || Date.now() - 缓存数据.time > 有效时间)
	const 缓存会话不一致 = !缓存格式有效 || 缓存数据.session !== 当前会话标识

	if (!缓存格式有效 || 缓存已过期 || 缓存会话不一致) {
		// 非法、过期和旧会话缓存都不再有使用价值，立即删除以免持续占用 Storage。
		uni.removeStorageSync(缓存键)
		return null
	}

	return 缓存数据.data
}

function 写入缓存(缓存键, 数据) {
	uni.setStorageSync(缓存键, {
		data: 数据,
		time: Date.now(),
		session: 读取当前缓存会话标识()
	})
}

export {
	基础地址,
	新能源基础地址,
	请求超时时间,
	登录有效时间,
	读取登录过期时间,
	读取当前缓存会话标识,
	统一请求,
	提取响应数据,
	读取对象字段,
	是否普通对象,
	转为文本,
	解析Json,
	读取数组,
	读取首个有效字段,
	标准化区域类型,
	读取默认区域类型,
	读取可见区域ID,
	新能源请求,
	解析下拉对象,
	解析下拉列表,
	创建参数缓存键,
	清空缓存对象,
	读取有效内存缓存,
	复用在途请求,
	解析字段列表,
	读取响应列表数据,
	二维行转对象,
	解析数据行列表,
	读取缓存,
	写入缓存
}
