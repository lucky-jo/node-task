export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
