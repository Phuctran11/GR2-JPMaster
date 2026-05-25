export type UserRole = "learner" | "owner" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";

export interface PublicUser {
  user_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  password_hash?: never;
}

export interface UserWithPassword extends Omit<PublicUser, "password_hash"> {
  password_hash: string;
}

export type User = PublicUser | UserWithPassword;

export const publicUserSelect = `
  user_id, username, email, avatar_url, role, status, deleted_at, created_at, updated_at
`;

export const userWithPasswordSelect = `
  user_id, username, email, password_hash, avatar_url, role, status, deleted_at, created_at, updated_at
`;
