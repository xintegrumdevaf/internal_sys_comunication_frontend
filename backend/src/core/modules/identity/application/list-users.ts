import type { UserRepository } from "@/core/modules/identity/application/ports";
import type { User } from "@/core/modules/identity/domain/user";

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(): Promise<User[]> {
    return this.users.list();
  }
}
