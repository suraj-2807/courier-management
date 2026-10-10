import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portalUsersApi } from '../../api/portalUsers.api'
import { useAuthStore } from '../../store/authStore'
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Lock,
  Key,
  Mail,
  User,
  Power,
  Sliders,
  AlertTriangle,
  Loader2,
  Crown,
  Eye,
  Package,
  Layers,
  Settings,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_CONFIGS = {
  super_admin: {
    label: 'Super Admin',
    desc: 'Full master access to all modules, system configuration, and user permissions.',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    icon: Crown
  },
  admin: {
    label: 'Normal Admin',
    desc: 'Can use all operational & configuration features (unrestricted by default).',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ShieldCheck
  },
  operator: {
    label: 'Operator / Staff',
    desc: 'Day-to-day operations: Shipments, Booking Requests, and Tracking.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Package
  },
  viewer: {
    label: 'Viewer',
    desc: 'Read-only access to operational lists.',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Eye
  }
}

export default function PortalUsersSection() {
  const queryClient = useQueryClient()
  const { user: currentUser, isSuperAdmin } = useAuthStore()
  const userIsSuperAdmin = isSuperAdmin()

  const [activeSubTab, setActiveSubTab] = useState('users') // 'users' | 'permissions'
  const [searchTerm, setSearchTerm] = useState('')

  // Create / Edit User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  })

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState(null)

  // ── Queries ──
  const {
    data: usersData,
    isLoading: loadingUsers,
    isError: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['portal-users'],
    queryFn: () => portalUsersApi.getAll().then((res) => res.data),
    staleTime: 10000
  })

  const {
    data: permsData,
    isLoading: loadingPerms,
    refetch: refetchPerms
  } = useQuery({
    queryKey: ['portal-permissions'],
    queryFn: () => portalUsersApi.getPermissions().then((res) => res.data),
    staleTime: 30000
  })

  // State for editable permissions matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState(null)

  // Sync permissions once fetched
  if (permsData?.permissions && !permissionsMatrix) {
    setPermissionsMatrix(permsData.permissions)
  }

  // ── Mutations ──
  const saveUserMutation = useMutation({
    mutationFn: (payload) => {
      if (editingUser) {
        return portalUsersApi.update(editingUser.id, payload)
      }
      return portalUsersApi.create(payload)
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || (editingUser ? 'User updated successfully' : 'User created successfully'))
      queryClient.invalidateQueries(['portal-users'])
      setIsUserModalOpen(false)
      setEditingUser(null)
      setUserForm({ name: '', email: '', password: '', role: 'admin' })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save user')
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => portalUsersApi.toggleStatus(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Status updated')
      queryClient.invalidateQueries(['portal-users'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to toggle status')
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id) => portalUsersApi.delete(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'User deleted')
      queryClient.invalidateQueries(['portal-users'])
      setDeleteUserId(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  })

  const savePermissionsMutation = useMutation({
    mutationFn: (matrix) => portalUsersApi.updatePermissions(matrix),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Permissions updated successfully')
      queryClient.invalidateQueries(['portal-permissions'])
      // Also refresh the current user permissions in store
      useAuthStore.getState().fetchPermissions()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update permissions')
    }
  })

  // ── Handlers ──
  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setUserForm({ name: '', email: '', password: '', role: 'admin' })
    setIsUserModalOpen(true)
  }

  const handleOpenEditModal = (u) => {
    setEditingUser(u)
    setUserForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role
    })
    setIsUserModalOpen(true)
  }

  const handleUserFormSubmit = (e) => {
    e.preventDefault()
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    if (!editingUser && !userForm.password.trim()) {
      toast.error('Password is required for new users')
      return
    }

    const payload = {
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      role: userForm.role
    }
    if (userForm.password.trim()) {
      payload.password = userForm.password.trim()
    }

    saveUserMutation.mutate(payload)
  }

  const handlePermissionToggle = (role, moduleKey) => {
    setPermissionsMatrix((prev) => {
      const currentVal = prev?.[role]?.[moduleKey] ?? false
      return {
        ...prev,
        [role]: {
          ...(prev?.[role] || {}),
          [moduleKey]: !currentVal
        }
      }
    })
  }

  const handleSavePermissions = () => {
    if (!permissionsMatrix) return
    savePermissionsMutation.mutate(permissionsMatrix)
  }

  // Filtered list
  const usersList = usersData?.users || []
  const filteredUsers = usersList.filter((u) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase().trim()
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    )
  })

  const superAdminCount = usersList.filter((u) => u.role === 'super_admin').length
  const adminCount = usersList.filter((u) => u.role === 'admin').length
  const operatorCount = usersList.filter((u) => u.role === 'operator').length

  return (
    <div className="space-y-6">
      {/* ── Top Header and Sub-Tab Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E8ED] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111827]">
              Portal Team & Role Access
            </h2>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              {usersList.length} Active Accounts
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Super Admin controls module permissions, creates Normal Admins (with full access), and manages staff roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {userIsSuperAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Normal Admin / Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Team Accounts ── */}
      <div className="space-y-5">
        <div className="space-y-5">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#E5E8ED] rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6B7280]">Total Users</span>
              <div className="text-xl font-extrabold text-[#111827] mt-0.5">{usersList.length}</div>
            </div>
            <div className="bg-white border border-[#E5E8ED] rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6B7280]">Normal Admins</span>
              <div className="text-xl font-extrabold text-primary mt-0.5">{adminCount}</div>
            </div>
            <div className="bg-white border border-[#E5E8ED] rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6B7280]">Super Admins</span>
              <div className="text-xl font-extrabold text-primary mt-0.5">{superAdminCount}</div>
            </div>
            <div className="bg-white border border-[#E5E8ED] rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-[#6B7280]">Operators</span>
              <div className="text-xl font-extrabold text-amber-600 mt-0.5">{operatorCount}</div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white border border-[#E5E8ED] rounded-2xl overflow-hidden shadow-xs">
            {/* Search Filter Header */}
            <div className="p-4 border-b border-[#E5E8ED] flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#111827] placeholder-[#9CA3AF] w-full focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-xs text-[#9CA3AF]">
                Showing {filteredUsers.length} of {usersList.length} accounts
              </span>
            </div>

            {loadingUsers ? (
              <div className="py-16 text-center text-[#9CA3AF]">
                <Loader2 className="w-7 h-7 mx-auto animate-spin text-primary mb-2" />
                <p className="text-xs">Loading portal users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-[#9CA3AF]">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold text-[#4B5563]">No users match criteria</p>
                <p className="text-[11px] mt-0.5">Use "+ Create Normal Admin / Staff" above to add new members</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E8ED] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role & Privileges</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered Date</th>
                      {userIsSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F5F8] text-xs">
                    {filteredUsers.map((u) => {
                      const roleConfig = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.operator
                      const RoleIcon = roleConfig.icon
                      const isSelf = u.id === currentUser?.id
                      const isActive = u.is_active === 1 || u.is_active === true

                      return (
                        <tr key={u.id} className="hover:bg-[#F9FAFB]/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-primary/20">
                                {(u.name || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#111827] flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded-full border border-slate-200">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#6B7280] truncate">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleConfig.badgeClass}`}>
                              <RoleIcon className="w-3.5 h-3.5" />
                              {roleConfig.label}
                            </span>
                            <div className="text-[10px] text-[#9CA3AF] mt-0.5 truncate max-w-xs">
                              {roleConfig.desc}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isActive ? 'bg-primary ring-2 ring-primary/20' : 'bg-gray-300'
                                }`}
                              />
                              <span className={`font-semibold ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                {isActive ? 'Active' : 'Deactivated'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#9CA3AF]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : '—'}
                          </td>

                          {userIsSuperAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(u)}
                                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F8] transition-colors cursor-pointer"
                                  title="Edit User & Password"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {!isSelf && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => toggleStatusMutation.mutate(u.id)}
                                      disabled={toggleStatusMutation.isPending}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isActive
                                          ? 'text-amber-600 hover:bg-amber-50'
                                          : 'text-primary hover:bg-primary/10'
                                      }`}
                                      title={isActive ? 'Deactivate User' : 'Activate User'}
                                    >
                                      <Power className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setDeleteUserId(u.id)}
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Create / Edit User ── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E8ED] animate-scale-in">
            <div className="px-5 py-4 border-b border-[#E5E8ED] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    {editingUser ? 'Edit Portal User' : 'Create Normal Admin / Staff'}
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    {editingUser ? 'Update user details or assign new role' : 'Add account with specified access tier'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded-lg hover:bg-[#F4F5F8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="rachel@courierexpress.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  {editingUser ? 'New Password (leave empty to keep unchanged)' : 'Password *'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                    required={!editingUser}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111827] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Assigned Role & Privilege Tier *
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'admin',
                      label: 'Normal Admin',
                      desc: 'Full operational & configuration access (can use all features)',
                      icon: ShieldCheck,
                      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    },
                    {
                      id: 'operator',
                      label: 'Operator / Staff',
                      desc: 'Standard operations: Bookings, Tracking, and Customer Requests',
                      icon: Package,
                      color: 'text-amber-700 bg-amber-50 border-amber-200'
                    },
                    {
                      id: 'viewer',
                      label: 'Viewer',
                      desc: 'Read-only view without modification authority',
                      icon: Eye,
                      color: 'text-slate-700 bg-slate-50 border-slate-200'
                    },
                    ...(userIsSuperAdmin
                      ? [
                          {
                            id: 'super_admin',
                            label: 'Super Admin',
                            desc: 'Master access over users, security, and setup wizard',
                            icon: Crown,
                            color: 'text-primary bg-primary/10 border-primary/20'
                          }
                        ]
                      : [])
                  ].map((r) => {
                    const isSelected = userForm.role === r.id
                    const Icon = r.icon
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-xs'
                            : 'border-[#E5E8ED] hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.id}
                          checked={isSelected}
                          onChange={() => setUserForm({ ...userForm, role: r.id })}
                          className="mt-0.5 text-primary focus:ring-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-[#111827]">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                            <span>{r.label}</span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{r.desc}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F4F5F8]">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F4F5F8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveUserMutation.isPending}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {saveUserMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingUser ? 'Update Account' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ── */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-[#E5E8ED] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Delete User Account?</h3>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Are you sure you want to delete this user? Their login session will be revoked immediately. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteUserId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F4F5F8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteUserMutation.mutate(deleteUserId)}
                disabled={deleteUserMutation.isPending}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {deleteUserMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
