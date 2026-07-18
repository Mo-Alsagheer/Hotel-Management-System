# Guide to Creating a New Module

This guide details the conventions, directory structure, and coding standards to follow when creating a new module in the Hotel Management System.

---

## 1. Directory Structure

Every new module should reside in the `src/modules/` directory and follow this standardized structure:

```
src/modules/your-module/
├── dtos/
│   ├── create-your-module.dto.ts
│   ├── update-your-module.dto.ts
│   └── your-module-query.dto.ts
├── interfaces/
│   └── your-module-service.interface.ts
├── schemas/
│   └── your-module.schema.ts
├── services/
│   └── your-module.service.ts
├── your-module.controller.ts
└── your-module.module.ts
```

---

## 2. Step-by-Step Implementation Guide

### Step 1: Create the Mongoose Schema
Schemas should reside in the `schemas/` subfolder. We use NestJS Mongoose decorators. 
- Enable `timestamps: true` and set `versionKey: false` in the `@Schema` decorator options.
- Create and export a `HydratedDocument` type alias.

*Example:* `src/modules/your-module/schemas/your-module.schema.ts`
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExampleDocument = HydratedDocument<Example>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Example {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  createdBy: Types.ObjectId[];
}

export const ExampleSchema = SchemaFactory.createForClass(Example);
```

### Step 2: Define Data Transfer Objects (DTOs)
DTOs reside in the `dtos/` subfolder and are used to validate incoming request bodies or query parameters.
- Use `class-validator` decorators for runtime validations.
- Use NestJS Swagger decorators (`@ApiProperty`, `@ApiPropertyOptional`) to generate Swagger documentation automatically.

*Example:* `src/modules/your-module/dtos/create-example.dto.ts`
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateExampleDto {
  @ApiProperty({ example: 'Suite Room A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  price: number;
}
```

### Step 3: Define the Service Interface
To enforce loose coupling, define a service interface in the `interfaces/` subfolder.

*Example:* `src/modules/your-module/interfaces/example-service.interface.ts`
```typescript
import { Example } from '../schemas/your-module.schema';
import { CreateExampleDto } from '../dtos/create-example.dto';

export interface IExampleService {
  create(createDto: CreateExampleDto): Promise<Example>;
  findAll(): Promise<Example[]>;
  findOne(id: string): Promise<Example>;
}
```

### Step 4: Implement the Service
Services reside in the `services/` folder and implement their respective interfaces. 
- Use `@Injectable()` to register the class as a NestJS provider.
- Inject Mongoose models via `@InjectModel()`.

*Example:* `src/modules/your-module/services/example.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Example, ExampleDocument } from '../schemas/your-module.schema';
import { CreateExampleDto } from '../dtos/create-example.dto';
import { IExampleService } from '../interfaces/example-service.interface';

@Injectable()
export class ExampleService implements IExampleService {
  constructor(
    @InjectModel(Example.name)
    private readonly exampleModel: Model<ExampleDocument>,
  ) {}

  async create(createDto: CreateExampleDto): Promise<Example> {
    const createdExample = new this.exampleModel(createDto);
    return createdExample.save();
  }

  async findAll(): Promise<Example[]> {
    return this.exampleModel.find().exec();
  }

  async findOne(id: string): Promise<Example> {
    const example = await this.exampleModel.findById(id).exec();
    if (!example) {
      throw new NotFoundException(`Example with ID ${id} not found`);
    }
    return example;
  }
}
```

### Step 5: Implement the Controller
Controllers reside in the root of the module folder and handle incoming routing.
- Group the endpoints under an appropriate `@ApiTags()` namespace.
- Inject the service class directly in the constructor.
- Use `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)` for role-based authorization where necessary.
- Use `@SuccessMessage('...')` to return standardized success notifications where applicable.
- Validate incoming path parameters using custom pipes such as `ParseObjectIdPipe` if they represent Mongoose `ObjectId` values.

*Example:* `src/modules/your-module/example.controller.ts`
```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExampleService } from './services/example.service';
import { CreateExampleDto } from './dtos/create-example.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@ApiTags('Examples')
@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Example created successfully')
  async create(@Body() createDto: CreateExampleDto) {
    return this.exampleService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.exampleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.exampleService.findOne(id);
  }
}
```

### Step 6: Create the Module Class
Wiring is done in the module file located in the root of the module folder.
- Register Mongoose schemas with `MongooseModule.forFeature()`.
- Declare `controllers`, `providers`, and `exports`.

*Example:* `src/modules/your-module/example.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Example, ExampleSchema } from './schemas/your-module.schema';
import { ExampleController } from './example.controller';
import { ExampleService } from './services/example.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Example.name, schema: ExampleSchema }]),
  ],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
```

### Step 7: Register in the Application Module
Finally, import your newly created module in `src/app.module.ts`:

```typescript
import { ExampleModule } from './modules/your-module/example.module';

@Module({
  imports: [
    // ... other modules
    ExampleModule,
  ],
})
export class AppModule {}
```

---

## 3. Best Practices & Conventions

1. **Naming Conventions**:
   - **Files**: Use kebab-case with descriptive extensions (e.g., `create-booking.dto.ts`, `room.schema.ts`, `auth.service.ts`).
   - **Classes**: Use PascalCase (e.g., `BookingService`, `CreateRoomDto`).
   - **Variables/Properties**: Use camelCase (e.g., `roomNumber`, `price`).

2. **Validation**:
   - Never skip validation decorators on DTO fields. 
   - Always ensure custom validation is added to catch invalid object IDs using `ParseObjectIdPipe` inside routing parameters.

3. **Error Handling**:
   - Throw semantic NestJS HTTP exceptions (e.g., `NotFoundException`, `BadRequestException`, `ForbiddenException`) inside services when business rules are violated. Avoid catching exceptions to swallow them unless logging/re-throwing.

4. **Security & Guarding**:
   - Protect endpoints with `@UseGuards(JwtAuthGuard, RolesGuard)` and use `@Roles(UserRole.ADMIN)` or other relevant roles defined in `UserRole`.
