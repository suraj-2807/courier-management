import bcrypt from 'bcryptjs'
import { execute, query } from '../../config/db.js'

/**
 * Get current demo data count status
 */
export async function getDemoDataStatus(req, res) {
  try {
    const [shipmentCount] = await query("SELECT COUNT(*) as count FROM shipments WHERE tracking_number LIKE 'DEMO-%'")
    const [userCount] = await query("SELECT COUNT(*) as count FROM users WHERE email LIKE '%@demo.courier.internal'")
    const [manualCount] = await query("SELECT COUNT(*) as count FROM manual_vendor_entries WHERE awb_number LIKE 'DEMO-%'")

    let senderCount = { count: 0 }
    let receiverCount = { count: 0 }
    try {
      const [sRes] = await query("SELECT COUNT(*) as count FROM senders WHERE email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
      senderCount = sRes || { count: 0 }
    } catch (e) {}

    try {
      const [rRes] = await query("SELECT COUNT(*) as count FROM receivers WHERE email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
      receiverCount = rRes || { count: 0 }
    } catch (e) {}

    const hasDemoData = (
      (shipmentCount?.count || 0) > 0 ||
      (userCount?.count || 0) > 0 ||
      (manualCount?.count || 0) > 0 ||
      (senderCount?.count || 0) > 0 ||
      (receiverCount?.count || 0) > 0
    )

    return res.json({
      success: true,
      hasDemoData,
      counts: {
        shipments: shipmentCount?.count || 0,
        users: userCount?.count || 0,
        manualEntries: manualCount?.count || 0,
        senders: senderCount?.count || 0,
        receivers: receiverCount?.count || 0
      }
    })
  } catch (err) {
    console.error('[getDemoDataStatus error]:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Seed 10 demo entries across Users, Senders, Receivers, Shipments, Tracking Events, and Manual Vendor Entries
 */
export async function seedDemoData(req, res) {
  try {
    // 0. Ensure senders and receivers tables exist
    try {
      await execute(`CREATE TABLE IF NOT EXISTS senders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(150) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        phone_2 VARCHAR(50) DEFAULT '',
        email VARCHAR(150) DEFAULT '',
        address TEXT DEFAULT NULL,
        address_2 VARCHAR(255) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        state VARCHAR(100) DEFAULT '',
        pincode VARCHAR(20) DEFAULT '',
        country VARCHAR(100) DEFAULT 'INDIA',
        gstin_type VARCHAR(50) DEFAULT '',
        gstin_no VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sender_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
      await execute(`CREATE TABLE IF NOT EXISTS receivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(150) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        phone_2 VARCHAR(50) DEFAULT '',
        email VARCHAR(150) DEFAULT '',
        address TEXT DEFAULT NULL,
        address_2 VARCHAR(255) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        state VARCHAR(100) DEFAULT '',
        pincode VARCHAR(20) DEFAULT '',
        country VARCHAR(100) DEFAULT '',
        gstin_type VARCHAR(50) DEFAULT '',
        gstin_no VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_receiver_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
    } catch (tblErr) {}

    // 1. Purge any previous demo data first to avoid duplicate keys
    await execute("DELETE FROM tracking_events WHERE shipment_id IN (SELECT id FROM shipments WHERE tracking_number LIKE 'DEMO-%')")
    await execute("DELETE FROM shipments WHERE tracking_number LIKE 'DEMO-%'")
    await execute("DELETE FROM manual_vendor_entries WHERE awb_number LIKE 'DEMO-%'")
    await execute("DELETE FROM users WHERE email LIKE '%@demo.courier.internal'")
    try {
      await execute("DELETE FROM senders WHERE email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
    } catch (e) {}
    try {
      await execute("DELETE FROM receivers WHERE email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
    } catch (e) {}
    try {
      await execute("DELETE FROM customer_addresses WHERE customer_email LIKE '%@demo.courier.internal' OR email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
    } catch (e) {}

    // 2. Seed 10 Demo Users
    const demoPasswordHash = await bcrypt.hash('DemoPass@2026', 10)
    const demoUsers = [
      { name: 'Demo Rajesh Mehta', email: 'rajesh.mehta@demo.courier.internal', role: 'admin' },
      { name: 'Demo Sarah Jenkins', email: 'sarah.jenkins@demo.courier.internal', role: 'operator' },
      { name: 'Demo Tariq Mansoor', email: 'tariq.mansoor@demo.courier.internal', role: 'operator' },
      { name: 'Demo Elena Rostova', email: 'elena.rostova@demo.courier.internal', role: 'viewer' },
      { name: 'Demo Vikram Singhania', email: 'vikram.s@demo.courier.internal', role: 'operator' },
      { name: 'Demo Chloe Dupont', email: 'chloe.dupont@demo.courier.internal', role: 'admin' },
      { name: 'Demo Amit Deshmukh', email: 'amit.d@demo.courier.internal', role: 'operator' },
      { name: 'Demo Jessica Taylor', email: 'jessica.t@demo.courier.internal', role: 'viewer' },
      { name: 'Demo Marcus Vance', email: 'marcus.vance@demo.courier.internal', role: 'operator' },
      { name: 'Demo Pooja Nair', email: 'pooja.nair@demo.courier.internal', role: 'admin' }
    ]

    for (const u of demoUsers) {
      await execute(
        "INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, 1)",
        [u.name, u.email, demoPasswordHash, u.role]
      )
    }

    // 2b. Seed 10 Demo Senders (Addresses)
    const demoSenders = [
      {
        name: 'Demo Apex Exports Ltd',
        company: 'Apex Exports Ltd',
        phone: '+91 98200 11223',
        phone_2: '+91 98200 11224',
        email: 'dispatch@apexexports.demo.courier.internal',
        address: 'Plot 42, MIDC Industrial Area, Andheri East',
        address_2: 'Near SEEPZ Gate No 2',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400093',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '27AABCA1234F1Z5'
      },
      {
        name: 'Demo Indo-British Silk Traders',
        company: 'Indo-British Silk Traders Pvt Ltd',
        phone: '+91 98390 44556',
        phone_2: '',
        email: 'orders@indobritishsilk.demo.courier.internal',
        address: '12 Chowk Godowlia, Silk Market Lane',
        address_2: 'Suite 3B',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        pincode: '221001',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '09AABCU4567G1Z8'
      },
      {
        name: 'Demo Himalayan Organic Teas',
        company: 'Himalayan Organic Teas Estate',
        phone: '+91 94340 78901',
        phone_2: '',
        email: 'sales@himalayantea.demo.courier.internal',
        address: 'Tea Board Road, Glenburn Division',
        address_2: 'Estate House No 4',
        city: 'Darjeeling',
        state: 'West Bengal',
        pincode: '734101',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '19AABCH7890H1Z2'
      },
      {
        name: 'Demo Deccan Precision Tools',
        company: 'Deccan Precision Tools LLP',
        phone: '+91 98450 67890',
        phone_2: '+91 98450 67899',
        email: 'logistics@deccanprecision.demo.courier.internal',
        address: '5th Phase, Peenya Industrial Area',
        address_2: 'Plot 108/A, 2nd Cross',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560058',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '29AABCD5432J1Z1'
      },
      {
        name: 'Demo Gujarat Diamond Craft',
        company: 'Gujarat Diamond Craft Ltd',
        phone: '+91 98250 33445',
        phone_2: '',
        email: 'exports@gujaratdiamond.demo.courier.internal',
        address: 'Surat Diamond Bourse, Tower C',
        address_2: 'Khajod Dream City',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395007',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '24AABCG9876K1Z9'
      },
      {
        name: 'Demo Malabar Spice Exporters',
        company: 'Malabar Spice Exporters Co',
        phone: '+91 94470 55667',
        phone_2: '',
        email: 'shipping@malabarspice.demo.courier.internal',
        address: 'Willingdon Island Wharf 6',
        address_2: 'Spice Exchange Building',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682003',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '32AABCM6543L1Z4'
      },
      {
        name: 'Demo Jaipur Royal Handicrafts',
        company: 'Jaipur Royal Handicrafts',
        phone: '+91 98290 88990',
        phone_2: '',
        email: 'dispatch@jaipurcrafts.demo.courier.internal',
        address: 'MI Road, Near Ajmeri Gate',
        address_2: 'Heritage Arcade Floor 2',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '08AABCJ1122M1Z7'
      },
      {
        name: 'Demo Chennai Auto Tech Corp',
        company: 'Chennai Auto Tech Corporation',
        phone: '+91 98400 22334',
        phone_2: '+91 98400 22335',
        email: 'cargo@chennaiauto.demo.courier.internal',
        address: 'SIPCOT Industrial Park, Phase II',
        address_2: 'Sriperumbudur corridor',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '602105',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '33AABCC3344N1Z3'
      },
      {
        name: 'Demo Punjab Agro Foodworks',
        company: 'Punjab Agro Foodworks Ltd',
        phone: '+91 98140 66778',
        phone_2: '',
        email: 'supply@punjabagro.demo.courier.internal',
        address: 'GT Road, Focal Point Phase IV',
        address_2: 'Grain Silo Complex 8',
        city: 'Ludhiana',
        state: 'Punjab',
        pincode: '141010',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '03AABCP5566P1Z6'
      },
      {
        name: 'Demo Hyderabad Biotech Labs',
        company: 'Hyderabad Biotech Labs LLP',
        phone: '+91 98490 99001',
        phone_2: '+91 98490 99002',
        email: 'pharma@hydbiotech.demo.courier.internal',
        address: 'Genome Valley, Shamirpet',
        address_2: 'Bio-Research Park Block B',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500078',
        country: 'INDIA',
        gstin_type: 'GSTIN',
        gstin_no: '36AABCH7788Q1Z0'
      }
    ]

    for (const s of demoSenders) {
      await execute(
        `INSERT INTO senders (name, company, phone, phone_2, email, address, address_2, city, state, pincode, country, gstin_type, gstin_no)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.name, s.company, s.phone, s.phone_2, s.email, s.address, s.address_2, s.city, s.state, s.pincode, s.country, s.gstin_type, s.gstin_no]
      )
    }

    // 2c. Seed 10 Demo Receivers (Addresses)
    const demoReceivers = [
      {
        name: 'Demo Nexus Global Logistics LLC',
        company: 'Nexus Global Logistics LLC',
        phone: '+1 212 555 0192',
        phone_2: '+1 212 555 0193',
        email: 'ny-inbound@nexuslogistics.demo.courier.internal',
        address: '450 Lexington Avenue, 14th Floor',
        address_2: 'Grand Central Terminal District',
        city: 'New York',
        state: 'NY',
        pincode: '10001',
        country: 'USA',
        gstin_type: 'Tax ID / EIN',
        gstin_no: '13-5849201'
      },
      {
        name: 'Demo Kensington Fabrics Ltd',
        company: 'Kensington Fabrics Ltd',
        phone: '+44 20 7946 0912',
        phone_2: '',
        email: 'warehouse@kensingtonfabrics.demo.courier.internal',
        address: '77 St John Street, Clerkenwell',
        address_2: 'Docklands Distribution Hub',
        city: 'London',
        state: 'Greater London',
        pincode: 'EC1A 1BB',
        country: 'UNITED KINGDOM',
        gstin_type: 'VAT',
        gstin_no: 'GB 987 6543 21'
      },
      {
        name: 'Demo Al-Mirfa General Trading LLC',
        company: 'Al-Mirfa General Trading LLC',
        phone: '+971 4 321 4567',
        phone_2: '+971 50 123 4567',
        email: 'customs@almirfatrading.demo.courier.internal',
        address: 'Warehouse 18, Al Quoz Industrial Area 3',
        address_2: 'Sheikh Zayed Road Access',
        city: 'Dubai',
        state: 'Dubai',
        pincode: '48201',
        country: 'UNITED ARAB EMIRATES',
        gstin_type: 'TRN',
        gstin_no: '100234567800003'
      },
      {
        name: 'Demo Bavaria Precision Engineering',
        company: 'Bavaria Precision Engineering GmbH',
        phone: '+49 89 2444 8901',
        phone_2: '',
        email: 'wareneingang@bavariaeng.demo.courier.internal',
        address: 'Leopoldstraße 154, Tor 3',
        address_2: 'Technopark Schwabing',
        city: 'Munich',
        state: 'Bavaria',
        pincode: '80804',
        country: 'GERMANY',
        gstin_type: 'USt-IdNr',
        gstin_no: 'DE 812345678'
      },
      {
        name: 'Demo Toronto Maple Health Supplies',
        company: 'Maple Health Supplies Corp',
        phone: '+1 416 555 0147',
        phone_2: '',
        email: 'receiving@maplehealth.demo.courier.internal',
        address: '220 Bay Street, Suite 800',
        address_2: 'Financial District',
        city: 'Toronto',
        state: 'ON',
        pincode: 'M5V 2T6',
        country: 'CANADA',
        gstin_type: 'Business Number (BN)',
        gstin_no: '876543210 RT0001'
      },
      {
        name: 'Demo Shinjuku Electronics Co Ltd',
        company: 'Shinjuku Electronics Co Ltd',
        phone: '+81 3 5555 7890',
        phone_2: '',
        email: 'import@shinjukuelec.demo.courier.internal',
        address: '2-8-1 Nishi-Shinjuku',
        address_2: 'Tower South 19F',
        city: 'Tokyo',
        state: 'Tokyo',
        pincode: '160-0022',
        country: 'JAPAN',
        gstin_type: 'Corporate Number',
        gstin_no: '1010001098765'
      },
      {
        name: 'Demo Sydney Harbor Logistics PTY',
        company: 'Sydney Harbor Logistics PTY Ltd',
        phone: '+61 2 9876 5432',
        phone_2: '+61 412 345 678',
        email: 'operations@sydneyharbor.demo.courier.internal',
        address: 'Building 4, Botany Bay Port Boulevard',
        address_2: 'Freight Gate 2',
        city: 'Sydney',
        state: 'NSW',
        pincode: '2000',
        country: 'AUSTRALIA',
        gstin_type: 'ABN',
        gstin_no: '51 824 753 556'
      },
      {
        name: 'Demo Marina Bay Trading Pte Ltd',
        company: 'Marina Bay Trading Pte Ltd',
        phone: '+65 6789 0123',
        phone_2: '',
        email: 'orders@marinabaytrading.demo.courier.internal',
        address: '10 Marina Boulevard, Tower 2',
        address_2: 'Marina Bay Financial Centre',
        city: 'Singapore',
        state: 'Singapore',
        pincode: '018981',
        country: 'SINGAPORE',
        gstin_type: 'UEN',
        gstin_no: '201912345M'
      },
      {
        name: 'Demo Zurich Alpine Retail AG',
        company: 'Zurich Alpine Retail AG',
        phone: '+41 44 211 4455',
        phone_2: '',
        email: 'einkauf@alpineretail.demo.courier.internal',
        address: 'Bahnhofstrasse 45',
        address_2: 'Commercial Entrance B',
        city: 'Zurich',
        state: 'Zurich',
        pincode: '8001',
        country: 'SWITZERLAND',
        gstin_type: 'UID',
        gstin_no: 'CHE-109.876.543'
      },
      {
        name: 'Demo Seine Lifestyle Boutique',
        company: 'Seine Lifestyle SAS',
        phone: '+33 1 42 68 55 00',
        phone_2: '',
        email: 'reception@seinelifestyle.demo.courier.internal',
        address: '28 Rue du Faubourg Saint-Honoré',
        address_2: 'Cour d’Honneur',
        city: 'Paris',
        state: 'Île-de-France',
        pincode: '75008',
        country: 'FRANCE',
        gstin_type: 'SIRET',
        gstin_no: '80123456700018'
      }
    ]

    for (const r of demoReceivers) {
      await execute(
        `INSERT INTO receivers (name, company, phone, phone_2, email, address, address_2, city, state, pincode, country, gstin_type, gstin_no)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.name, r.company, r.phone, r.phone_2, r.email, r.address, r.address_2, r.city, r.state, r.pincode, r.country, r.gstin_type, r.gstin_no]
      )
    }

    // 3. Seed 10 Demo Shipments with realistic details
    const sampleShipments = [
      {
        tracking: 'DEMO-1000001',
        senderName: 'Apex Exports Ltd',
        senderCity: 'Mumbai',
        senderCountry: 'INDIA',
        senderPhone: '+91 98200 11223',
        receiverName: 'Nexus Global Logistics LLC',
        receiverCity: 'New York',
        receiverCountry: 'USA',
        receiverPhone: '+1 212 555 0192',
        receiverPincode: '10001',
        vendorCode: 'DHL',
        serviceCode: 'EXPRESS_WORLDWIDE',
        productCode: 'DOC',
        weight: 2.50,
        pieces: 2,
        declaredValue: 450.00,
        status: 'Delivered',
        description: 'Commercial Sample Contracts & Catalogues'
      },
      {
        tracking: 'DEMO-1000002',
        senderName: 'Indo-British Silk Traders',
        senderCity: 'Varanasi',
        senderCountry: 'INDIA',
        senderPhone: '+91 98390 44556',
        receiverName: 'Kensington Fabrics Ltd',
        receiverCity: 'London',
        receiverCountry: 'UNITED KINGDOM',
        receiverPhone: '+44 20 7946 0912',
        receiverPincode: 'EC1A 1BB',
        vendorCode: 'FEDEX',
        serviceCode: 'INTL_PRIORITY',
        productCode: 'NON_DOC',
        weight: 4.80,
        pieces: 3,
        declaredValue: 1250.00,
        status: 'In Transit',
        description: 'Handcrafted Silk Fabric Rolls'
      },
      {
        tracking: 'DEMO-1000003',
        senderName: 'Gulf Star Electronics',
        senderCity: 'Ahmedabad',
        senderCountry: 'INDIA',
        senderPhone: '+91 98790 77889',
        receiverName: 'Al-Baraka Trading LLC',
        receiverCity: 'Dubai',
        receiverCountry: 'UNITED ARAB EMIRATES',
        receiverPhone: '+971 4 321 4567',
        receiverPincode: '12345',
        vendorCode: 'ARAMEX',
        serviceCode: 'PARCEL_EXPRESS',
        productCode: 'NON_DOC',
        weight: 1.25,
        pieces: 1,
        declaredValue: 890.00,
        status: 'Out for Delivery',
        description: 'Replacement Sensor Circuit Components'
      },
      {
        tracking: 'DEMO-1000004',
        senderName: 'Precision Engineering Tools',
        senderCity: 'Pune',
        senderCountry: 'INDIA',
        senderPhone: '+91 98220 33445',
        receiverName: 'Bavaria Industrie AG',
        receiverCity: 'Munich',
        receiverCountry: 'GERMANY',
        receiverPhone: '+49 89 2012 3456',
        receiverPincode: '80331',
        vendorCode: 'UPS',
        serviceCode: 'SAVER',
        productCode: 'NON_DOC',
        weight: 6.70,
        pieces: 2,
        declaredValue: 2400.00,
        status: 'Customs Cleared',
        description: 'CNC Calibrated Cutting Heads'
      },
      {
        tracking: 'DEMO-1000005',
        senderName: 'Oceanic Wellness Labs',
        senderCity: 'Kochi',
        senderCountry: 'INDIA',
        senderPhone: '+91 98470 55667',
        receiverName: 'Sydney Naturals Pty Ltd',
        receiverCity: 'Sydney',
        receiverCountry: 'AUSTRALIA',
        receiverPhone: '+61 2 9385 1234',
        receiverPincode: '2000',
        vendorCode: 'PACIFIC',
        serviceCode: 'PAC_EXPRESS',
        productCode: 'NON_DOC',
        weight: 3.10,
        pieces: 1,
        declaredValue: 620.00,
        status: 'In Transit',
        description: 'Organic Herbal Essential Extracts'
      },
      {
        tracking: 'DEMO-1000006',
        senderName: 'Himalayan Craft Guild',
        senderCity: 'Dehradun',
        senderCountry: 'INDIA',
        senderPhone: '+91 98120 99887',
        receiverName: 'Maple Leaf Importers Inc',
        receiverCity: 'Toronto',
        receiverCountry: 'CANADA',
        receiverPhone: '+1 416 555 0143',
        receiverPincode: 'M5V 2T6',
        vendorCode: 'DHL',
        serviceCode: 'EXPRESS_WORLDWIDE',
        productCode: 'NON_DOC',
        weight: 5.40,
        pieces: 4,
        declaredValue: 1800.00,
        status: 'Booked',
        description: 'Handwoven Wool Scarves & Shawls'
      },
      {
        tracking: 'DEMO-1000007',
        senderName: 'Zenith BioPharm Hub',
        senderCity: 'Hyderabad',
        senderCountry: 'INDIA',
        senderPhone: '+91 98490 66778',
        receiverName: 'Kyoto University BioLab',
        receiverCity: 'Tokyo',
        receiverCountry: 'JAPAN',
        receiverPhone: '+81 3 5555 0188',
        receiverPincode: '100-0001',
        vendorCode: 'FEDEX',
        serviceCode: 'INTL_FIRST',
        productCode: 'NON_DOC',
        weight: 0.90,
        pieces: 1,
        declaredValue: 3100.00,
        status: 'Dispatched',
        description: 'Lyophilized Diagnostic Reagents'
      },
      {
        tracking: 'DEMO-1000008',
        senderName: 'Delhi Book Publishers',
        senderCity: 'New Delhi',
        senderCountry: 'INDIA',
        senderPhone: '+91 98110 33221',
        receiverName: 'Iberia Book Distributors SL',
        receiverCity: 'Madrid',
        receiverCountry: 'SPAIN',
        receiverPhone: '+34 91 123 4567',
        receiverPincode: '28001',
        vendorCode: 'UPS',
        serviceCode: 'EXPEDITED',
        productCode: 'DOC',
        weight: 3.60,
        pieces: 2,
        declaredValue: 410.00,
        status: 'Delivered',
        description: 'Academic Educational Print Volumes'
      },
      {
        tracking: 'DEMO-1000009',
        senderName: 'Bengaluru Microtech Solutions',
        senderCity: 'Bengaluru',
        senderCountry: 'INDIA',
        senderPhone: '+91 98800 12345',
        receiverName: 'Pacific Rim IT Center',
        receiverCity: 'Singapore',
        receiverCountry: 'SINGAPORE',
        receiverPhone: '+65 6789 0123',
        receiverPincode: '018989',
        vendorCode: 'DHL',
        serviceCode: 'EXPRESS_WORLDWIDE',
        productCode: 'NON_DOC',
        weight: 1.80,
        pieces: 1,
        declaredValue: 1450.00,
        status: 'In Transit',
        description: 'Embedded Microcontroller Modules'
      },
      {
        tracking: 'DEMO-1000010',
        senderName: 'Jaipur Gems & Jewels',
        senderCity: 'Jaipur',
        senderCountry: 'INDIA',
        senderPhone: '+91 98290 88776',
        receiverName: 'Nordic Jewelry Galleri',
        receiverCity: 'Stockholm',
        receiverCountry: 'SWEDEN',
        receiverPhone: '+46 8 123 4567',
        receiverPincode: '111 22',
        vendorCode: 'FEDEX',
        serviceCode: 'INTL_PRIORITY',
        productCode: 'NON_DOC',
        weight: 0.75,
        pieces: 1,
        declaredValue: 4800.00,
        status: 'Delivered',
        description: 'Semi-precious Finished Silver Ornaments'
      }
    ]

    for (const s of sampleShipments) {
      const res = await execute(
        `INSERT INTO shipments (
          order_id, customer_name, customer_type,
          tracking_number, weight, chargeable_weight, length, breadth, height,
          no_of_pieces, content_description, declared_value,
          vendor_code, service_code, product_code, status,
          sender_name, sender_city, sender_country, sender_phone,
          receiver_name, receiver_city, receiver_country, receiver_phone, receiver_pincode,
          order_reference, payment_mode, shipping_charge, total_amount, is_locked
        ) VALUES (?, ?, 'business', ?, ?, ?, 20, 15, 10, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Prepaid', ?, ?, 0)`,
        [
          s.tracking,
          s.senderName,
          s.tracking,
          s.weight,
          Math.max(s.weight, 1.0),
          s.pieces,
          s.description,
          s.declaredValue,
          s.vendorCode,
          s.serviceCode,
          s.productCode,
          s.status,
          s.senderName,
          s.senderCity,
          s.senderCountry,
          s.senderPhone,
          s.receiverName,
          s.receiverCity,
          s.receiverCountry,
          s.receiverPhone,
          s.receiverPincode,
          `REF-${s.tracking}`,
          (s.weight * 650).toFixed(2),
          (s.weight * 650 + 120).toFixed(2)
        ]
      )

      const shipmentId = res.insertId

      // 4. Seed realistic Tracking Timeline Events for each demo shipment
      const now = new Date()
      const d1 = new Date(now.getTime() - 4 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
      const d2 = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
      const d3 = new Date(now.getTime() - 2 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
      const d4 = new Date(now.getTime() - 1 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
      const d5 = now.toISOString().slice(0, 19).replace('T', ' ')

      const events = [
        { status: 'Booked', loc: `${s.senderCity} Origin Hub`, time: d1, desc: 'Consignment booked and waybill generated' },
        { status: 'In Transit', loc: 'Central Air Hub (BOM/DEL)', time: d2, desc: 'Processed at export gateway sorting facility' },
        { status: 'Customs Cleared', loc: 'Export Air Cargo Terminal', time: d3, desc: 'Cleared international export regulatory inspection' }
      ]

      if (['In Transit', 'Out for Delivery', 'Delivered'].includes(s.status)) {
        events.push({ status: 'In Transit', loc: `${s.receiverCity} International Airport Hub`, time: d4, desc: 'Arrived at destination transit facility' })
      }
      if (['Out for Delivery', 'Delivered'].includes(s.status)) {
        events.push({ status: 'Out for Delivery', loc: `${s.receiverCity} Delivery Station`, time: d5, desc: 'Assigned to courier van for final delivery' })
      }
      if (s.status === 'Delivered') {
        events.push({ status: 'Delivered', loc: s.receiverCity, time: d5, desc: `Delivered safely and signed by ${s.receiverName.split(' ')[0]}` })
      }

      for (const ev of events) {
        await execute(
          "INSERT INTO tracking_events (shipment_id, status, location, event_time, description) VALUES (?, ?, ?, ?, ?)",
          [shipmentId, ev.status, ev.loc, ev.time, ev.desc]
        )
      }
    }

    // 5. Seed 10 Demo Manual Vendor Entries (No-API Vendors)
    const manualEntries = [
      {
        vendorConfigId: 1,
        vendorCode: 'MANUAL_EXPRESS',
        awb: 'DEMO-MN-5001',
        orderRef: 'ORD-DEMO-5001',
        sender: 'Kalyan Garments',
        senderCity: 'Tirupur',
        receiver: 'Vogue Boutique UK',
        receiverCity: 'Manchester',
        pincode: 'M1 1AA',
        service: 'Air Cargo Express',
        weight: 3.2,
        status: 'In Transit',
        location: 'Heathrow Cargo Hub',
        statusDesc: 'Departed sorting facility to regional delivery hub'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'MANUAL_EXPRESS',
        awb: 'DEMO-MN-5002',
        orderRef: 'ORD-DEMO-5002',
        sender: 'Surat Diamond Craft',
        senderCity: 'Surat',
        receiver: 'Antwerp Gems BV',
        receiverCity: 'Antwerp',
        pincode: '2018',
        service: 'Secured Air Courier',
        weight: 0.45,
        status: 'Delivered',
        location: 'Antwerp Diamond Hub',
        statusDesc: 'Delivered and acknowledged by vault officer'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'COURIER_LINE_MANUAL',
        awb: 'DEMO-MN-5003',
        orderRef: 'ORD-DEMO-5003',
        sender: 'Agra Leather Works',
        senderCity: 'Agra',
        receiver: 'Milano Fashion SpA',
        receiverCity: 'Milan',
        pincode: '20121',
        service: 'Standard Cargo Line',
        weight: 8.5,
        status: 'Customs Hold',
        location: 'Malpensa Cargo Terminal',
        statusDesc: 'Awaiting consignee VAT documentation clearance'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'COURIER_LINE_MANUAL',
        awb: 'DEMO-MN-5004',
        orderRef: 'ORD-DEMO-5004',
        sender: 'Kerala Spice Traders',
        senderCity: 'Kochi',
        receiver: 'Gulf Gourmet Foods',
        receiverCity: 'Abu Dhabi',
        pincode: '54321',
        service: 'Express Gulf Line',
        weight: 12.0,
        status: 'Out for Delivery',
        location: 'Mussafah Logistics Center',
        statusDesc: 'Out with delivery vehicle'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'LOCAL_SURFACE_CARRIER',
        awb: 'DEMO-MN-5005',
        orderRef: 'ORD-DEMO-5005',
        sender: 'Auto Ancillaries Pune',
        senderCity: 'Pune',
        receiver: 'Chennai Motor Works',
        receiverCity: 'Chennai',
        pincode: '600001',
        service: 'Domestic Surface',
        weight: 18.5,
        status: 'In Transit',
        location: 'Bengaluru Transit Hub',
        statusDesc: 'Container dispatched along National Highway 48'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'LOCAL_SURFACE_CARRIER',
        awb: 'DEMO-MN-5006',
        orderRef: 'ORD-DEMO-5006',
        sender: 'Jaipur Handicrafts Co',
        senderCity: 'Jaipur',
        receiver: 'Artisan Decor Melbourne',
        receiverCity: 'Melbourne',
        pincode: '3000',
        service: 'Ocean Air Express',
        weight: 6.2,
        status: 'Delivered',
        location: 'Melbourne South Dock',
        statusDesc: 'Handed over to consignee representative'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'MANUAL_EXPRESS',
        awb: 'DEMO-MN-5007',
        orderRef: 'ORD-DEMO-5007',
        sender: 'Ludhiana Woolens Ltd',
        senderCity: 'Ludhiana',
        receiver: 'Berlin Winterwear Store',
        receiverCity: 'Berlin',
        pincode: '10117',
        service: 'Air Cargo Express',
        weight: 9.8,
        status: 'Booked',
        location: 'Delhi Cargo Gateway',
        statusDesc: 'Entry registered, awaiting palletization'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'COURIER_LINE_MANUAL',
        awb: 'DEMO-MN-5008',
        orderRef: 'ORD-DEMO-5008',
        sender: 'Hyderabad Hardware Pvt',
        senderCity: 'Hyderabad',
        receiver: 'Singapore Tech Distribution',
        receiverCity: 'Singapore',
        pincode: '048582',
        service: 'Next Flight Out (NFO)',
        weight: 2.1,
        status: 'Dispatched',
        location: 'Changi Logistics Park',
        statusDesc: 'Transferred to ground handling contractor'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'LOCAL_SURFACE_CARRIER',
        awb: 'DEMO-MN-5009',
        orderRef: 'ORD-DEMO-5009',
        sender: 'Mysore Sandal Artifacts',
        senderCity: 'Mysuru',
        receiver: 'San Francisco Gift Emporium',
        receiverCity: 'San Francisco',
        pincode: '94102',
        service: 'Premium Express',
        weight: 1.6,
        status: 'In Transit',
        location: 'SFO International Mail Facility',
        statusDesc: 'Customs screening completed, routed to USPS'
      },
      {
        vendorConfigId: 1,
        vendorCode: 'MANUAL_EXPRESS',
        awb: 'DEMO-MN-5010',
        orderRef: 'ORD-DEMO-5010',
        sender: 'Moradabad Metal Art',
        senderCity: 'Moradabad',
        receiver: 'Parisian Home Gallerie',
        receiverCity: 'Paris',
        pincode: '75001',
        service: 'Air Courier Special',
        weight: 7.4,
        status: 'Delivered',
        location: 'Charles de Gaulle Hub',
        statusDesc: 'Delivered and signed at receipt counter'
      }
    ]

    for (const m of manualEntries) {
      const trackingJson = JSON.stringify([
        {
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
          status: 'Booked',
          location: `${m.senderCity} Hub`,
          description: 'Shipment entry recorded into system'
        },
        {
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          status: m.status,
          location: m.location,
          description: m.statusDesc
        }
      ])

      await execute(
        `INSERT INTO manual_vendor_entries (
          vendor_config_id, vendor_code, awb_number, order_ref,
          sender_name, sender_city, receiver_name, receiver_city,
          destination_pincode, service_name, weight_kg, pieces,
          current_status, current_location, status_description,
          tracking_events, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1)`,
        [
          m.vendorConfigId,
          m.vendorCode,
          m.awb,
          m.orderRef,
          m.sender,
          m.senderCity,
          m.receiver,
          m.receiverCity,
          m.pincode,
          m.service,
          m.weight,
          m.status,
          m.location,
          m.statusDesc,
          trackingJson
        ]
      )
    }

    return res.json({
      success: true,
      message: 'Demo dataset successfully generated! 10 users, 10 senders, 10 receivers, 10 shipments with live tracking events, and 10 manual vendor entries are now active.',
      counts: {
        users: 10,
        senders: 10,
        receivers: 10,
        shipments: 10,
        manualEntries: 10
      }
    })
  } catch (err) {
    console.error('[seedDemoData error]:', err)
    return res.status(500).json({ success: false, message: `Failed to seed demo data: ${err.message}` })
  }
}

/**
 * Reset and completely remove all Demo data from the portal
 */
export async function resetDemoData(req, res) {
  try {
    const delEvents = await execute("DELETE FROM tracking_events WHERE shipment_id IN (SELECT id FROM shipments WHERE tracking_number LIKE 'DEMO-%')")
    const delShipments = await execute("DELETE FROM shipments WHERE tracking_number LIKE 'DEMO-%'")
    const delManual = await execute("DELETE FROM manual_vendor_entries WHERE awb_number LIKE 'DEMO-%'")
    const delUsers = await execute("DELETE FROM users WHERE email LIKE '%@demo.courier.internal'")
    
    let delSenders = { affectedRows: 0 }
    let delReceivers = { affectedRows: 0 }
    try {
      delSenders = await execute("DELETE FROM senders WHERE email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
    } catch (e) {}
    try {
      delReceivers = await execute("DELETE FROM receivers WHERE email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
    } catch (e) {}
    try {
      await execute("DELETE FROM customer_addresses WHERE customer_email LIKE '%@demo.courier.internal' OR email LIKE '%@demo.courier.internal' OR name LIKE 'Demo %'")
    } catch (e) {}

    return res.json({
      success: true,
      message: 'All demo data (users, senders, receivers, shipments, tracking, and manual entries) has been successfully removed from your database.',
      cleared: {
        shipments: delShipments.affectedRows || 0,
        manualEntries: delManual.affectedRows || 0,
        users: delUsers.affectedRows || 0,
        senders: delSenders.affectedRows || 0,
        receivers: delReceivers.affectedRows || 0
      }
    })
  } catch (err) {
    console.error('[resetDemoData error]:', err)
    return res.status(500).json({ success: false, message: `Failed to reset demo data: ${err.message}` })
  }
}
