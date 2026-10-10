import express from 'express'
import { execute, query } from '../config/db.js'

import authRoutes from '../modules/auth/auth.routes.js'
import senderRoutes from '../modules/senders/sender.routes.js'
import receiverRoutes from '../modules/receivers/receiver.routes.js'
import bookingRoutes from '../modules/bookings/booking.routes.js'
import trackingRoutes from '../modules/tracking/tracking.routes.js'
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js'
import apiSettingsRoutes from '../modules/apiSettings/apiSettings.routes.js'
import ratesRoutes from '../modules/rates/rates.routes.js'
import bookingRequestRoutes from '../modules/bookingRequests/bookingRequest.routes.js'
import countryCodeRoutes from '../modules/countryCodes/countryCode.routes.js'
import systemSettingsRoutes from '../modules/systemSettings/systemSettings.routes.js'
import productRoutes from '../modules/products/product.routes.js'
import customersRoutes from '../modules/customer/customers.routes.js'
import vendorRateImportRoutes from '../modules/vendorRateImport/vendorRateImport.routes.js'
import setupRoutes from '../modules/setup/setup.routes.js'
import usersRoutes from '../modules/users/users.routes.js'
import manualEntriesRoutes, { publicManualVendorRouter } from '../modules/manualEntries/manualEntries.routes.js'
import supportRoutes from '../modules/support/support.routes.js'

const router = express.Router()

router.use('/setup', setupRoutes)

router.get('/health', (req, res) => {
  return res.json({
    success: true,
    message: 'Courier API running successfully'
  })
})

router.use('/auth', authRoutes)
router.use('/portal-users', usersRoutes)
router.use('/users', usersRoutes)
router.use('/senders', senderRoutes)
router.use('/receivers', receiverRoutes)
router.use('/bookings', bookingRoutes)
router.use('/tracking', trackingRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/api-settings', apiSettingsRoutes)
router.use('/manual-entries', manualEntriesRoutes)
router.use('/v1/manual-vendor', publicManualVendorRouter)
router.use('/system-settings', systemSettingsRoutes)
router.use('/rates', ratesRoutes)
router.use('/booking-requests', bookingRequestRoutes)
router.use('/country-codes', countryCodeRoutes)
router.use('/products', productRoutes)
router.use('/customers', customersRoutes)
router.use('/vendor-rate-imports', vendorRateImportRoutes)
router.use('/support', supportRoutes)

// Public Customer endpoints (for WP Portal iframe & Customer Portal)
import { createBooking, getBoxLabelsPdf, getWaybillPdf, getInvoicePdf } from '../modules/bookings/booking.controller.js'
import { getActiveVendors } from '../modules/apiSettings/apiSettings.controller.js'
import { createBookingRequest, getCustomerRequests, getCustomerRequest, cancelBookingRequest } from '../modules/bookingRequests/bookingRequest.controller.js'
import customerRoutes from '../modules/customer/customer.routes.js'

const customerRouter = express.Router()
customerRouter.get('/active-vendors', getActiveVendors)
customerRouter.post('/bookings', createBooking)
customerRouter.post('/booking-requests', createBookingRequest)
customerRouter.post('/booking-requests/cancel', cancelBookingRequest)
customerRouter.get('/my-requests', getCustomerRequests)
customerRouter.get('/my-requests/:request_awb', getCustomerRequest)
customerRouter.get('/labels-pdf/:id', getBoxLabelsPdf)
customerRouter.get('/waybill-pdf/:id', getWaybillPdf)
customerRouter.get('/invoice-pdf/:id', getInvoicePdf)
customerRouter.use('/', customerRoutes)
router.use('/customer', customerRouter)

export default router