import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,         // Default XAMPP MySQL port
      username: 'root',   // Default XAMPP username
      password: '',       // Default XAMPP password is empty
      database: 'snowman', // YOUR DATABASE NAME
      entities: [User],
      synchronize: true,  // Auto-creates tables (turn off in production)
    }),
    UserModule,
  ],
})
export class AppModule {}