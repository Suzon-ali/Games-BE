

export type UserStatus = 'active' | 'banned' | 'suspended';
export type UserRole = 'user' | 'vip' | 'affiliate' | 'admin' | 'support';
export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';

const userSearchableFields = ['userName', 'userId'];
const excludeFields = ['search', 'sort', 'limit', 'page', 'fields'];

export const userSearchFields = {
  userSearchableFields,
  excludeFields,
};
