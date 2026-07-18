import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const isValid = Types.ObjectId.isValid(value);
    if (!isValid) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}
