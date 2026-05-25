import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, passwordHash: string): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }
}

export default new PasswordService();
