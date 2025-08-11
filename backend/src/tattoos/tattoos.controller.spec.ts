import { Test, TestingModule } from '@nestjs/testing';
import { TattoosController } from './tattoos.controller';

describe('TattoosController', () => {
  let controller: TattoosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TattoosController],
    }).compile();

    controller = module.get<TattoosController>(TattoosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
