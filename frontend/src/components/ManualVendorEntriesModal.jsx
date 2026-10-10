import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Search,
  Package,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Trash2,
  Edit,
  Truck,
  Code2,
  RefreshCw,
  Send,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { manualEntriesApi } from '../api/manualEntries.api'
import axios from 'axios'

const STATUS_OPTIONS = [
  'Booked',
  'Manifested',
  'Picked Up',
  'In Transit',
  'Reached Facility',
  'Out for Delivery',
  'Delivered',
  'Undelivered',
  'RTO'
]

export default function ManualVendorEntriesModal({ vendor, onClose }) {
  const [activeTab, setActiveTab] = useState('entries') // 'entries' | 'create' | 'api_docs'
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Selected entry for adding tracking milestone
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [milestoneData, setMilestoneData] = useState({
    status: 'In Transit',
    location: '',
    remarks: ''
  })
  const [savingMilestone, setSavingMilestone] = useState(false)

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    awb_number: '',
    order_ref: '',
    sender_name: '',
    sender_city: '',
    receiver_name: '',
    receiver_city: '',
    destination_pincode: '',
    service_code: '',
    service_name: '',
    weight_kg: 0.5,
    pieces: 1,
    current_status: 'Booked',
    current_location: 'Origin Facility',
    status_description: 'Shipment recorded in manual registry'
  })
  const [creating, setCreating] = useState(false)

  // Public API test state
  const [testAwb, setTestAwb] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testingApi, setTestingApi] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const publicApiUrl = `${window.location.origin}/api/v1/manual-vendor/${vendor.vendor_code || 'manual'}/track`

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await manualEntriesApi.getEntries({
        vendor_config_id: vendor.id,
        vendor_code: vendor.vendor_code,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      })
      if (res?.data?.success) {
        setEntries(res.data.entries || [])
      }
    } catch (err) {
      toast.error('Failed to load manual entries: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [vendor.id, statusFilter])

  const handleCreateEntry = async (e) => {
    e.preventDefault()
    if (!newEntry.awb_number.trim()) {
      toast.error('AWB number is required')
      return
    }

    setCreating(true)
    try {
      const res = await manualEntriesApi.createEntry({
        ...newEntry,
        vendor_config_id: vendor.id,
        vendor_code: vendor.vendor_code
      })
      if (res?.data?.success) {
        toast.success('Manual entry added successfully!')
        setNewEntry({
          awb_number: '',
          order_ref: '',
          sender_name: '',
          sender_city: '',
          receiver_name: '',
          receiver_city: '',
          destination_pincode: '',
          service_code: '',
          service_name: '',
          weight_kg: 0.5,
          pieces: 1,
          current_status: 'Booked',
          current_location: 'Origin Facility',
          status_description: 'Shipment recorded in manual registry'
        })
        setActiveTab('entries')
        fetchEntries()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create manual entry')
    } finally {
      setCreating(false)
    }
  }

  const handleAddMilestone = async (e) => {
    e.preventDefault()
    if (!selectedEntry) return
    setSavingMilestone(true)
    try {
      const res = await manualEntriesApi.addTrackingEvent(selectedEntry.id, milestoneData)
      if (res?.data?.success) {
        toast.success('Tracking milestone event updated!')
        setMilestoneModalOpen(false)
        setSelectedEntry(null)
        setMilestoneData({ status: 'In Transit', location: '', remarks: '' })
        fetchEntries()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update milestone')
    } finally {
      setSavingMilestone(false)
    }
  }

  const handleDeleteEntry = async (id, awb) => {
    if (!window.confirm(`Are you sure you want to delete entry for AWB ${awb}?`)) return
    try {
      const res = await manualEntriesApi.deleteEntry(id)
      if (res?.data?.success) {
        toast.success(`Entry ${awb} deleted`)
        fetchEntries()
      }
    } catch (err) {
      toast.error('Failed to delete entry')
    }
  }

  const handleTestPublicApi = async () => {
    if (!testAwb.trim()) {
      toast.error('Enter an AWB number to test public API')
      return
    }
    setTestingApi(true)
    setTestResult(null)
    try {
      const url = `/api/v1/manual-vendor/${vendor.vendor_code || 'manual'}/track/${encodeURIComponent(testAwb.trim())}`
      const res = await axios.get(url)
      setTestResult(res.data)
      toast.success('Public API returned successfully!')
    } catch (err) {
      setTestResult(err.response?.data || { error: err.message })
      toast.error('API responded with error / not found')
    } finally {
      setTestingApi(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-surface-alt/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-navy">
                  Manual Entries & REST API Provider
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                  {vendor.name} ({vendor.vendor_code || 'manual'})
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                Record manual shipments for this carrier and expose them via public tracking API for external websites.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-tertiary hover:text-navy transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border bg-surface-alt/20 px-6 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('entries')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'entries'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-navy'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manual Entries ({entries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-navy'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Manual AWB</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api_docs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'api_docs'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-navy'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Public REST API Integration</span>
          </button>
        </div>

        {/* Tab 1: Entries List */}
        {activeTab === 'entries' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search AWB, order ref, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchEntries()}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-secondary"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={fetchEntries}
                  className="p-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-text-tertiary hover:text-navy transition-colors cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Entry</span>
                </button>
              </div>
            </div>

            {/* Entries Table */}
            <div className="flex-1 overflow-y-auto border border-border rounded-xl bg-surface">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-text-tertiary">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                  <span className="text-xs">Loading entries...</span>
                </div>
              ) : entries.length === 0 ? (
                <div className="p-12 text-center text-text-tertiary">
                  <Package className="w-10 h-10 mx-auto mb-2 text-text-tertiary/60" />
                  <p className="text-sm font-bold text-navy">No manual entries found</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Click "Add Manual AWB" to register shipments that external sites can query.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-alt/70 text-text-tertiary font-bold uppercase text-[10px] tracking-wider border-b border-border sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">AWB / Ref</th>
                      <th className="py-2.5 px-3">Sender → Receiver</th>
                      <th className="py-2.5 px-3">Service & Pkg</th>
                      <th className="py-2.5 px-3">Current Status & Location</th>
                      <th className="py-2.5 px-3">Last Updated</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light font-medium">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-alt/30 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-navy block text-xs">
                            {entry.awb_number}
                          </span>
                          {entry.order_ref && (
                            <span className="text-[10px] text-text-tertiary font-mono block">
                              Ref: {entry.order_ref}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-navy font-bold text-xs">
                            {entry.receiver_name || '—'}
                          </div>
                          <div className="text-[10px] text-text-tertiary flex items-center gap-1">
                            <span>{entry.sender_city || 'Origin'}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span>{entry.receiver_city || entry.destination_pincode || 'Dest'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-text-secondary block">
                            {entry.service_code || entry.service_name || 'Standard'}
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {entry.weight_kg} kg • {entry.pieces} pc
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {entry.current_status}
                          </span>
                          <span className="text-[10px] text-text-tertiary block mt-0.5">
                            {entry.current_location || entry.status_description || 'In Transit'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-text-tertiary">
                          {entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEntry(entry)
                                setMilestoneData({
                                  status: entry.current_status || 'In Transit',
                                  location: entry.current_location || '',
                                  remarks: ''
                                })
                                setMilestoneModalOpen(true)
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                              title="Add tracking milestone"
                            >
                              + Milestone
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTestAwb(entry.awb_number)
                                setActiveTab('api_docs')
                              }}
                              className="p-1 text-text-tertiary hover:text-navy rounded-lg hover:bg-surface-alt transition-colors"
                              title="Test API response"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id, entry.awb_number)}
                              className="p-1 text-text-tertiary hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create Manual Entry Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateEntry} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  AWB / Tracking Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEntry.awb_number}
                  onChange={(e) => setNewEntry({ ...newEntry, awb_number: e.target.value })}
                  placeholder="e.g. EXP987654321"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Order / Invoice Reference
                </label>
                <input
                  type="text"
                  value={newEntry.order_ref}
                  onChange={(e) => setNewEntry({ ...newEntry, order_ref: e.target.value })}
                  placeholder="e.g. ORD-2026-001"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Service Type Code
                </label>
                <input
                  type="text"
                  value={newEntry.service_code}
                  onChange={(e) => setNewEntry({ ...newEntry, service_code: e.target.value })}
                  placeholder="e.g. AIR_EXPRESS"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={newEntry.sender_name}
                  onChange={(e) => setNewEntry({ ...newEntry, sender_name: e.target.value })}
                  placeholder="e.g. ABC Enterprises"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Sender City
                </label>
                <input
                  type="text"
                  value={newEntry.sender_city}
                  onChange={(e) => setNewEntry({ ...newEntry, sender_city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Receiver Name
                </label>
                <input
                  type="text"
                  value={newEntry.receiver_name}
                  onChange={(e) => setNewEntry({ ...newEntry, receiver_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Receiver City / Destination
                </label>
                <input
                  type="text"
                  value={newEntry.receiver_city}
                  onChange={(e) => setNewEntry({ ...newEntry, receiver_city: e.target.value })}
                  placeholder="e.g. Bangalore"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Destination Pincode / Zip
                </label>
                <input
                  type="text"
                  value={newEntry.destination_pincode}
                  onChange={(e) => setNewEntry({ ...newEntry, destination_pincode: e.target.value })}
                  placeholder="e.g. 560001"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Weight (KG) & Pieces
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.weight_kg}
                    onChange={(e) => setNewEntry({ ...newEntry, weight_kg: e.target.value })}
                    placeholder="Weight"
                    className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    value={newEntry.pieces}
                    onChange={(e) => setNewEntry({ ...newEntry, pieces: e.target.value })}
                    placeholder="Pieces"
                    className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Initial Status
                </label>
                <select
                  value={newEntry.current_status}
                  onChange={(e) => setNewEntry({ ...newEntry, current_status: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Initial Facility / Location
                </label>
                <input
                  type="text"
                  value={newEntry.current_location}
                  onChange={(e) => setNewEntry({ ...newEntry, current_location: e.target.value })}
                  placeholder="e.g. Central Sorting Hub"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Status Remarks / Description
                </label>
                <input
                  type="text"
                  value={newEntry.status_description}
                  onChange={(e) => setNewEntry({ ...newEntry, status_description: e.target.value })}
                  placeholder="e.g. Shipment booked in system"
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab('entries')}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover border border-border rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Manual Entry</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Public REST API Documentation & Test */}
        {activeTab === 'api_docs' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Code2 className="w-4 h-4" />
                <span>External Integration REST API</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                This endpoint is fully public and can be invoked from WordPress sites, client tracking portals, mobile apps, or backend webhooks without requiring session login cookies. It returns the exact manual entries and milestone history added above.
              </p>
            </div>

            {/* Endpoints List */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary">
                Available REST Endpoints
              </h3>

              {/* Endpoint 1: Single AWB Tracking */}
              <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700">
                      GET
                    </span>
                    <code className="text-xs font-mono font-bold text-navy">
                      /api/v1/manual-vendor/{vendor.vendor_code || 'manual'}/track/:awb
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${publicApiUrl}/AWB_NUMBER`)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy URL</span>
                  </button>
                </div>
                <p className="text-[11px] text-text-tertiary">
                  Returns tracking details, status milestones, destination, and package weights.
                </p>
              </div>

              {/* Endpoint 2: All Vendor Entries */}
              <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                      GET
                    </span>
                    <code className="text-xs font-mono font-bold text-navy">
                      /api/v1/manual-vendor/{vendor.vendor_code || 'manual'}/entries
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/v1/manual-vendor/${vendor.vendor_code || 'manual'}/entries`)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </button>
                </div>
                <p className="text-[11px] text-text-tertiary">
                  Returns all active manual entries registered for this carrier.
                </p>
              </div>
            </div>

            {/* Code Snippet */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary">
                Frontend Javascript (Fetch Example)
              </h3>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`// Call from your WordPress site or custom customer portal
async function trackShipment(awb) {
  const response = await fetch("${publicApiUrl}/" + encodeURIComponent(awb));
  const data = await response.json();
  if (data.success) {
    console.log("Current Status:", data.status);
    console.log("Tracking Milestones:", data.events);
  }
}`}
              </pre>
            </div>

            {/* Live API Tester */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
              <h3 className="text-xs font-bold text-navy flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-primary" />
                Live API Response Tester
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter AWB number to test..."
                  value={testAwb}
                  onChange={(e) => setTestAwb(e.target.value)}
                  className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleTestPublicApi}
                  disabled={testingApi}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  {testingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayIcon className="w-3.5 h-3.5" />}
                  <span>Execute Call</span>
                </button>
              </div>

              {testResult && (
                <div className="mt-3">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Response JSON:</div>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-60">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Add Milestone Event */}
        {milestoneModalOpen && selectedEntry && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fade-in">
            <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-navy">
                    Add Milestone: {selectedEntry.awb_number}
                  </h3>
                  <p className="text-[11px] text-text-tertiary">
                    Appends a new tracking timeline entry visible on the public API.
                  </p>
                </div>
                <button
                  onClick={() => setMilestoneModalOpen(false)}
                  className="p-1 text-text-tertiary hover:text-navy rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMilestone} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    New Status *
                  </label>
                  <select
                    value={milestoneData.status}
                    onChange={(e) => setMilestoneData({ ...milestoneData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Facility / City / Hub Location
                  </label>
                  <input
                    type="text"
                    required
                    value={milestoneData.location}
                    onChange={(e) => setMilestoneData({ ...milestoneData, location: e.target.value })}
                    placeholder="e.g. Bangalore Distribution Hub"
                    className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    Remarks / Milestone Description
                  </label>
                  <input
                    type="text"
                    required
                    value={milestoneData.remarks}
                    onChange={(e) => setMilestoneData({ ...milestoneData, remarks: e.target.value })}
                    placeholder="e.g. Dispatched for final delivery"
                    className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMilestoneModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover border border-border rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMilestone}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {savingMilestone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Milestone</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PlayIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  )
}
