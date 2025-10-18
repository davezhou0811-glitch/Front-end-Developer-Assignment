export type SiteConfig = typeof siteConfig

interface PriceOption {
  value: string
  label: string
}

export const priceOptionLabels: PriceOption[] = [
  { value: '0', label: 'Paid' },
  { value: '1', label: 'Free' },
  { value: '2', label: 'View Only' }
]

export const siteConfig = {
  name: 'Front-end Developer Assignment',
  description: 'Make beautiful websites regardless of your design experience.'
}
