import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Декоратор для проверки, что хотя бы одно из указанных полей присутствует
 * @param fields Список имён полей, среди которых хотя бы одно должно быть заполнено
 * @param validationOptions Опции валидации (сообщение, группа и т.д.)
 */
export function AtLeastOneOf<
  Obj extends Record<string, any> = Record<string, any>,
>(fields: (keyof Obj)[], validationOptions?: ValidationOptions) {
  return function (target: Obj, propertyKey: string) {
    registerDecorator({
      name: 'atLeastOneOf',
      target: target.constructor,
      propertyName: propertyKey,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object;

          // Проверяем, есть ли хотя бы одно непустое поле из списка
          return fields.some((field) => {
            const fieldValue = (object as any)[field];
            return fieldValue !== undefined && fieldValue !== null;
          });
        },
        defaultMessage(args: ValidationArguments) {
          const fieldsList = fields.join(', ');
          return `${args.property} требует, чтобы хотя бы одно из полей было заполнено: ${fieldsList}`;
        },
      },
    });
  };
}
