'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Image } from '@heroui/image'

const priceOptionLabels: Record<1 | 2, string> = {
  1: 'Free',
  2: 'View Only'
}

const CardWrapper = ({ imagePath, title, creator, price, pricingOption }: any) => {
  return (
    <Card
      isPressable
      classNames={{ base: 'w-full gap-3 bg-transparent' }}
      radius="none"
      shadow="none">
      <CardBody className="w-full h-full aspect-[100/133] overflow-visible p-0">
        <Image
          isZoomed
          alt="Card background"
          className="w-full object-cover rounded-xl"
          classNames={{
            img: 'h-full aspect-[100/133]',
            wrapper: 'w-full max-w-full! aspect-[100/133]'
          }}
          src={imagePath}
        />
      </CardBody>
      <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)] p-0">
        <p className="text-tiny uppercase font-bold">{title}</p>
        <h4 className="text-medium row-span-2 self-center justify-self-end">
          {pricingOption === 0 ? `$${price}` : priceOptionLabels[pricingOption as 1 | 2]}
        </h4>
        <small className="text-default-500 justify-self-start">{creator}</small>
      </CardHeader>
    </Card>
  )
}

export default CardWrapper
