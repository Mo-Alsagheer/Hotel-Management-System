import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';

// Concrete implementation
import { MongooseUserService } from './user.service';

// Abstract contract
import { UserService } from './interfaces/user-service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [{ provide: UserService, useClass: MongooseUserService }],
  exports: [UserService],
})
export class UserModule {}
