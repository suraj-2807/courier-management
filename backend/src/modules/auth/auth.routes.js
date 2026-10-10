import express from 'express'
import {
  register,
  login,
  me,
  getPublicKey
} from './auth.controller.js'

import authMiddleware, { requireSuperAdmin } from '../../middlewares/auth.middleware.js'

const router = express.Router()

// Encryption key for secure credentials in flight
router.get('/public-key', getPublicKey)

// Only Super Admin can register new users
router.post('/register', requireSuperAdmin, register)
router.post('/login', login)

router.get('/me', authMiddleware, me)

export default router