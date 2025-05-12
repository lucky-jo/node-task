import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'

import * as User from '@/core/user/types'

export type OutsideUpdateUser<A> = (data: User.UpdateUser) => Promise<A>;

type UpdateUser = <A>(
  outsideRegister: OutsideUpdateUser<A>
) => (data: User.UpdateUser) => TE.TaskEither<Error, A>;

const updateUser: UpdateUser = (outsideUpdateUser) => (data) => {
  return pipe(
    data,
    User.updateUserCodec.decode,
    E.mapLeft((errors) => new Error(errors.map((e) => e.message).join(', '))),
    TE.fromEither,
    TE.chain(() => TE.tryCatch(() => outsideUpdateUser(data), E.toError)),
  )
}

export { updateUser }
