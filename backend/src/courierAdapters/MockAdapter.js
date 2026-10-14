import BaseAdapter from './BaseAdapter.js'

/**
 * MockAdapter — Sandbox Simulator Adapter for Testing
 * 
 * Allows end-to-end testing of shipment booking, waybills, labels, and tracking
 * without making external network requests to live carrier APIs.
 */
export default class MockAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config || {
      name: 'Mock Test Carrier',
      vendor_code: 'mock_courier',
      environment: 'test',
      is_active: true
    })
  }

  async authenticate() {
    return {
      token: `mock_test_token_${Date.now()}`,
      customerId: 'MOCK-CUST-001',
      environment: 'sandbox'
    }
  }

  buildPayload(shipmentData, authContext) {
    return {
      test_mode: true,
      simulation: true,
      sender: {
        name: shipmentData.sender_name || 'Test Sender',
        phone: shipmentData.sender_phone || '9999999999',
        city: shipmentData.sender_city || 'SURAT',
        pincode: shipmentData.sender_pincode || '395001'
      },
      receiver: {
        name: shipmentData.receiver_name || 'Test Receiver',
        phone: shipmentData.receiver_phone || '8888888888',
        city: shipmentData.receiver_city || 'MUMBAI',
        pincode: shipmentData.receiver_pincode || '400001'
      },
      shipment: {
        weight: shipmentData.weight || '1.0',
        chargeable_weight: shipmentData.chargeable_weight || '1.0',
        package_type: shipmentData.package_type || 'SPX',
        service_code: shipmentData.service_code || 'EXP'
      },
      auth: authContext
    }
  }

  buildHeaders(authContext) {
    return {
      'Content-Type': 'application/json',
      'X-Mock-Sandbox': 'true',
      'Authorization': `Bearer ${authContext?.token || 'mock_token'}`
    }
  }

  parseResponse(responseBody) {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000)
    const awbNumber = responseBody?.awbNumber || responseBody?.awb || `TEST-MOCK-${randomDigits}`
    const forwardingNumber = responseBody?.forwardingNumber || `FWD-${randomDigits}`
    return {
      success: true,
      awbNumber,
      forwardingNumber,
      trackingUrl: `https://mock-carrier.test/track?awb=${awbNumber}`,
      labelUrl: '',
      errorMessage: null
    }
  }

  async getServiceCodes() {
    return [
      { code: 'EXP', label: 'Express Air (Simulated)' },
      { code: 'STD', label: 'Standard Surface (Simulated)' },
      { code: 'ECO', label: 'Economy International (Simulated)' }
    ]
  }

  getShipmentUrl() {
    return 'https://sandbox.mock-carrier.local/v1/shipments/create'
  }

  getHttpMethod() {
    return 'POST'
  }
}
