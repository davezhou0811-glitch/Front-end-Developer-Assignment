import { jest } from '@jest/globals'

// ESM 项目必须用 unstable_mockModule
jest.unstable_mockModule('@heroui/card', () => ({
  Card: ({ children, ...props }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardBody: ({ children, ...props }) => (
    <div data-testid="card-body" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  )
}))

jest.unstable_mockModule('@heroui/image', () => ({
  Image: props => <img data-testid="card-image" alt={props.alt} src={props.src} />
}))
import { render, screen } from '@testing-library/react'

// 必须动态 import 组件
const { default: CardWrapper } = await import('./Card')

describe('CardWrapper', () => {
  it('renders card with price type 0 (number)', () => {
    render(
      <CardWrapper
        creator="Test Creator"
        imagePath="test.jpg"
        price={100}
        pricingOption={0}
        title="Test Title"
      />
    )
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('card-image')).toHaveAttribute('src', 'test.jpg')
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Creator')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
  })

  it('renders card with price type 1 (Free)', () => {
    render(
      <CardWrapper
        creator="No One"
        imagePath="free.jpg"
        price={0}
        pricingOption={1}
        title="Free Card"
      />
    )
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders card with price type 2 (View Only)', () => {
    render(
      <CardWrapper
        creator="Someone"
        imagePath="view.jpg"
        price={0}
        pricingOption={2}
        title="View Card"
      />
    )
    expect(screen.getByText('View Only')).toBeInTheDocument()
  })
})
