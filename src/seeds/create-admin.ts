import 'dotenv/config';
import { connect, model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema, UserRole } from '../modules/user/schemas/user.schema';

async function bootstrap() {
  const mongoUri = process.env.MONGODB_URI;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!mongoUri) {
    console.error('MONGODB_URI must be set in environment variables.');
    process.exit(1);
  }

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.');
    process.exit(1);
  }

  await connect(mongoUri);
  const UserModel = model<User & { _id: any }>('User', UserSchema);

  try {
    const existingUser = await UserModel.findOne({ email: adminEmail.toLowerCase() }).lean();
    if (existingUser) {
      console.log('Admin account already exists:', adminEmail);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await UserModel.create({
      name: 'Administrator',
      email: adminEmail.toLowerCase(),
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });

    console.log('Admin account created successfully:', adminEmail);
  } catch (error: any) {
    console.error('Failed to create admin account:', error.message || error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
