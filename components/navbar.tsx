import { Navbar as HeroUINavbar, NavbarContent, NavbarBrand } from '@heroui/navbar'
import NextLink from 'next/link'

import { Logo } from '@/components/icons'

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="full">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>
    </HeroUINavbar>
  )
}
