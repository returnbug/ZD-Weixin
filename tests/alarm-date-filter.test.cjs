const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const test = require('node:test')

const source = fs.readFileSync(path.join(__dirname, '../pages/gf/alarm/index/index.vue'), 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const selectedDate = '2026-08-21'
const tick = () => new Promise((resolve) => setImmediate(resolve))
const ids = (rows) => Array.from(rows, (row) => row.id)

function createPage(fetchRows) {
  const requests = []
  const hooks = {}
  const context = {
    ref: (value) => ({ value }),
    computed: (get) => Object.defineProperty({}, 'value', { get }),
    onLoad: (callback) => { hooks.load = callback },
    onReachBottom: (callback) => { hooks.reachBottom = callback },
    onUnload: (callback) => { hooks.unload = callback },
    报警状态列表: ['全部', '发生中', '已恢复'],
    报警接口: {
      获取报警列表: async (params) => {
        requests.push({ ...params })
        return fetchRows(params)
      }
    }
  }
  // Only Vue refs/lifecycle and the network boundary are stubbed; the page handlers run unchanged.
  vm.runInNewContext(script + `\nthis.page = {
    报警数据, 筛选报警列表, 筛选条件, 当前状态, 当前页, 是否还有更多, 加载中,
    是否显示首次加载, 查询报警列表, 选择开始时间, 清除发生时间, 切换状态, 选择设备类型, 报警下拉
  }`, context)
  return { page: context.page, requests, hooks }
}

function row(id, date, status = '已恢复', title = '设备报警', type = '电表') {
  return { id, 发生日期: date, 状态: status, 标题: title, 设备类型: type }
}

// Mirrors the existing endpoint contract: status and keyword search happen BEFORE pagination.
function backend(rows) {
  return (params) => {
    const matching = rows.filter((entry) => {
      const status = params.恢复状态 === '全部状态' ||
        (params.恢复状态 === '未恢复' ? entry.状态 === '发生中' : entry.状态 === '已恢复')
      const device = params.设备类型 === '全部类型' || entry.设备类型 === params.设备类型
      const keyword = !params.条件 || `${entry.标题}${entry.发生日期}`.includes(params.条件)
      return status && device && keyword
    })
    const start = (params.当页 - 1) * params.显条
    return matching.slice(start, start + params.显条)
  }
}

const mixedRows = [
  ...Array.from({ length: 65 }, (_, index) => row(`ongoing-${index}`, '2026-08-20', '发生中')),
  row('recovered-target', selectedDate)
]

test('全部和已恢复都能找到同一天的记录，即使它不在全部的前 50 条里', async () => {
  const fetchRows = backend(mixedRows)
  const legacyFirstPage = fetchRows({ 恢复状态: '全部状态', 设备类型: '全部类型', 条件: '', 显条: 50, 当页: 1 })
  assert.equal(legacyFirstPage.filter((entry) => entry.发生日期 === selectedDate).length, 0)

  const { page, requests } = createPage(fetchRows)
  page.筛选条件.value.开始时间 = selectedDate
  await page.查询报警列表()
  assert.deepEqual(ids(page.筛选报警列表.value), ['recovered-target'])
  assert.equal(requests[0].条件, selectedDate)

  page.切换状态('已恢复')
  await tick()
  assert.deepEqual(ids(page.筛选报警列表.value), ['recovered-target'])
  assert.equal(requests[1].恢复状态, '已恢复')
  assert.equal(requests[1].条件, selectedDate)
  assert.equal(requests[1].当页, 1)
})

test('未选择日期时仍按原规则每次加载 50 条', async () => {
  const { page, requests } = createPage(backend(mixedRows))
  await page.查询报警列表()
  assert.equal(page.报警数据.value.length, 50)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].条件, '')
  assert.equal(page.是否还有更多.value, true)
  await page.查询报警列表(false)
  assert.equal(page.报警数据.value.length, 66)
  assert.equal(requests[1].当页, 2)
  assert.equal(page.是否还有更多.value, false)
})

test('选择及清除日期会回到第一页，并保留当前状态和设备类型', async () => {
  const rows = [row('other-date', '2026-08-20'), row('target-date', selectedDate), row('other-device', selectedDate, '已恢复', '报警', '逆变器')]
  const { page, requests } = createPage(backend(rows))
  page.当前状态.value = '已恢复'
  page.筛选条件.value.设备类型 = '电表'
  page.当前页.value = 4
  page.选择开始时间({ detail: { value: selectedDate } })
  await tick()
  assert.deepEqual(ids(page.报警数据.value), ['target-date'])
  assert.equal(requests[0].当页, 1)
  page.清除发生时间()
  await tick()
  assert.equal(page.筛选条件.value.开始时间, '')
  assert.deepEqual(ids(page.报警数据.value), ['other-date', 'target-date'])
  assert.equal(requests[1].条件, '')
  assert.equal(requests[1].当页, 1)
  assert.equal(requests[1].恢复状态, '已恢复')
  assert.equal(requests[1].设备类型, '电表')
  page.清除发生时间()
  assert.equal(requests.length, 2, 'Empty date clear does not create a duplicate request')
})

test('日志文案中的日期不能被误当成发生日期，也不能造成提前空结果', async () => {
  const rows = [
    ...Array.from({ length: 100 }, (_, index) => row(`false-${index}`, '2026-08-22', '已恢复', `最近采集时间 ${selectedDate}`)),
    row('actual-date', selectedDate)
  ]
  const { page, requests } = createPage(backend(rows))
  page.筛选条件.value.开始时间 = selectedDate
  await page.查询报警列表()
  assert.deepEqual(ids(page.报警数据.value), ['actual-date'])
  assert.deepEqual(requests.map((entry) => entry.当页), [1, 2, 3])
  assert.equal(page.当前页.value, 4)
  assert.equal(page.是否还有更多.value, false)
})

test('跨候选页补足有效结果后，继续分页不会重取或遗漏', async () => {
  const rows = [
    ...Array.from({ length: 25 }, (_, index) => row(`false-${index}`, '2026-08-22', '已恢复', selectedDate)),
    ...Array.from({ length: 80 }, (_, index) => row(`match-${index}`, selectedDate))
  ]
  const { page, requests } = createPage(backend(rows))
  page.筛选条件.value.开始时间 = selectedDate
  await page.查询报警列表()
  assert.equal(page.报警数据.value.length, 75)
  assert.equal(page.当前页.value, 3)
  assert.equal(page.是否还有更多.value, true)
  await page.查询报警列表(false)
  assert.equal(page.报警数据.value.length, 80)
  assert.equal(new Set(ids(page.报警数据.value)).size, 80)
  assert.deepEqual(requests.map((entry) => entry.当页), [1, 2, 3])
  assert.equal(page.是否还有更多.value, false)
})

test('只有文案误命中且已到末页时才显示空结果', async () => {
  const { page, requests } = createPage(backend([row('false-date', '2026-08-20', '已恢复', selectedDate)]))
  page.筛选条件.value.开始时间 = selectedDate
  await page.查询报警列表()
  assert.equal(page.报警数据.value.length, 0)
  assert.equal(page.是否还有更多.value, false)
  assert.equal(page.加载中.value, false)
  assert.equal(requests.length, 1)
})

test('清除日期后，旧日期请求不能覆盖所有时间的结果', async () => {
  let finishOld
  const { page } = createPage((params) => params.条件
    ? new Promise((resolve) => { finishOld = resolve })
    : [row('all-times', '2026-09-01')])
  page.筛选条件.value.开始时间 = selectedDate
  const oldRequest = page.查询报警列表()
  page.清除发生时间()
  await tick()
  finishOld([row('stale-date', selectedDate)])
  await oldRequest
  assert.deepEqual(ids(page.报警数据.value), ['all-times'])
  assert.equal(page.筛选条件.value.开始时间, '')
  assert.equal(page.加载中.value, false)
})

test('切换条件后，旧查询停止继续扫描候选页', async () => {
  let finishOldPage
  const { page, requests } = createPage((params) => {
    if (!params.条件) return [row('unfiltered', '2026-09-01')]
    if (params.当页 === 1) return Array.from({ length: 50 }, (_, index) => row(`false-${index}`, '2026-08-20'))
    return new Promise((resolve) => { finishOldPage = resolve })
  })
  page.筛选条件.value.开始时间 = selectedDate
  const oldRequest = page.查询报警列表()
  await tick()
  page.清除发生时间()
  await tick()
  finishOldPage(Array.from({ length: 50 }, (_, index) => row(`old-page-${index}`, '2026-08-20')))
  await oldRequest
  assert.equal(requests.length, 3)
  assert.deepEqual(ids(page.报警数据.value), ['unfiltered'])
})

test('页面卸载后不继续扫描或写回报警结果', async () => {
  let finish
  const { page, hooks, requests } = createPage(() => new Promise((resolve) => { finish = resolve }))
  page.筛选条件.value.开始时间 = selectedDate
  const request = page.查询报警列表()
  hooks.unload()
  finish(Array.from({ length: 50 }, (_, index) => row(`late-${index}`, '2026-08-20')))
  await request
  assert.equal(requests.length, 1)
  assert.equal(page.报警数据.value.length, 0)
})