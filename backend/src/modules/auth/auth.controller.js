import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { query, execute } from '../../config/db.js'

// In-memory RSA-2048 keypair for encrypting sensitive credentials in flight
let authKeyPair = null

function getAuthKeyPair() {
  if (!authKeyPair) {
    authKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
  }
  return authKeyPair
}

export const getPublicKey = (req, res) => {
  try {
    const { publicKey } = getAuthKeyPair()
    return res.json({
      success: true,
      publicKey
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve encryption key'
    })
  }
}

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'operator'
    } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await execute(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, role]
    )

    const rows = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    )

    return res.status(201).json({
      success: true,
      user: rows[0]
    })
  } catch (error) {
    console.error(error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      })
    }

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const login = async (req, res) => {
  try {
    let { email, password, encrypted_password } = req.body

    // Decrypt password if it was encrypted client-side using RSA-OAEP
    if (encrypted_password) {
      try {
        const { privateKey } = getAuthKeyPair()
        const decryptedBuffer = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          Buffer.from(encrypted_password, 'base64')
        )
        password = decryptedBuffer.toString('utf8')
      } catch (decryptErr) {
        console.error('[Auth] Failed to decrypt encrypted_password:', decryptErr.message)
        return res.status(400).json({
          success: false,
          message: 'Secure transmission decryption failed. Please refresh and try again.'
        })
      }
    }

    const identifier = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()

    const isSuperAdminAlias = ['admin', 'superadmin', 'super_admin'].includes(identifier)

    const rows = await query(
      isSuperAdminAlias
        ? `SELECT * FROM users 
           WHERE LOWER(TRIM(email)) = ? 
              OR LOWER(TRIM(name)) = ? 
              OR role = 'super_admin'
           ORDER BY (role = 'super_admin') DESC 
           LIMIT 1`
        : `SELECT * FROM users 
           WHERE LOWER(TRIM(email)) = ? 
              OR LOWER(TRIM(name)) = ? 
           ORDER BY (role = 'super_admin') DESC 
           LIMIT 1`,
      [identifier, identifier]
    )

    const user = rows[0]

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact Super Admin.'
      })
    }

    const isPasswordCorrect = (await bcrypt.compare(cleanPassword, user.password)) || (await bcrypt.compare(password, user.password))

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      })
    }

    let effectiveRole = user.role || 'operator'

    // If user has role 'admin' but no super_admin exists in DB yet, promote them automatically
    if (effectiveRole === 'admin') {
      const superAdmins = await query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1")
      if (!superAdmins || superAdmins.length === 0) {
        effectiveRole = 'super_admin'
        await execute("UPDATE users SET role = 'super_admin' WHERE id = ?", [user.id])
        console.log(`[Auth] Auto-promoted user ${user.email} (id: ${user.id}) to super_admin`)
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: effectiveRole,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET || 'courier_portal_secret_key_2026',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    )

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: effectiveRole
      }
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const me = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.json({ success: true, user: req.user })
    }

    const rows = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1',
      [userId]
    )

    if (rows && rows.length > 0) {
      return res.json({
        success: true,
        user: rows[0]
      })
    }

    return res.json({
      success: true,
      user: req.user
    })
  } catch (err) {
    return res.json({
      success: true,
      user: req.user
    })
  }
}