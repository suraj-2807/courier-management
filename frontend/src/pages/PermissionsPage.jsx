import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portalUsersApi } from '../api/portalUsers.api'
import { systemSettingsApi } from '../api/systemSettings.api'
import { useAuthStore } from '../store/authStore'
import {
  ShieldCheck,
  Crown,
  Package,
  Eye,
  Check,
  X,
  Loader2,
  Settings,
  Wallet,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PermissionsPage() {
  const queryClient = useQueryClient()
  const { isSuperAdmin, isAdmin } = useAuthStore()
  const canManagePermissions = isAdmin()

  // ── 1. Fetch System Settings (for the two operational toggles) ──
  const {
    data: sysSettingsData,
    isLoading: loadingSysSettings,
    refetch: refetchSysSettings
  } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => systemSettingsApi.getAll(),
    staleTime: 10000
  })

  const systemSettings = sysSettingsData?.settings || {}

  const updateSysSettingsMutation = useMutation({
    mutationFn: (payload) => systemSettingsApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['system-settings'])
      toast.success('Setting updated successfully')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update setting')
    }
  })

  // ── 2. Fetch Role Permissions Matrix ──
  const {
    data: permsData,
    isLoading: loadingPerms,
    refetch: refetchPerms
  } = useQuery({
    queryKey: ['portal-permissions'],
    queryFn: () => portalUsersApi.getPermissions().then((res) => res.data),
    staleTime: 30000
  })

  const [permissionsMatrix, setPermissionsMatrix] = useState(null)

  // Sync permissions once fetched
  if (permsData?.permissions && !permissionsMatrix) {
    setPermissionsMatrix(permsData.permissions)
  }

  const savePermissionsMutation = useMutation({
    mutationFn: (matrix) => portalUsersApi.savePermissions(matrix),
    onSuccess: () => {
      toast.success('Permissions saved successfully')
      queryClient.invalidateQueries(['portal-permissions'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save permissions')
    }
  })

  const handlePermissionToggle = (role, moduleKey) => {
    if (!canManagePermissions) {
      toast.error('Administrator privileges required to modify permissions')
      return
    }

    setPermissionsMatrix((prev) => {
      const currentRolePerms = prev?.[role] || {}
      const currentValue = currentRolePerms[moduleKey] !== false // Default true for admin
      return {
        ...prev,
        [role]: {
          ...currentRolePerms,
          [moduleKey]: !currentValue
        }
      }
    })
  }

  const handleSavePermissions = () => {
    if (!permissionsMatrix) return
    savePermissionsMutation.mutate(permissionsMatrix)
  }

  const allowPostPush = Boolean(systemSettings.allow_post_push_billing_edit)
  const enableAccounting = Boolean(systemSettings.enable_accounting)

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-navy tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            Permissions & Access Control
          </h1>
          <p className="text-[13px] text-text-tertiary mt-1">
            Configure access rights and module privileges across staff roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchPerms()
              refetchSysSettings()
              toast.success('Permissions refreshed')
            }}
            className="px-3.5 py-2 text-xs font-bold text-text-secondary bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={handleSavePermissions}
            disabled={savePermissionsMutation.isPending || !permissionsMatrix}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {savePermissionsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Permissions
          </button>
        </div>
      </div>

      {/* ── Operational & Access Overrides (Post-Push Billing & Customer Accounting) ── */}
      <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Operational & Accounting Policies
          </h2>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Global settings that control billing policies and financial features across the system.
          </p>
        </div>

        {/* Setting 1: Allow Post-Push Billing & Rate Editing */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-surface-alt/70 border border-border-light transition-all">
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[14px] font-extrabold text-navy">
                  Allow Post-Push Billing & Rate Editing
                </h3>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  allowPostPush
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {allowPostPush ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[12px] text-text-tertiary mt-1 leading-relaxed">
                When enabled, staff can edit billing fields such as <strong>Chargeable Weight</strong>, <strong>Rate / Kg</strong>, <strong>Shipping Charge</strong>, <strong>Extra Charge</strong>, and <strong>Final Shipping</strong> on shipments — even after they have been confirmed and locked. Changes are saved and synced automatically.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const newVal = !allowPostPush
              updateSysSettingsMutation.mutate({
                key: 'allow_post_push_billing_edit',
                value: newVal,
                description: 'Allow editing Final Chargeable Weight, Rate/Kg, Shipping Charge, Extra Charge, and Final Shipping on locked/pushed shipments'
              })
            }}
            disabled={updateSysSettingsMutation.isPending || loadingSysSettings}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex-shrink-0 self-start md:self-center ${
              allowPostPush
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
            }`}
          >
            {allowPostPush ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Disabled</span>
              </>
            )}
          </button>
        </div>

        {/* Setting 2: Customer Accounting & Debit/Credit Ledger */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-surface-alt/70 border border-border-light transition-all">
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-200">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[14px] font-extrabold text-navy">
                  Customer Accounting & Debit/Credit Ledger
                </h3>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  enableAccounting
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {enableAccounting ? 'ENABLED' : 'DISABLED (DEFAULT)'}
                </span>
              </div>
              <p className="text-[12px] text-text-tertiary mt-1 leading-relaxed">
                Enables the accounting module with customer balance tracking, payment recording, and transaction history. Customers will see their account statements on their dashboard. When disabled, customers see only their standard shipment portal.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const newVal = !enableAccounting
              updateSysSettingsMutation.mutate({
                key: 'enable_accounting',
                value: newVal,
                description: 'Enable customer debit/credit accounting ledger, balance tracking, and customer accounting statements'
              })
            }}
            disabled={updateSysSettingsMutation.isPending || loadingSysSettings}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex-shrink-0 self-start md:self-center ${
              enableAccounting
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-xs'
                : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
            }`}
          >
            {enableAccounting ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Disabled</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Role & Module Permissions Matrix ── */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Role & Module Access Matrix
            </h2>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Click any toggle to grant or restrict specific modules for Admins, Operators, or Viewers.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-text-tertiary flex items-center gap-1.5 bg-surface-alt px-3 py-1.5 rounded-lg border border-border-light self-start">
            <Info className="w-3.5 h-3.5 text-primary" />
            Super Admins always retain full master access to all modules.
          </div>
        </div>

        {loadingPerms ? (
          <div className="py-20 text-center">
            <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-text-tertiary font-medium">Loading permissions matrix...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-alt/70 border-b border-border text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-1/3">Portal Module & Capability</th>
                  <th className="py-3.5 px-4 text-center">
                    <div className="font-bold text-primary flex items-center justify-center gap-1">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </div>
                    <div className="text-[10px] text-primary/70 font-normal mt-0.5">Master Access</div>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <div className="font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-normal mt-0.5">Full access by default</div>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <div className="font-bold text-amber-700 flex items-center justify-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      <span>Operator</span>
                    </div>
                    <div className="text-[10px] text-amber-600 font-normal mt-0.5">Staff Day-to-Day</div>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <div className="font-bold text-slate-700 flex items-center justify-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Viewer</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Read-Only</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[13px]">
                {(permsData?.modules || []).map((m) => {
                  const adminAllowed = permissionsMatrix?.admin?.[m.key] !== false
                  const operatorAllowed = permissionsMatrix?.operator?.[m.key] === true
                  const viewerAllowed = permissionsMatrix?.viewer?.[m.key] === true

                  return (
                    <tr key={m.key} className="hover:bg-surface-alt/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-navy text-[13px]">{m.label}</div>
                        <div className="text-[11px] text-text-tertiary mt-0.5">{m.description}</div>
                      </td>

                      {/* Super Admin: Always Granted */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Always Granted
                        </span>
                      </td>

                      {/* Normal Admin */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePermissionToggle('admin', m.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            adminAllowed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {adminAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Accessible</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>Restricted</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Operator */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePermissionToggle('operator', m.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            operatorAllowed
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-50 text-text-tertiary border-border hover:bg-surface'
                          }`}
                        >
                          {operatorAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Accessible</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>Restricted</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Viewer */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePermissionToggle('viewer', m.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            viewerAllowed
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-slate-50 text-text-tertiary border-border hover:bg-surface'
                          }`}
                        >
                          {viewerAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Accessible</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>Restricted</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Save Bar */}
        <div className="p-4 bg-surface-alt/70 border-t border-border flex items-center justify-between">
          <span className="text-[12px] text-text-tertiary">
            Changes will take effect immediately upon saving.
          </span>
          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={savePermissionsMutation.isPending || !permissionsMatrix}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {savePermissionsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save Permissions Matrix</span>
          </button>
        </div>
      </div>
    </div>
  )
}
