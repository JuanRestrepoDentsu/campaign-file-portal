import {
  findUserById,
  findUsers,
  getUserFormOptions,
} from '@/features/users/repositories/user.repository';
import type {
  PaginatedUsers,
  PortalUser,
  UserFormOptions,
  UserListFilters,
} from '@/features/users/types/user';

export async function getUsers(
  filters: UserListFilters,
): Promise<PaginatedUsers> {
  return findUsers(filters);
}

export async function getUser(userId: number): Promise<PortalUser | null> {
  return findUserById(userId);
}

export async function getUsersFormOptions(): Promise<UserFormOptions> {
  return getUserFormOptions();
}
