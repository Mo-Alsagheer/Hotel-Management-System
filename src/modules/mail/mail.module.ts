import { Module, Global } from '@nestjs/common';

// Concrete implementation
import { NodemailerMailService } from './mail.service';

// Abstract contract
import { MailService } from './interfaces/mail-service.interface';

@Global()
@Module({
  providers: [{ provide: MailService, useClass: NodemailerMailService }],
  exports: [MailService],
})
export class MailModule {}
