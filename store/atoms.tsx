import { atom } from 'jotai'
import Router from 'next/router'

const isBrowser = typeof window !== 'undefined'

// 全局开关：在批处理（如 reset）时暂停 atom 对 URL 的写入
let urlSyncSuspended = false

export function suspendUrlSync() {
  urlSyncSuspended = true
}
export function resumeUrlSync() {
  urlSyncSuspended = false
}

/**
 * 创建一个与 URL 同步的 atom（仅在客户端进行 URL 读/写）
 * - param: URL 查询参数名
 * - serialize/parse: 值与字符串互转
 * - omitDefault: 当值等于默认值时从 URL 中移除该参数
 */
function createUrlSyncedAtom<T>(
  defaultValue: T,
  options: {
    param: string
    serialize?: (v: T) => string
    parse?: (s: string | null) => T
    omitDefault?: boolean
  }
) {
  const {
    param,
    serialize = (v: T) => String(v),
    parse = (s: string | null) => s as unknown as T,
    omitDefault = true
  } = options

  const base = atom<T>(defaultValue)

  // 仅在客户端挂载时：从 URL 初始化 + 监听前进/后退
  base.onMount = set => {
    if (!isBrowser) return

    try {
      const url = new URL(window.location.href)
      const raw = url.searchParams.get(param)
      const initial = parse(raw)

      set(initial)
    } catch {
      // ignore
    }

    const onPopState = () => {
      try {
        const url = new URL(window.location.href)
        const raw = url.searchParams.get(param)
        const next = parse(raw)

        set((prev: any) => {
          const prevStr = serialize(prev)
          const nextStr = serialize(next)

          return prevStr === nextStr ? prev : next
        })
      } catch {
        // ignore
      }
    }

    window.addEventListener('popstate', onPopState)

    return () => window.removeEventListener('popstate', onPopState)
  }

  // 导出 atom：写入时同步 URL（仅客户端；用 replace 避免增加历史记录）
  return atom(
    get => get(base),
    (get, set, nextValue: T | ((prev: T) => T)) => {
      const prev = get(base)
      const next = typeof nextValue === 'function' ? (nextValue as (p: T) => T)(prev) : nextValue

      // 先更新本地 atom
      set(base, next)

      // 仅客户端且未暂停时写 URL
      if (!isBrowser || urlSyncSuspended) return

      try {
        const current = new URL(window.location.href)
        const nextStr = serialize(next)
        const defaultStr = serialize(defaultValue)

        if (omitDefault && nextStr === defaultStr) {
          current.searchParams.delete(param)
        } else {
          current.searchParams.set(param, nextStr)
        }

        const href = `${current.pathname}${current.search}${current.hash}`

        Router.replace(href, undefined, { shallow: true, scroll: false })
      } catch {
        // ignore
      }
    }
  )
}

// ----------------- 具体筛选项 atoms -----------------

// selectedOption: URL 参数 options=val1,val2
export const selectedOptionAtom = (() => {
  const serialize = (arr: string[]) => (arr?.length ? arr.join(',') : '')
  const parse = (s: string | null) => (s ? s.split(',').filter(Boolean) : [])

  return createUrlSyncedAtom<string[]>([], {
    param: 'options',
    serialize,
    parse,
    omitDefault: true
  })
})()

// sortKey: 默认 'name' 不写 URL，其他写在 sort=*
export type SortKey = 'name' | 'price_desc' | 'price_asc'
export const sortKeyAtom = createUrlSyncedAtom<SortKey>('name', {
  param: 'sort',
  serialize: v => v,
  parse: s => (s === 'price_desc' || s === 'price_asc' || s === 'name' ? s : 'name'),
  omitDefault: true
})

// price 区间：[min,max] -> price=min-max，默认 0-999 不写
export type PriceRange = [number, number]
export const DEFAULT_PRICE: PriceRange = [0, 999]
export const priceAtom = createUrlSyncedAtom<PriceRange>(DEFAULT_PRICE, {
  param: 'price',
  serialize: ([a, b]) => `${a}-${b}`,
  parse: s => {
    if (!s) return DEFAULT_PRICE
    const m = s.match(/^(\d+)-(\d+)$/)

    if (!m) return DEFAULT_PRICE

    return [parseInt(m[1], 10), parseInt(m[2], 10)] as PriceRange
  },
  omitDefault: true
})

// search：提交后的搜索词（与 input 分离），空值不写
export const searchQueryAtom = createUrlSyncedAtom<string>('', {
  param: 'search',
  serialize: v => v ?? '',
  parse: s => s ?? '',
  omitDefault: true
})

// search 输入框的受控值（不写 URL，仅本地）
export const searchInputAtom = atom<string>('')

// sliderLocked：由 selectedOption 派生
export const sliderLockedAtom = atom(get => {
  const opts = get(selectedOptionAtom)

  return opts.length > 0 && !opts.includes('0')
})
