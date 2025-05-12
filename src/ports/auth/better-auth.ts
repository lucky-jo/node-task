import jwt from 'jsonwebtoken'

interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export class Auth {
  constructor (private readonly secretKey: string) {}

  validateToken (token: string): Promise<TokenPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.secretKey,
        (err: jwt.VerifyErrors | null, decoded: unknown) => {
          if (err) {
            reject(err)
            return
          }
          resolve(decoded as TokenPayload)
        },
      )
    })
  }

  generateToken (payload: TokenPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secretKey,
        { expiresIn: '24h' },
        (err: Error | null, token: string | undefined) => {
          if (err || !token) {
            reject(err || new Error('Token generation failed'))
            return
          }
          resolve(token)
        },
      )
    })
  }
}
