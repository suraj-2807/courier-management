import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import SuperAdminRoute from './SuperAdminRoute'
import PermissionRoute from './PermissionRoute'
import DashboardLayout from '../layouts/DashboardLayout'

import SetupPage from '../pages/SetupPage'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import BookingsPage from '../pages/BookingsPage'
import BookingDetailPage from '../pages/BookingDetailPage'
import NewBookingPage from '../pages/NewBookingPage'
import TrackingPage from '../pages/TrackingPage'
import ApiSettingsPage from '../pages/ApiSettingsPage'
import RatesPage from '../pages/RatesPage'
import CustomerBookingPage from '../pages/CustomerBookingPage'
import BookingRequestsPage from '../pages/BookingRequestsPage'
import UsersPage from '../pages/UsersPage'
import ProductsPage from '../pages/ProductsPage'
import CustomersPage from '../pages/CustomersPage'
import VendorRateImportPage from '../pages/VendorRateImportPage'
import PermissionsPage from '../pages/PermissionsPage'
import SettingsPage from '../pages/SettingsPage'

import { useBrandingStore } from '../store/brandingStore'
import { getSetupStatus } from '../api/setup.api'

export default function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const { fetchBranding } = useBrandingStore()

  useEffect(() => {
    fetchBranding()

    // Check if portal is already installed or requires setup wizard
    const checkInstallation = async () => {
      try {
        const res = await getSetupStatus()
        if (res && res.isInstalled === false) {
          if (!location.pathname.startsWith('/setup') && !location.pathname.startsWith('/customer/')) {
            navigate('/setup')
          }
        } else if (res && res.isInstalled === true) {
          if (location.pathname === '/setup' && !location.search.includes('reset=true')) {
            navigate('/settings', { replace: true })
          }
        }
      } catch (err) {
        if (!location.pathname.startsWith('/setup') && !location.pathname.startsWith('/customer/')) {
          navigate('/setup')
        }
      }
    }

    checkInstallation()
  }, [])

  return (
    <Routes>
      {/* Installation / Setup Wizard — Super Admin only once installed */}
      <Route path="/setup" element={<SetupPage />} />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* ═══ Protected routes (all authenticated users) ═══ */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CustomersPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <BookingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/new"
        element={
          <ProtectedRoute>
            <NewBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/edit/:id"
        element={
          <ProtectedRoute>
            <NewBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <BookingDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TrackingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking-requests"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <BookingRequestsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UsersPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ═══ Configuration & Admin Routes (Permitted for Normal Admin & Super Admin) ═══ */}
      <Route
        path="/api-settings"
        element={
          <PermissionRoute module="api_settings">
            <DashboardLayout>
              <ApiSettingsPage />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/rates"
        element={
          <PermissionRoute module="rates">
            <DashboardLayout>
              <RatesPage />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/vendor-rate-import"
        element={
          <PermissionRoute module="vendor_rate_import">
            <DashboardLayout>
              <VendorRateImportPage />
            </DashboardLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PermissionRoute module="products">
            <DashboardLayout>
              <ProductsPage />
            </DashboardLayout>
          </PermissionRoute>
        }
      />

      <Route
        path="/permissions"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <PermissionsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/senders"
        element={<Navigate to="/users" replace />}
      />

      {/* Customer-facing routes (public — auth handled by WP plugin) */}
      <Route path="/customer/booking" element={<CustomerBookingPage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
