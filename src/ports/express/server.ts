import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import express, { Request, Response } from 'express'
import { registerUser } from '@/core/user/use-case/register-user'
import { pipe } from 'fp-ts/lib/function'
import * as jose from 'jose'
import {
  LoginUser,
  loginUserCodec,
  CreateUser,
  createUserCodec,
} from '@/core/user/types'

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// JWT 시크릿 키를 Uint8Array로 변환
const secret = new Uint8Array(Buffer.from('asdf'))

const generateJWT = async (
  payload: Record<string, unknown>,
): Promise<string> => {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(secret)
}

const verifyJWT = async (token: string): Promise<jose.JWTVerifyResult> => {
  return jose.jwtVerify(token, secret)
}

// 메모리 DB 타입 정의
interface MemoryDB {
  users: Record<string, CreateUser>;
}

const memoryDB: MemoryDB = { users: {} }

const fakeRegisterUserDB = async (data: CreateUser): Promise<CreateUser> => {
  const email = data.email
  if (memoryDB.users[email]) {
    throw new Error('user already exists')
  }
  memoryDB.users[email] = data
  return data
}

app.post('/api/users', async (req: Request, res: Response) => {
  await pipe(
    req.body.user,
    createUserCodec.decode,
    E.mapLeft((errors) => new Error(errors.map((e) => e.message).join(', '))),
    TE.fromEither,
    TE.chain((data) => registerUser<CreateUser>(fakeRegisterUserDB)(data)),
    TE.map(async (result) => {
      const token = await generateJWT({ email: result.email })
      const verified = await verifyJWT(token)
      console.log(verified)
      res.json({ user: { ...result, token } })
    }),
    TE.mapLeft((error) => {
      res.status(400).json({ error: error.message })
    }),
  )()
})

const fakeLoginInDB = async (loginUser: LoginUser): Promise<LoginUser> => {
  const userDB = memoryDB.users[loginUser.email]
  if (!userDB || userDB.password !== loginUser.password) {
    throw new Error('Email or password invalid.')
  }
  return loginUser
}

app.post('/api/users/login', async (req: Request, res: Response) => {
  await pipe(
    req.body.user,
    loginUserCodec.decode,
    E.mapLeft((errors) => new Error(errors.map((e) => e.message).join(', '))),
    TE.fromEither,
    TE.chain((user) =>
      TE.tryCatch(
        () => fakeLoginInDB(user),
        (error) => (error instanceof Error ? error : new Error('Login failed')),
      ),
    ),
    TE.chain((user) =>
      pipe(
        TE.tryCatch(
          () => generateJWT({ email: user.email }),
          (error) =>
            error instanceof Error
              ? error
              : new Error('Token generation failed'),
        ),
        TE.map((token) => ({ ...user, token })),
      ),
    ),
    TE.map((user) => {
      res.json({ user })
    }),
    TE.mapLeft((error) => {
      res.status(401).json({ error: error.message })
    }),
  )()
})

const start = () => {
  const port = 3000
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

export { start }
