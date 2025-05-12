import express from 'express'
import cors from 'cors'
import { createAuthMiddleware } from './ports/auth/middleware'
import { AuthAdapter } from './ports/auth/adapter'
import { Auth } from './ports/auth/better-auth'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { createAuthRouter } from './ports/auth/router'
import { AppDeps, AppRTE } from './core/types'
import { MongoClient } from 'mongodb'

export const createApp = (_: AppDeps): AppRTE<Error, express.Application> => {
  return (deps: AppDeps) => {
    const app = express()

    // 미들웨어 설정
    app.use(cors())
    app.use(express.json())

    // 인증 미들웨어 적용
    app.use(createAuthMiddleware(deps.authPort))

    // 라우트 설정
    app.get('/health', (_, res) => {
      res.json({ status: 'ok' })
    })

    // 인증 라우터 등록
    app.use('/api/auth', createAuthRouter(deps.authPort))

    return TE.right(app)
  }
}

// 앱 실행
const main = async () => {
  const client = new MongoClient('mongodb://localhost:27017')
  await client.connect()

  const deps: AppDeps = {
    db: client.db('conduit'),
    authPort: new AuthAdapter(
      new Auth(process.env.JWT_SECRET || 'your-secret-key'),
    ),
  }

  const result = await createApp(deps)(deps)()

  if (E.isLeft(result)) {
    console.error('앱 시작 실패:', result.left)
    process.exit(1)
    return
  }

  const app = result.right
  const port = parseInt(process.env.PORT || '3000', 10)

  app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`)
  })
}

main().catch(console.error)

export default createApp
