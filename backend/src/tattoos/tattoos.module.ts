import { Module } from '@nestjs/common';
import { TattoosController } from './tattoos.controller';
import { TattoosService } from './tattoos.service';

@Module({
  controllers: [TattoosController],
  providers: [TattoosService]
})
export class TattoosModule {}
