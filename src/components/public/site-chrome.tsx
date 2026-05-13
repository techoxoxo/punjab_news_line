'use client'

import React from 'react'
import { FallbackImage } from './fallback-image'
import Link from 'next/link'
import { logoUrl } from '@/lib/image'
import { usePathname } from 'next/navigation'
import { NewsletterForm } from './newsletter-form'

const navItems = [
  { href: '/category/national', label: 'National', code: 20 },
  { href: '/category/punjab', label: 'Punjab', code: 21 },
  { href: '/category/haryana', label: 'Haryana', code: 7 },
  { href: '/category/himachal', label: 'Himachal', code: 17 },
  { href: '/category/chandigarh', label: 'Chandigarh', code: 10 },
  { href: '/category/delhi-ncr', label: 'Delhi NCR', code: 30 },
  { href: '/category/uttar-pradesh', label: 'Uttar Pradesh', code: 31 },
  { href: '/category/jammu-kashmir', label: 'Jammu & Kashmir', code: 32 },
  { href: '/category/uttarakhand', label: 'Uttarakhand', code: 33 },
  { href: '/category/political', label: 'Political', code: 8 },
  { href: '/category/business', label: 'Business', code: 6 },
  { href: '/category/opinion', label: 'Opinion', code: 16 },
  { href: '/category/films-tv', label: 'Films & TV', code: 25 },
]

const CONDITIONAL_CODES = [30, 31, 32, 33]

function OtherStatesDropdown({ items, isSticky = false }: { items: typeof navItems, isSticky?: boolean }) {
  if (items.length === 0) return null

  return (
    <div className="relative group shrink-0">
      <button className={`
        flex items-center gap-1.5 shrink-0 rounded-full font-bold uppercase tracking-widest transition-all
        ${isSticky 
          ? 'px-3 py-1.5 text-[10px] text-slate-600 hover:text-brand' 
          : 'px-5 py-2.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-brand'
        }
      `}>
        Other States
        <svg className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="absolute left-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-52 z-[110]">
        <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-premium border border-slate-100 overflow-hidden py-2.5">
          <div className="px-5 py-2 mb-1 border-b border-slate-50">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Regional Portals</span>
          </div>
          {items.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="block px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-brand/5 hover:text-brand transition-all flex items-center gap-3 group/item"
            >
              <span className="h-1 w-1 rounded-full bg-slate-200 group-hover/item:bg-brand transition-colors" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const footerItems = [
  { href: '/category/business', label: 'Business News' },
  { href: '/category/sports', label: 'Sports' },
  { href: '/photo-gallery', label: 'Photo Gallery' },
  { href: '/video-gallery', label: 'Video Gallery' },
  { href: '/rssfeed', label: 'RSS Feed' },
]

import { NewsTicker } from './news-ticker'

export function SiteChrome({ 
  children, 
  activeCategoryCodes = [] 
}: { 
  children: React.ReactNode, 
  activeCategoryCodes?: number[] 
}) {
  const [showStickyNav, setShowStickyNav] = React.useState(false)
  const [lastScrollY, setLastScrollY] = React.useState(0)
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  const filteredNavItems = React.useMemo(() => {
    return navItems.filter(item => {
      // Regional categories (Other States) should always be visible in the sub-menu
      if (CONDITIONAL_CODES.includes(item.code)) {
        return true
      }
      return true
    })
  }, [activeCategoryCodes])

  const { mainPrimaryItems, otherStatesItems } = React.useMemo(() => {
    const primary = filteredNavItems.filter(item => !CONDITIONAL_CODES.includes(item.code))
    const others = filteredNavItems.filter(item => CONDITIONAL_CODES.includes(item.code))
    return { mainPrimaryItems: primary, otherStatesItems: others }
  }, [filteredNavItems])

  React.useEffect(() => {
    if (isAdmin) return
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // If scrolling up and far enough from top
      if (currentScrollY < lastScrollY && currentScrollY > 400) {
        setShowStickyNav(true)
      } else {
        setShowStickyNav(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, isAdmin])

  if (isAdmin) {
    return <>{children}</>
  }

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(new Date())

  return (
    <div className="min-h-screen selection:bg-brand selection:text-white">
      {/* Top Header Section - Scrolls Away */}
      <header className="bg-white">
        <div className="border-b border-slate-100">
          <div className="mx-auto max-w-8xl px-6 lg:px-10 flex h-12 items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {dateLabel}
              </span>
              <span className="hidden md:block opacity-30 h-3 w-[1px] bg-slate-900" />
              <span className="hidden md:block text-slate-400">Regional Excellence • Global Reach</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/rssfeed" className="hover:text-brand transition-colors">RSS Feed</Link>
              <Link href="/about" className="hover:text-brand transition-colors">About</Link>
              <Link href="/contact" className="hover:text-brand transition-colors">Contact</Link>
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-8xl px-6 lg:px-10 py-2 md:py-4">
          <div className={`flex items-center gap-6 ${pathname === '/' ? 'flex-col text-center justify-center py-2 md:py-4' : 'flex-col md:flex-row justify-between'}`}>
            <Link href="/" className={`group block relative transition-all duration-500 hover:scale-[1.01] ${pathname === '/' ? 'mx-auto' : ''}`}>
              {pathname === '/' && (
                <h1 className="sr-only">Punjab Newsline | ਪੰਜਾਬ ਨਿਊਜ਼ਲਾਈਨ - Latest News from Punjab, India and World</h1>
              )}
              <div className={`${pathname === '/' ? 'h-16 md:h-22' : 'h-12 md:h-14'} w-auto relative`}>
                <FallbackImage
                  src={logoUrl()}
                  alt="Punjab Newsline"
                  width={340}
                  height={80}
                  priority
                  className="h-full w-auto object-contain filter drop-shadow-sm group-hover:drop-shadow-md"
                />
              </div>
            </Link>
            <form action="/search" method="GET" className={`w-full relative group ${pathname === '/' ? 'max-w-lg mx-auto mt-4' : 'max-w-xs'}`}>
              <div className="absolute inset-0 bg-brand/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2 shadow-sm ring-brand/10 transition-all duration-300 focus-within:border-brand focus-within:ring-4 focus-within:shadow-lg">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  name="q"
                  placeholder="Search news..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 font-semibold text-slate-800"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Regular Navigation - Not Sticky */}
        <nav className="relative z-30 border-t border-slate-100 bg-white" aria-label="Primary Navigation">
          <div className="mx-auto max-w-8xl px-4 lg:px-8">
            <div className="flex items-center justify-start gap-1 overflow-x-auto md:overflow-visible py-2 scrollbar-hide md:gap-3 no-scrollbar">
              <div className="flex items-center gap-1 md:mx-auto md:w-fit">
                <Link href="/" className="shrink-0 rounded-full bg-brand/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-brand transition-all hover:bg-brand hover:text-white">Home</Link>
                {mainPrimaryItems.map((item) => (
                  <React.Fragment key={item.href}>
                    <Link 
                      href={item.href} 
                      className="shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-100 hover:text-brand"
                    >
                      {item.label}
                    </Link>
                    {item.code === 10 && otherStatesItems.length > 0 && (
                      <OtherStatesDropdown items={otherStatesItems} />
                    )}
                  </React.Fragment>
                ))}
                <div className="mx-3 h-5 w-[1px] bg-slate-200 shrink-0" />
                <Link href="/video-gallery" className="shrink-0 rounded-full bg-brand-blue/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-blue transition-all hover:bg-brand-blue hover:text-white">Videos</Link>
                <Link href="/photo-gallery" className="shrink-0 rounded-full bg-brand-blue/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-blue transition-all hover:bg-brand-blue hover:text-white">Photos</Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Sticky Navigation - Shows only when scrolling up */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-md transition-all duration-500 ease-in-out ${showStickyNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`} 
        aria-label="Sticky Navigation"
      >
        <div className="mx-auto max-w-8xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
             {/* Small Logo for Sticky Nav */}
             <Link href="/" className="relative shrink-0 flex items-center">
               <FallbackImage src={logoUrl()} alt="Logo" width={140} height={35} className="h-8 w-auto object-contain" />
             </Link>
             
             <div className="flex items-center gap-1 md:gap-2">
               <div className="flex items-center gap-1 md:mx-auto">
                {mainPrimaryItems.map((item) => (
                  <React.Fragment key={item.href}>
                    <Link 
                      href={item.href} 
                      className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all hover:text-brand"
                    >
                      {item.label}
                    </Link>
                    {item.code === 10 && otherStatesItems.length > 0 && (
                      <OtherStatesDropdown items={otherStatesItems} isSticky />
                    )}
                  </React.Fragment>
                ))}
               </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-brand">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-b border-slate-100 bg-slate-50/50 py-2.5">
        <div className="mx-auto max-w-8xl px-6 lg:px-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                Trending
              </span>
            </div>
            <NewsTicker />
          </div>
        </div>
      </div>

      <main className="mx-auto min-h-[60vh] max-w-8xl px-2 sm:px-4 lg:px-8">
        {children}
      </main>

      <footer className="mt-0 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-8xl px-8 lg:px-12 py-20">
          <div className="grid gap-16 md:grid-cols-4">
            <div className="md:col-span-1 space-y-8">
              <Link href="/">
                <FallbackImage
                  src={logoUrl()}
                  alt="Punjab Newsline"
                  width={240}
                  height={60}
                  className="h-auto w-44 object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                />
              </Link>
              <p className="text-sm leading-relaxed text-slate-500 font-medium">
                Pioneering regional digital journalism since 2005. Delivering unbiased, real-time reporting from the heart of Punjab to the global diaspora.
              </p>
              {/* <div className="flex gap-3">
                {['FB', 'TW', 'IG', 'YT'].map((sm) => (
                  <div key={sm} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 hover:border-brand hover:text-brand hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    {sm}
                  </div>
                ))}
              </div> */}
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Regional Coverage</h4>
              <ul className="space-y-3">
                {filteredNavItems.slice(0, 9).map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm font-semibold text-slate-500 hover:text-brand flex items-center gap-2 group transition-all">
                      <span className="h-[1px] w-0 bg-brand transition-all group-hover:w-3" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Multimedia Hub</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Latest Videos', href: '/video-gallery' },
                  { label: 'Photo Stories', href: '/photo-gallery' },
                  { label: 'Sports Special', href: '/sports' },
                  { label: 'Business Desk', href: '/business' },
                  { label: 'RSS Feed', href: '/rssfeed' },
                ].map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm font-semibold text-slate-500 hover:text-brand flex items-center gap-2 group transition-all">
                      <span className="h-[1px] w-0 bg-brand transition-all group-hover:w-3" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-1 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Stay Updated</h4>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Join our newsletter for exclusive regional insights and breaking news alerts.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="mx-auto flex max-w-8xl flex-col items-center justify-between gap-6 md:flex-row px-4 lg:px-8 py-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} Punjab Newsline Media Group. Built for the Future.
            </p>
            <div className="flex gap-8">
              {['Privacy', 'Terms', 'Cookies'].map(link => (
                <Link key={link} href={`/${link.toLowerCase()}`} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}