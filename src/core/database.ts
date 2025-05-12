import { MongoClient, Db } from "mongodb";
import { TaskEither, tryCatch } from "fp-ts/TaskEither";
import { AppDeps } from "./types";

export const connectToDatabase = (_: AppDeps): TaskEither<Error, Db> => {
  return tryCatch(
    async () => {
      const client = new MongoClient(
        process.env["MONGODB_URI"] || "mongodb://localhost:27017"
      );
      await client.connect();
      return client.db("conduit");
    },
    (error) => new Error(`데이터베이스 연결 실패: ${error}`)
  );
};
