import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Type } from '@nestjs/common';
import { ERRORS } from '../errors/errors';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const validationErrors: Record<string, string[]> = {};

      errors.forEach((error) => {
        const property = error.property;
        const constraints = error.constraints || {};
        validationErrors[property] = Object.values(constraints);
      });

      throw new BadRequestException({
        message: ERRORS.GENERIC.VALIDATION_ERROR({ reason: 'Invalid input data' }).message,
        errors: validationErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: Type<any>): boolean {
    const types: Type<any>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
