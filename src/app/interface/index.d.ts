import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace express {
    interface Request {
      user: JwtPayload;
    }
  }
}
