import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, execute } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BRANDING_JSON_PATH = path.resolve(__dirname, '..', 'config', 'branding.json')
const UPLOADS_BRANDING_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'branding')

if (!fs.existsSync(UPLOADS_BRANDING_DIR)) {
  fs.mkdirSync(UPLOADS_BRANDING_DIR, { recursive: true })
}

export const DEFAULT_BRANDING = {
  firm_name: 'Courier Express Logistics',
  firm_tagline: 'Fast, Secure & Worldwide Logistics',
  firm_logo: '',
  firm_logo_path: '',
  favicon_bg_color: '#ffffff',
  color_primary: '#2563EB',      // Modern Royal Blue
  color_primary_dark: '#1D4ED8',
  color_primary_light: '#3B82F6',
  color_accent: '#F59E0B',       // Amber Gold
  color_sidebar: 'navy',         // 'navy', 'dark', 'light', 'primary'
  firm_phone: '+91 98765 43210',
  firm_email: 'contact@courierexpress.com',
  firm_website: 'www.courierexpress.com',
  firm_address: 'Main Logistics Hub, Cargo Terminal, City - 110001',
  firm_gstin: '',
  currency_symbol: '₹',
  invoice_prefix: 'INV-',
  tracking_prefix: 'EXP',
  is_setup_complete: 'false'
}

function resolveBrandingLogo(merged) {
  if (merged.firm_logo) {
    if (merged.firm_logo.startsWith('/uploads/')) {
      const relPath = merged.firm_logo.replace(/^\/uploads\//, '')
      const diskPath = path.resolve(__dirname, '..', '..', 'uploads', relPath)
      if (fs.existsSync(diskPath)) {
        merged.firm_logo_path = diskPath
        return merged
      }
    } else if (fs.existsSync(merged.firm_logo)) {
      merged.firm_logo_path = merged.firm_logo
      return merged
    }
  }

  // Fallback: If the specified logo is missing or not set, auto-discover any logo in uploads/branding
  try {
    if (fs.existsSync(UPLOADS_BRANDING_DIR)) {
      const files = fs.readdirSync(UPLOADS_BRANDING_DIR).filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f))
      if (files.length > 0) {
        files.sort((a, b) => {
          const statA = fs.statSync(path.join(UPLOADS_BRANDING_DIR, a))
          const statB = fs.statSync(path.join(UPLOADS_BRANDING_DIR, b))
          return statB.mtimeMs - statA.mtimeMs
        })
        const chosen = files[0]
        merged.firm_logo = `/uploads/branding/${chosen}`
        merged.firm_logo_path = path.join(UPLOADS_BRANDING_DIR, chosen)
      }
    }
  } catch (e) {}

  return merged
}

/**
 * Read cached branding from JSON file.
 */
export function getLocalBranding() {
  try {
    if (fs.existsSync(BRANDING_JSON_PATH)) {
      const data = fs.readFileSync(BRANDING_JSON_PATH, 'utf-8')
      return resolveBrandingLogo({ ...DEFAULT_BRANDING, ...JSON.parse(data) })
    }
  } catch (err) {
    console.warn('[Branding] Failed to read branding.json:', err.message)
  }
  return resolveBrandingLogo({ ...DEFAULT_BRANDING })
}

/**
 * Save branding to local JSON cache.
 */
export function saveLocalBranding(data) {
  try {
    const configDir = path.dirname(BRANDING_JSON_PATH)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    const current = getLocalBranding()
    const merged = { ...current, ...data }
    // Do not persist environment-specific absolute paths to branding.json
    if (merged.firm_logo_path && !merged.firm_logo_path.startsWith('/')) {
      delete merged.firm_logo_path
    }
    fs.writeFileSync(BRANDING_JSON_PATH, JSON.stringify(merged, null, 2), 'utf-8')
    return resolveBrandingLogo(merged)
  } catch (err) {
    console.error('[Branding] Failed to write branding.json:', err.message)
    return resolveBrandingLogo({ ...DEFAULT_BRANDING, ...data })
  }
}

/**
 * Get active company branding (Database with local JSON fallback).
 */
export async function getCompanyBranding() {
  const local = getLocalBranding()
  try {
    const rows = await query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('firm_name', 'firm_tagline', 'firm_logo', 'favicon_bg_color', 'color_primary', 'color_accent', 'color_sidebar', 'firm_phone', 'firm_email', 'firm_website', 'firm_address', 'firm_gstin', 'currency_symbol', 'invoice_prefix', 'tracking_prefix', 'is_setup_complete')"
    )
    if (Array.isArray(rows) && rows.length > 0) {
      const dbSettings = {}
      for (const r of rows) {
        if (r.setting_value !== undefined && r.setting_value !== null && r.setting_value !== '') {
          dbSettings[r.setting_key] = r.setting_value
        }
      }
      const merged = { ...local, ...dbSettings }
      return resolveBrandingLogo(merged)
    }
  } catch (err) {
    // DB not ready or table missing; return local branding
  }
  return resolveBrandingLogo(local)
}
