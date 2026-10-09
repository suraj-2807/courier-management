import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPublicBranding } from '../api/setup.api'

function adjustColor(hex, percent) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex
  let num = parseInt(hex.replace('#', ''), 16)
  if (isNaN(num)) return hex
  let r = (num >> 16) + Math.round(255 * (percent / 100))
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100))
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100))
  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function applyBrandingToDOM(branding) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (branding.color_primary) {
    const primary = branding.color_primary
    const primaryDark = branding.color_primary_dark || adjustColor(primary, -15)
    const primaryLight = branding.color_primary_light || adjustColor(primary, 20)

    root.style.setProperty('--color-primary', primary)
    root.style.setProperty('--color-primary-dark', primaryDark)
    root.style.setProperty('--color-primary-light', primaryLight)
    root.style.setProperty('--color-primary-subtle', `${primary}14`)
    root.style.setProperty('--color-primary-muted', `${primary}26`)
    root.style.setProperty('--brand-primary', primary)
  }

  if (branding.color_accent) {
    root.style.setProperty('--color-secondary', branding.color_accent)
    root.style.setProperty('--color-secondary-dark', adjustColor(branding.color_accent, -15))
    root.style.setProperty('--color-secondary-light', adjustColor(branding.color_accent, 15))
  }

  if (branding.color_sidebar) {
    if (branding.color_sidebar === 'dark') {
      root.style.setProperty('--color-navy', '#111827')
      root.style.setProperty('--color-navy-light', '#1F2937')
      root.style.setProperty('--color-navy-lighter', '#374151')
    } else if (branding.color_sidebar === 'primary') {
      root.style.setProperty('--color-navy', branding.color_primary_dark || '#0D2132')
      root.style.setProperty('--color-navy-light', branding.color_primary || '#142D42')
    } else {
      // Default navy
      root.style.setProperty('--color-navy', '#111827')
      root.style.setProperty('--color-navy-light', '#1F2937')
      root.style.setProperty('--color-navy-lighter', '#374151')
    }
  }

  if (branding.firm_name) {
    document.title = `${branding.firm_name} — Admin Dashboard`
  }

  // Set favicon with clean white background from firm logo
  if (branding.firm_logo) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 64
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Draw crisp white background with rounded corners
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(0, 0, size, size, 14)
          } else {
            ctx.rect(0, 0, size, size)
          }
          ctx.fill()

          // Draw logo centered with neat padding
          const pad = 8
          ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)

          const iconUrl = canvas.toDataURL('image/png')
          let link = document.querySelector("link[rel*='icon']")
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = iconUrl
        }
      }
      img.src = branding.firm_logo
    } catch (err) {
      // Non-blocking fallback
    }
  }
}

export const useBrandingStore = create(
  persist(
    (set, get) => ({
      branding: {
        firm_name: 'SK Courier',
        firm_tagline: 'Fast, Secure & Worldwide',
        firm_logo: '',
        color_primary: '#10B981',
        color_primary_dark: '#059669',
        color_primary_light: '#34D399',
        color_accent: '#0F1014',
        color_sidebar: 'navy',
        firm_phone: '+91 98765 43210',
        firm_email: 'contact@courierexpress.com',
        firm_website: 'www.courierexpress.com',
        firm_address: 'Main Logistics Hub, Cargo Terminal',
        firm_gstin: '',
        currency_symbol: '₹',
        invoice_prefix: 'INV-',
        tracking_prefix: 'EXP',
        is_setup_complete: 'false'
      },
      isLoading: false,

      setBranding: (newBranding) => {
        const merged = { ...get().branding, ...newBranding }
        applyBrandingToDOM(merged)
        set({ branding: merged })
      },

      fetchBranding: async () => {
        set({ isLoading: true })
        try {
          const res = await getPublicBranding()
          if (res?.success && res.branding) {
            applyBrandingToDOM(res.branding)
            set({ branding: res.branding, isLoading: false })
            return res.branding
          }
        } catch (err) {
          console.warn('[Branding] Using cached branding:', err.message)
        }
        set({ isLoading: false })
        applyBrandingToDOM(get().branding)
        return get().branding
      }
    }),
    {
      name: 'courier-portal-branding',
      onRehydrateStorage: () => (state) => {
        if (state?.branding) {
          applyBrandingToDOM(state.branding)
        }
      }
    }
  )
)
