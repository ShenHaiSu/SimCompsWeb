import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '@modules/user/user.module';

// 引入数据库
import { databaseConfig } from '@config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [UserModule, TypeOrmModule.forRoot(databaseConfig)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
