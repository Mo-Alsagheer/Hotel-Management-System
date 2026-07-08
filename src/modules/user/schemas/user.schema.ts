import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
    trim: true,
  })
  password: string;

  @Prop({
    unique: true,
    sparse: true,
    trim: true,
  })
  phone?: string;

  @Prop({
    default: '',
  })
  profileImage?: string;

  @Prop({
    enum: UserRole,
    default: UserRole.USER,
    index: true,
  })
  role: UserRole;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    default: null,
  })
  deletedAt?: Date;

  @Prop({
    default: null,
  })
  deletedBy?: string;

  @Prop({
    default: null,
    select: false,
  })
  refreshTokenHash?: string;

  @Prop({
    default: false,
    index: true,
  })
  isEmailVerified: boolean;

  @Prop({
    default: null,
    select: false,
  })
  emailVerificationToken?: string;

  @Prop({
    default: null,
    select: false,
  })
  passwordResetToken?: string;

  @Prop({
    default: null,
    select: false,
  })
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
