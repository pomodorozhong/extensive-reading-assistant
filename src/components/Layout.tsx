import { CheckIcon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import { DropdownMenu, IconButton } from '@radix-ui/themes'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { setOnboardingOpen, shouldOfferOnboarding } from '../lib/onboarding'
import { loadVocabulary } from '../lib/storage'
import { Onboarding } from './Onboarding'
import { PwaStatus } from './PwaStatus'

const NAV = [
  { to: '/new', label: 'New Story' },
  { to: '/stories', label: 'My Stories' },
  { to: '/dictionary', label: 'Dictionary' },
  { to: '/exam', label: 'Exam' },
  { to: '/settings', label: 'Settings' },
] as const

function isActive(pathname: string, to: string): boolean {
  return to === '/stories' ? pathname.startsWith('/stories') : pathname === to
}

export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    loadVocabulary()
    if (shouldOfferOnboarding()) setOnboardingOpen(true)
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="brand">
            Extensive Reading
          </Link>

          <nav className="nav-desktop" aria-label="Main navigation">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={isActive(pathname, item.to) ? 'nav-link active' : 'nav-link'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-menu-btn">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton variant="ghost" aria-label="Open menu">
                  <HamburgerMenuIcon />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" aria-label="Main navigation">
                {NAV.map((item) => (
                  <DropdownMenu.Item key={item.to} asChild>
                    <NavLink to={item.to} className="nav-menu-link">
                      {item.label}
                      <CheckIcon className="nav-current-icon" aria-hidden="true" />
                    </NavLink>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>Extensive Reading</span>
          <span>Stories and saved words stay on this device</span>
        </div>
      </footer>
      <PwaStatus />
      <Onboarding />
    </div>
  )
}
