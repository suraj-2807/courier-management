import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getSupportInfo, submitSupportTicket } from './support.controller.js'
import authMiddleware from '../../middlewares/auth.middleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '../../../uploads/support')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6)
    cb(null, `screenshot-${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are accepted for screenshots'))
    }
  }
})

const router = express.Router()

router.get('/info', getSupportInfo)
router.post('/ticket', authMiddleware, upload.single('screenshot'), submitSupportTicket)

export default router
