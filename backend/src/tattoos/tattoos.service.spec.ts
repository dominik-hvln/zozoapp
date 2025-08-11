import { Test, TestingModule } from '@nestjs/testing';
import { TattoosService } from './tattoos.service';

describe('TattoosService', () => {
  let service: TattoosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TattoosService],
    }).compile();

    service = module.get<TattoosService>(TattoosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
