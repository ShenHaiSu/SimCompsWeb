import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: './dbSet/main.db', // 改成你想存的路径，比如 'db.sqlite'
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // 自动加载实体
  synchronize: true, // 开发时用，自动建表；生产环境设 false
};
