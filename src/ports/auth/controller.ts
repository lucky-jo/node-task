import { Request, Response } from 'express'
import { AuthPort } from './types'
import { User } from '../../core/domain/user'

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthController {
  constructor (private readonly authPort: AuthPort) {}

  register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    const { email, username } = req.body

    // TODO: 비밀번호 해싱 및 사용자 생성 로직 구현
    const user: User = {
      id: 'temp-id', // TODO: 실제 ID 생성 로직 구현
      email,
      username,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      const token = await this.authPort.generateToken({
        ...user,
        roles: ['user'], // 기본 역할
      })

      res.status(201).json({
        user: {
          ...user,
          roles: ['user'],
        },
        token,
      })
    } catch (error) {
      res.status(500).json({
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user',
      })
    }
  };

  login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const { email } = req.body

    // TODO: 사용자 인증 및 비밀번호 검증 로직 구현
    const user: User = {
      id: 'temp-id', // TODO: 실제 사용자 조회 로직 구현
      email,
      username: 'temp-username',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      const token = await this.authPort.generateToken({
        ...user,
        roles: ['user'],
      })

      res.json({
        user: {
          ...user,
          roles: ['user'],
        },
        token,
      })
    } catch (error) {
      res.status(401).json({
        code: 'LOGIN_FAILED',
        message: 'Invalid credentials',
      })
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      })
    }

    return res.json({ user })
  };
}
