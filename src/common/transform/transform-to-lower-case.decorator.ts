import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

export const TransformToLowerCaseDecorator = () => {
  return applyDecorators(
    Transform(({ value }: { value: string | undefined | null }) => {
      return value ? value.toLowerCase() : value;
    }),
  );
};
