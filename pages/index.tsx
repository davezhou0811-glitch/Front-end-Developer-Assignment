import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { CheckboxGroup, Checkbox } from '@heroui/checkbox'
import { Select, SelectItem } from '@heroui/select'
import { Slider } from '@heroui/slider'
import { Skeleton } from '@heroui/skeleton'
import React, { useRef, forwardRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useAtom } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { VirtuosoGrid, type VirtuosoGridProps } from 'react-virtuoso'

import Card from '@/components/Cards/Card'
import { SearchIcon } from '@/components/icons'
import DefaultLayout from '@/layouts/default'
import { priceOptionLabels } from '@/config/site'
import {
  selectedOptionAtom,
  sortKeyAtom,
  priceAtom,
  searchInputAtom,
  searchQueryAtom,
  sliderLockedAtom,
  DEFAULT_PRICE,
  type SortKey,
  type PriceRange,
  suspendUrlSync,
  resumeUrlSync
} from '@/store/atoms'

const sortOptions = [
  { key: 'name', label: 'Item Name' },
  { key: 'price_desc', label: 'Higher Price' },
  { key: 'price_asc', label: 'Lower Price' }
]

const SkeletonCard = () => (
  <div className="w-full">
    <Skeleton className="w-full aspect-[100/133] rounded-medium" />
    <div className="mt-3 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-4 w-1/2 rounded" />
    </div>
  </div>
)

const gridComponents: VirtuosoGridProps<any, any>['components'] = {
  List: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ style, children, ...props }, ref) => (
      <div ref={ref} {...props} style={{ display: 'flex', flexWrap: 'wrap', ...style }}>
        {children}
      </div>
    )
  ),
  Item: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      {...props}
      className="p-2 w-1/4 max-sm:w-1/1 max-md:w-1/2 max-lg:w-1/3"
      style={{
        padding: '0.8rem',
        display: 'flex',
        flex: 'none',
        alignContent: 'stretch',
        boxSizing: 'border-box'
      }}>
      {children}
    </div>
  )
}

if (gridComponents?.List) {
  gridComponents.List.displayName = 'VirtuosoGridList'
}

type InitialFilters = {
  search: string
  sortKey: SortKey
  price: PriceRange
  options: string[]
}

export const getServerSideProps: GetServerSideProps<{
  initialFilters: InitialFilters
}> = async ctx => {
  // Parse URL query parameters
  const q = ctx.query
  const search = typeof q.search === 'string' ? q.search : ''
  const sortRaw = typeof q.sort === 'string' ? q.sort : 'name'
  const sortKey: SortKey =
    sortRaw === 'price_desc' || sortRaw === 'price_asc' || sortRaw === 'name' ? sortRaw : 'name'
  let price: PriceRange = DEFAULT_PRICE

  if (typeof q.price === 'string') {
    const m = q.price.match(/^(\d+)-(\d+)$/)

    if (m) price = [parseInt(m[1], 10), parseInt(m[2], 10)]
  }
  let options: string[] = []
  const opt = q.options

  if (Array.isArray(opt)) options = opt.flatMap(s => s.split(',').filter(Boolean))
  else if (typeof opt === 'string') options = opt.split(',').filter(Boolean)

  return { props: { initialFilters: { search, sortKey, price, options } } }
}

export default function IndexPage({ initialFilters }: { initialFilters: InitialFilters }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Fake pagination
  const PAGE_SIZE = 20
  const [allData, setAllData] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [apiData, setApiData] = useState<any[]>([])
  const skipNextEndReachedRef = useRef(false)

  // SSR hydration to prevent first-render flicker
  useHydrateAtoms([
    [selectedOptionAtom, initialFilters.options],
    [sortKeyAtom, initialFilters.sortKey],
    [priceAtom, initialFilters.price],
    [searchInputAtom, initialFilters.search],
    [searchQueryAtom, initialFilters.search]
  ])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [selectedOption, setSelectedOption] = useAtom(selectedOptionAtom)
  const [sortKey, setSortKey] = useAtom(sortKeyAtom)
  const [price, setPrice] = useAtom(priceAtom)
  const [inputSearchQuery, setInputSearchQuery] = useAtom(searchInputAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const [sliderLocked] = useAtom(sliderLockedAtom)

  const [debouncedValue, setDebouncedValue] = useState<number[]>(initialFilters.price)
  const debounceRef = useRef<number | null>(null)
  const DEBOUNCE_MS = 250

  const appendNextPageFromCache = useCallback(() => {
    setApiData(prev => {
      const start = prev.length
      const end = Math.min(start + PAGE_SIZE, allData.length)
      const slice = allData.slice(start, end)

      if (slice.length === 0) {
        setHasMore(false)

        return prev
      }
      // No more data
      if (end >= allData.length) setHasMore(false)

      return [...prev, ...slice]
    })
    setPage(prev => prev + 1)
  }, [allData, PAGE_SIZE])

  const fetchData = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      if (allData.length === 0) {
        const res = await fetch('/api/data')
        const data = await res.json()

        setAllData(data)
        const first = data.slice(0, PAGE_SIZE)

        setApiData(first)
        setPage(0)
        setHasMore(true)
      } else {
        appendNextPageFromCache()
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', e)
    } finally {
      setLoading(false)
    }
  }, [allData.length, appendNextPageFromCache, hasMore, loading, PAGE_SIZE])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // slider debounce
  useEffect(() => {
    if (!mounted) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setDebouncedValue(price)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [mounted, price])

  const [filteredData, setFilteredData] = useState<any[]>([])

  useEffect(() => {
    if (apiData.length === 0) {
      setFilteredData([])

      return
    }
    const range = mounted ? debouncedValue : initialFilters.price
    const min = range[0] ?? DEFAULT_PRICE[0]
    const max = range[1] ?? DEFAULT_PRICE[1]
    const opts = mounted ? selectedOption : initialFilters.options
    const locked = mounted
      ? sliderLocked
      : initialFilters.options.length > 0 && !initialFilters.options.includes('0')

    let filtered = apiData.filter((item: any) => {
      const optionOk = opts.length === 0 || opts.includes(String(item.pricingOption))
      const priceNum = Number(item.price ?? 0)
      const priceOk = locked ? true : priceNum >= min && priceNum <= max

      return optionOk && priceOk
    })
    const q = (mounted ? searchQuery : initialFilters.search) || ''

    if (q) {
      const qq = q.toLowerCase()

      filtered = filtered.filter(item =>
        String(item.title ?? '')
          .toLowerCase()
          .includes(qq)
      )
    }
    setFilteredData(filtered)
  }, [
    apiData,
    debouncedValue,
    selectedOption,
    searchQuery,
    sliderLocked,
    mounted,
    initialFilters.price,
    initialFilters.options,
    initialFilters.search
  ])

  const sortedData = useMemo(() => {
    const list = [...filteredData]
    // sortKey depends on mounted state for SSR consistency
    const _sortKey = mounted ? sortKey : initialFilters.sortKey

    switch (_sortKey) {
      case 'price_desc':
        return list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0))
      case 'price_asc':
        return list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
      case 'name':
      default:
        return list.sort((a, b) => String(a.title ?? '').localeCompare(String(b.title ?? '')))
    }
  }, [filteredData, sortKey, mounted, initialFilters.sortKey])

  const isInitialLoading = React.useMemo(
    () => page === 0 && (loading || apiData.length === 0),
    [page, loading, apiData.length]
  )

  const handleSearch = useCallback(() => {
    setSearchQuery(inputSearchQuery)
  }, [inputSearchQuery, setSearchQuery])

  const handleClearSearch = useCallback(() => {
    setInputSearchQuery('')
    setSearchQuery('')
  }, [setInputSearchQuery, setSearchQuery])

  // Reset all filters
  const handleReset = useCallback(async () => {
    try {
      suspendUrlSync()
      setInputSearchQuery('')
      setSearchQuery('')
      setPrice(DEFAULT_PRICE)
      setSelectedOption([])
      setSortKey('name')

      // Reset data pagination
      setApiData([])
      setPage(0)
      setHasMore(true)

      if (allData.length > 0) {
        setTimeout(() => {
          appendNextPageFromCache()
        }, 0)
      }
      // Clean URL query parameters
      const q: Record<string, string | string[] | undefined> = { ...router.query }

      delete q.search
      delete q.sort
      delete q.price
      delete q.options
      await router.replace({ pathname: router.pathname, query: q }, undefined, {
        shallow: true,
        scroll: false
      })
    } finally {
      resumeUrlSync()
    }
  }, [
    allData.length,
    router,
    setInputSearchQuery,
    setSearchQuery,
    setPrice,
    setSelectedOption,
    setSortKey,
    appendNextPageFromCache
  ])
  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      void fetchData()
    }
  }, [fetchData, hasMore, loading])

  // Empty skeleton grid
  const INITIAL_SKELETON_COUNT = 12
  const EmptySkeletonGrid = () => (
    <div className="flex flex-wrap w-full">
      {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className="p-2 w-1/4 max-sm:w-1/1 max-md:w-1/2 max-lg:w-1/3"
          style={{
            padding: '0.5rem',
            display: 'flex',
            flex: 'none',
            alignContent: 'stretch',
            boxSizing: 'border-box'
          }}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  )

  // Displayed price range values
  const displayMin = (!mounted ? initialFilters.price[0] : price[0]) ?? DEFAULT_PRICE[0]
  const displayMax = (!mounted ? initialFilters.price[1] : price[1]) ?? DEFAULT_PRICE[1]

  // console.log('sssss:', sortedData)

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Input
          isClearable
          aria-label="Search"
          classNames={{ inputWrapper: 'bg-default-100', input: 'text-sm' }}
          labelPlacement="outside"
          placeholder="Find the items you're looking for"
          radius="none"
          size="lg"
          startContent={<SearchIcon className="cursor-pointer" onClick={handleSearch} />}
          type="search"
          value={inputSearchQuery}
          onChange={e => setInputSearchQuery(e.target.value)}
          onClear={handleClearSearch}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearch()
          }}
        />
        <div
          className="w-full mt-4 px-8 py-3 flex items-center gap-5 text-sm text-default-400"
          style={{ backgroundColor: '#141117' }}>
          <span>Pricing Option</span>
          <CheckboxGroup
            classNames={{ wrapper: 'gap-5' }}
            color="secondary"
            orientation="horizontal"
            {...(!mounted
              ? { defaultValue: initialFilters.options, onValueChange: () => {} }
              : {
                  value: selectedOption,
                  onValueChange: (v: string[]) => setSelectedOption(v)
                })}>
            {priceOptionLabels.map(option => (
              <Checkbox key={option.value} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </CheckboxGroup>
          <span className="w-10 ml-12 text-left">{`$${displayMin}`}</span>
          <Slider
            hideValue
            aria-label="Price Range"
            classNames={{
              base: 'max-w-md',
              filler: ['bg-[#12242A]'],
              thumb: ['bg-[#414143]', 'after:bg-[#414143]']
            }}
            formatOptions={{ style: 'currency', currency: 'USD' }}
            isDisabled={
              !mounted
                ? initialFilters.options.length > 0 && !initialFilters.options.includes('0')
                : sliderLocked
            }
            maxValue={999}
            minValue={0}
            step={1}
            {...(!mounted
              ? { defaultValue: initialFilters.price, onChange: () => {} }
              : {
                  value: price,
                  onChange: (val: number | number[]) =>
                    setPrice(prev =>
                      Array.isArray(val)
                        ? ([Number(val[0] ?? prev[0]), Number(val[1] ?? prev[1])] as [
                            number,
                            number
                          ])
                        : ([Number(val), Number(val)] as [number, number])
                    )
                })}
          />
          <span className="w-10 text-right">{`$${displayMax}`}</span>
          <Button className="ml-auto p-0 min-w-0" variant="light" onClick={handleReset}>
            Reset
          </Button>
        </div>
        <Select
          className="max-w-xs ml-auto"
          label="Sort by:"
          labelPlacement="outside-left"
          selectionMode="single"
          {...(!mounted
            ? {
                defaultSelectedKeys: new Set([initialFilters.sortKey]),
                onSelectionChange: () => {}
              }
            : {
                selectedKeys: new Set([sortKey]),
                onSelectionChange: (keys: any) => {
                  const key = Array.from(keys as Set<string>)[0]

                  if (key) setSortKey(key as SortKey)
                }
              })}>
          {sortOptions.map(option => (
            <SelectItem key={option.key}>{option.label}</SelectItem>
          ))}
        </Select>
        {sortedData.length === 0 ? (
          <div className="w-full flex items-center justify-center text-default-500">
            {isInitialLoading ? <EmptySkeletonGrid /> : 'No Results Found'}
          </div>
        ) : (
          <VirtuosoGrid
            useWindowScroll
            className="w-full"
            components={{ ...gridComponents }}
            data={sortedData}
            endReached={handleEndReached}
            itemContent={(index, data) => <Card {...data} key={`${data.title}-${index}`} />}
          />
        )}
      </section>
    </DefaultLayout>
  )
}
