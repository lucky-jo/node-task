import { MongoClient, Db } from 'mongodb'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

export interface DatabaseConfig {
  url: string;
  dbName: string;
}

export interface DatabaseConnection {
  client: MongoClient;
  db: Db;
}

export const createDatabaseConnection = (
  config: DatabaseConfig,
): TE.TaskEither<Error, DatabaseConnection> => {
  return pipe(
    TE.tryCatch(
      () => MongoClient.connect(config.url),
      (error) => new Error(`Failed to connect to MongoDB: ${error}`),
    ),
    TE.chain((client: MongoClient) =>
      TE.tryCatch(
        async () => {
          const db = client.db(config.dbName)
          return { client, db }
        },
        (error) => new Error(`Failed to get database: ${error}`),
      ),
    ),
  )
}
