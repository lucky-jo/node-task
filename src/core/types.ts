import { Db } from 'mongodb'
import { AuthPort } from '../ports/auth/types'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

export interface AppDeps {
  db: Db;
  authPort: AuthPort;
}

export type AppRTE<E, A> = ReaderTaskEither<AppDeps, E, A>;
