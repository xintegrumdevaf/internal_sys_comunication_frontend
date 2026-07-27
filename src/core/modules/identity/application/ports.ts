import type { User } from "@/core/modules/identity/domain/user";
import type { UserId } from "@/core/shared/domain/ids";

export interface UserRepository {
  list(): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
