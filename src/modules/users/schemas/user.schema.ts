
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
    versionKey: false
})
export class User {
    @Prop({
        required: true,
        trim: true
    })
    name: string;

    @Prop({
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    })
    email: string;

    @Prop({
        required: true,
        select: false,
        trim: true
    })
    password: string;

    @Prop()
    phone?: string;

    @Prop({
        default: '',
    })
    profileImage?: string;

    @Prop({
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @Prop({
        default: true
    })
    isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
