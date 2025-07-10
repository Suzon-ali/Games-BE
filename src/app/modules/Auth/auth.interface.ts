import { UserRole, UserStatus } from "../User/user.interface";

export interface IUserLogin {
  email: string;
  password: string;
}


export interface IJwtPayload {
  email: string,
  roles: UserRole[],
  userId: string,
  userName: string,
  status: UserStatus,
}

