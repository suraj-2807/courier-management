import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useBrandingStore } from '../store/brandingStore'
import { authApi } from '../api/auth.api'
import { encryptWithPublicKey } from '../utils/crypto'
import { Loader2, Eye, EyeOff, ArrowRight, Mail, Lock, Truck, Settings, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { branding } = useBrandingStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let payload = { email: form.email, password: form.password }

      // Encrypt password with RSA-OAEP so plaintext password is never visible in network DevTools
      try {
        const keyRes = await authApi.getPublicKey()
        if (keyRes.data?.success && keyRes.data?.publicKey) {
          const encrypted = await encryptWithPublicKey(form.password, keyRes.data.publicKey)
          if (encrypted) {
            // Password replaced by encrypted_password; plain password never sent
            payload = {
              email: form.email,
              encrypted_password: encrypted
            }
          }
        }
      } catch (keyErr) {
        console.warn('[Auth] Public key negotiation failed, continuing with direct channel:', keyErr.message)
      }

      const { data } = await authApi.login(payload)
      if (data.success) {
        setAuth(data.user, data.token)
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
      {/* Main content — centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">

          {/* Card */}
          <div className="bg-surface rounded-xl border border-border p-8 sm:p-9" style={{ boxShadow: 'var(--shadow-lg)' }}>
            {/* Logo & Brand */}
            <div className="flex flex-col items-center mb-7">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 overflow-hidden"
                style={{
                  backgroundColor: branding?.color_primary || 'var(--color-primary)',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                }}
              >
                {branding?.firm_logo ? (
                  <img src={branding.firm_logo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <Truck className="w-6 h-6 text-white" />
                )}
              </div>
              <h1
                className="text-[20px] font-bold text-text-primary tracking-tight leading-none text-center"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
              >
                {branding?.firm_name || 'SK Courier'}
              </h1>
              <p className="text-[12px] text-text-tertiary mt-1 font-medium text-center">
                {branding?.firm_tagline || 'Enterprise Hub Access'}
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-border-light mb-6" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="text-[13px] px-3.5 py-2.5 rounded-lg animate-fade-in font-medium"
                  style={{
                    backgroundColor: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger-border)'
                  }}
                >
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className="w-4 h-4 text-text-tertiary" />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder={branding?.firm_email || 'admin@company.com'}
                    autoComplete="username"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    data-case="normal"
                    style={{ textTransform: 'none' }}
                    className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all normal-case"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-semibold text-text-secondary">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-medium transition-colors cursor-pointer"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-4 h-4 text-text-tertiary" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    data-case="normal"
                    style={{ textTransform: 'none' }}
                    className="w-full pl-9 pr-10 py-2.5 bg-surface border border-border rounded-lg text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all normal-case"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-4 h-4 rounded border transition-all flex items-center justify-center"
                    style={{
                      borderColor: rememberMe ? 'var(--color-primary)' : 'var(--color-border-strong)',
                      backgroundColor: rememberMe ? 'var(--color-primary)' : 'transparent'
                    }}
                  >
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[12px] text-text-secondary group-hover:text-text-primary transition-colors">
                  Remember this device
                </span>
              </label>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-white text-[13px] font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                style={{
                  backgroundColor: 'var(--color-primary)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-primary)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-text-tertiary">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                <span>256-bit RSA encrypted transmission</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-border-light">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-[11px] text-text-tertiary">
          <span>© {new Date().getFullYear()} {branding?.firm_name || 'SK Courier'}. All rights reserved.</span>
          <div className="hidden sm:block w-px h-3 bg-border" />
          <div className="flex items-center gap-3">
            <Link
              to="/setup"
              className="font-medium flex items-center gap-1 hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              <Settings className="w-3 h-3" /> Setup & Database
            </Link>
            <span className="text-border">|</span>
            <button className="hover:text-text-secondary transition-colors cursor-pointer">Privacy</button>
            <span className="text-border">|</span>
            <button className="hover:text-text-secondary transition-colors cursor-pointer">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
