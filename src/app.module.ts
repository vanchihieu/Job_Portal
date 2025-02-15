import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb+srv://vanchihieu3:f6EH0nOF0bGZiQ7K@cluster0.sb1yd.mongodb.net/')],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
