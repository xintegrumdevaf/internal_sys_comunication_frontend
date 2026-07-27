import type { UserRepository } from "@/core/modules/identity/application/ports";
import type { User } from "@/core/modules/identity/domain/user";
import type { UserId } from "@/core/shared/domain/ids";
import { SEED_USERS } from "./seed";

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();

  constructor(seed: User[] = SEED_USERS) {
    for (const u of seed) this.byId.set(u.id, u);
  }

  async list(): Promise<User[]> {
    return [...this.byId.values()].filter((u) => u.active);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.byId.values()].find((u) => u.email === email) ?? null;
  }
}
