import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Button, DropdownMenu, Flex, IconButton, Text } from '@radix-ui/themes'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { PwaStatus } from './PwaStatus'

const NAV = [
  { to: '/new', label: 'New Story' },
  { to: '/stories', label: 'My Stories' },
  { to: '/settings', label: 'Settings' },
] as const

function navVariant(pathname: string, to: string): 'soft' | 'ghost' {
  if (to === '/stories') {
    return pathname.startsWith('/stories') ? 'soft' : 'ghost'
  }
  return pathname === to ? 'soft' : 'ghost'
}

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <header className="app-header">
        <Flex align="center" justify="between" gap="3" className="app-header-inner">
          <Link to="/" className="brand">
            <Text weight="medium" size="3">
              Extensive Reading
            </Text>
          </Link>

          <div className="nav-desktop">
            <Flex gap="2" align="center">
              {NAV.map((item) => (
                <Button key={item.to} asChild variant={navVariant(pathname, item.to)} size="2">
                  <NavLink to={item.to}>{item.label}</NavLink>
                </Button>
              ))}
            </Flex>
          </div>

          <div className="nav-menu-btn">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton variant="ghost" aria-label="Open menu">
                  <HamburgerMenuIcon />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                {NAV.map((item) => (
                  <DropdownMenu.Item key={item.to} asChild>
                    <NavLink to={item.to}>{item.label}</NavLink>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </Flex>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
      <PwaStatus />
    </div>
  )
}
