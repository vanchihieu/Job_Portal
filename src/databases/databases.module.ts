import { Module } from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { DatabasesController } from './databases.controller';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from 'src/decorator/customize';
import { UserSchema } from 'src/users/schemas/user.schema';
import { Permission, PermissionSchema } from 'src/permissions/schemas/permission.schema';
import { Role, RoleSchema } from 'src/roles/schemas/role.schema';

@Module({
  controllers: [DatabasesController],
  providers: [DatabasesService],

  imports: [
    UsersModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Permission.name,
        schema: PermissionSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
    ]),
  ],
})
export class DatabasesModule {}
