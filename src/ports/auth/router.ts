import { Router, RequestHandler } from 'express'
import { AuthController } from './controller'
import { AuthPort } from './types'

export const createAuthRouter = (authPort: AuthPort) => {
  const router = Router()
  const controller = new AuthController(authPort)

  // 공개 엔드포인트
  router.post('/register', controller.register as RequestHandler)
  router.post('/login', controller.login as RequestHandler)

  // 관리자 전용 엔드포인트
  router.get('/admin', authPort.requireRole(['admin']), (_, res) => {
    res.json({ message: '관리자 접근 성공' })
  })

  // 사용자 전용 엔드포인트
  router.get('/user', authPort.requireRole(['user']), (_, res) => {
    res.json({ message: '사용자 접근 성공' })
  })

  // 관리자와 사용자 모두 접근 가능한 엔드포인트
  router.get('/shared', authPort.requireRole(['admin', 'user']), (_, res) => {
    res.json({ message: '공유 접근 성공' })
  })

  return router
}
