import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  HelpCircle,
  X,
  Phone,
  Mail,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageSquare,
  Sparkles,
  LifeBuoy
} from 'lucide-react'
import toast from 'react-hot-toast'
import { submitSupportTicket } from '../../api/support.api'
import { useAuthStore } from '../../store/authStore'

export default function HelpSupportModal({ isOpen, onClose }) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('eryx_support') // 'guide' | 'eryx_support'
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  // Form State
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    category: 'Bug Report / Technical Issue',
    message: ''
  })
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [ticketResult, setTicketResult] = useState(null)

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, JPEG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Screenshot file must be under 10MB')
      return
    }
    setScreenshotFile(file)
    const previewUrl = URL.createObjectURL(file)
    setScreenshotPreview(previewUrl)
  }

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in your name, email, and message')
      return
    }

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('email', form.email)
      data.append('phone', form.phone || '')
      data.append('subject', form.subject || `${form.category} from ${form.name}`)
      data.append('category', form.category)
      data.append('message', form.message)
      if (screenshotFile) {
        data.append('screenshot', screenshotFile)
      }

      const res = await submitSupportTicket(data)
      if (res?.success) {
        setTicketResult(res)
        toast.success(res.message || 'Support ticket sent to eryxcodes.dev@gmail.com!')
        setForm({
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          subject: '',
          category: 'Bug Report / Technical Issue',
          message: ''
        })
        handleRemoveScreenshot()
      } else {
        toast.error(res?.message || 'Failed to submit support ticket')
      }
    } catch (err) {
      console.error('Support ticket error:', err)
      toast.error(err.response?.data?.message || 'Error submitting support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border-light bg-surface-alt/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy">
                Help & Support Center
              </h2>
              <p className="text-xs text-text-tertiary">
                Direct Engineering Support, Developer Desk & System Knowledge Base
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-navy hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border bg-surface flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('eryx_support')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'eryx_support'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-navy'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Eryx Codes Support Desk</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-md font-extrabold">
              Priority
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-navy'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Portal Usage Guide</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'eryx_support' ? (
            <div className="space-y-6">
              {/* Eryx Codes Developer Info Card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        Engineering Partner
                      </span>
                      <span className="text-[11px] text-text-tertiary">24/7 SLA Hotline</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-navy">
                      Eryx Codes Software Development & Maintenance
                    </h3>
                    <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
                      Official development team for this Courier Logistics Portal. If you encounter bugs, need new courier vendor API integrations, tariff customization, or server migration, contact our technical desk directly.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/15 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-navy font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block font-normal">Support Email</span>
                      <a href="mailto:eryxcodes.dev@gmail.com" className="text-primary hover:underline font-bold">
                        eryxcodes.dev@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-navy font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase block font-normal">Direct Helpline / WhatsApp</span>
                      <a href="tel:+919876543210" className="hover:underline font-bold text-navy">
                        +91 98765 43210
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Result Banner */}
              {ticketResult && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <p className="font-bold">Ticket Registered: {ticketResult.ticketId}</p>
                    <p className="mt-0.5 text-emerald-800">
                      {ticketResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Support Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                    Submit Technical Request or Bug Report
                  </h4>
                  <span className="text-[11px] text-text-tertiary">* Required fields</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suraj Sabu"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="Bug Report / Technical Issue">Bug Report / Technical Issue</option>
                      <option value="API Integration Assistance">API Integration Assistance</option>
                      <option value="Rate Sheet / Excel Import Help">Rate Sheet / Excel Import Help</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Urgent Server Support">Urgent Server Support</option>
                      <option value="Other Technical Inquiry">Other Technical Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Subject / Short Summary
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of the problem or request..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Detailed Description / Error Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please explain the issue step-by-step or describe the customization needed..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary transition-all resize-y"
                  />
                </div>

                {/* Screenshot Upload Option */}
                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5 flex items-center justify-between">
                    <span>Attach Screenshot / Error Picture (Optional)</span>
                    <span className="text-[11px] font-normal text-text-tertiary">Max 10MB (PNG, JPG, WEBP)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="relative rounded-xl border border-border overflow-hidden bg-surface-alt p-3 flex items-center gap-4">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-border flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-navy truncate block">
                          {screenshotFile?.name}
                        </span>
                        <span className="text-[11px] text-text-tertiary block mt-0.5">
                          {(screenshotFile?.size / 1024).toFixed(1)} KB • Image attached
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveScreenshot}
                          className="mt-2 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove Screenshot
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-surface-alt/50 hover:border-primary/50 transition-all"
                    >
                      <ImageIcon className="w-6 h-6 text-text-tertiary mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-navy block">
                        Click to upload screenshot
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        Help us understand your issue faster with a picture
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-between border-t border-border-light">
                  <span className="text-[11px] text-text-tertiary">
                    Emails will be delivered directly to <strong>eryxcodes.dev@gmail.com</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch to Eryx Codes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Copyright & Legal */}
              <div className="text-center text-[11px] text-text-tertiary pt-2 border-t border-border-light">
                © 2026 Eryx Codes. All rights reserved. • High Performance Logistics Software Systems
              </div>
            </div>
          ) : (
            /* Guide Tab */
            <div className="space-y-4 text-xs text-text-secondary leading-relaxed">
              <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2">
                <h4 className="font-bold text-sm text-navy flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  1. Creating Shipments & Waybills
                </h4>
                <p>
                  Click <strong>New Shipment</strong> in the navigation header or bookings page. Enter sender and receiver addresses, parcel dimensions, and choose either auto-calculation or specific rate cards. Once submitted, download generated waybill PDFs and box labels.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2">
                <h4 className="font-bold text-sm text-navy flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  2. Manual & No-API Vendors
                </h4>
                <p>
                  For offline transporters or partners without programmatic REST APIs, configure them under <strong>API Settings &rarr; Vendor Connections &rarr; Manual No-API Vendor</strong>. Entries can be registered manually and tracked via public REST endpoint <code>/api/v1/manual-vendor/track/:awb</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2">
                <h4 className="font-bold text-sm text-navy flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  3. Role & Module Permissions
                </h4>
                <p>
                  Super Admin can enable or restrict individual modules (Rates, Products, API Settings, Bookings) for Normal Admins, Operators, and Viewers in the <strong>Permissions Matrix</strong> page.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null
}

function Package(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}
