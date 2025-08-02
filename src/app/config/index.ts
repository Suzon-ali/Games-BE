import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT,
  database_url: process.env.DB_URL,
  redis_url: process.env.REDIS_URL,
  node_env: process.env.NODE_ENV,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_password_ui_link: process.env.RESET_PASSWORD_UI_LINK,
  email_app_password: process.env.EMAIL_APP_PASSWORD,
  app_email: process.env.APP_EMAIL,
  cloudinary_name: process.env.CLOUDYNARY_NAME,
  cloduinary_api_key: process.env.CLOUDYNARY_API_KEY,
  cloduinary_api_secret: process.env.CLOUDYNARY_API_SECRET,
  min_bet: process.env.MIN_BET,
  max_bet: process.env.MAX_BET,
};