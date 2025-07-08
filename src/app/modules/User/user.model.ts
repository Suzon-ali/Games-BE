/* eslint-disable @typescript-eslint/no-this-alias */
import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../../config';
import { IUser, UserModel } from './user.interface';

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    userName: { type: String, required: true, unique: true },
    roles: {
      type: [String],
      enum: ['user', 'vip', 'affiliate', 'admin', 'support'],
      default: ['user'],
    },
    status: {
      type: String,
      enum: ['active', 'banned', 'suspended'],
      default: 'active',
    },
    kycStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
    },
    balance: { type: Number, default: 0 },
    bonusBalance: { type: Number, default: 0 },
    vipLevel: { type: Number, default: 0 },
    bonusEligible: { type: Boolean, default: true },
    serverSeed: { type: String }, // now optional
    serverSeedHash: { type: String }, // now optional
    nonce: { type: Number, default: 0 },
    clientSeed: { type: String }, // now optional
    isTestUser: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

//middlewares
UserSchema.pre<IUser>('save', async function (next) {
  const user = this;
  if (user.password) {
    const hashed = await bcrypt.hash(
      user.password,
      Number(config.bcrypt_salt_rounds),
    );
    user.password = hashed;
  } else {
    next();
  }
  next();
});

UserSchema.post('save', function (doc, next) {
  doc.password = '';
  next();
});

//statics
UserSchema.statics.isUserExistsByEmail = async function (email) {
  const existingUser = await User.findOne({
    email: { $regex: email, $options: 'i' },
  }).select('+password');
  return existingUser;
};

UserSchema.statics.isUserExistsById = async function (id) {
  const existingUser = await User.findOne({
    _id: id,
  });
  return existingUser;
};

UserSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const User = model<IUser, UserModel>('User', UserSchema);
