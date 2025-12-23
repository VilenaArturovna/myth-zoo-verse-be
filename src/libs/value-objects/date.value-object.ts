import { isDateString } from 'class-validator';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as tz from 'dayjs/plugin/timezone';
import { ValueObject } from '../base-classes/value-object.base';
import 'dayjs/locale/ru';
import { ManipulateType, UnitType } from 'dayjs';
import { isoStringTemplate } from '@libs/constants';

dayjs.extend(utc);
dayjs.extend(tz);
export class DateVO extends ValueObject<Date> {
  constructor(value: Date | string | number) {
    if (typeof value === 'string') {
      if (!isDateString(value))
        throw new Error(`Значение ${value} не является валидным для даты`);
    }

    const date = new Date(value);
    super({ value: date });
  }

  public get value(): Date {
    return new Date(this.props.value);
  }

  public static now(): DateVO {
    return new DateVO(Date.now());
  }

  public get ISOString(): string {
    return new Date(this.value).toISOString();
  }

  public isBefore(date: DateVO): boolean {
    return this.value.getTime() < date.value.getTime();
  }

  public isAfter(date: DateVO): boolean {
    return this.value.getTime() > date.value.getTime();
  }

  public getHoursUtc(): number {
    return dayjs.utc(this.value).get('hour');
  }

  public getOnlyDateForTelegram(): string {
    return dayjs.utc(this.value).locale('ru').format('D MMMM (dd)');
  }

  public add(amount: number, unit: ManipulateType): DateVO {
    const result = dayjs.utc(this.value).add(amount, unit);

    return new DateVO(result.toISOString());
  }

  public subtract(amount: number, unit: ManipulateType): DateVO {
    const result = dayjs.utc(this.value).subtract(amount, unit);

    return new DateVO(result.toISOString());
  }

  public isSame(date: DateVO, unit: 'day' | 'hour'): boolean {
    return dayjs.utc(this.value).isSame(dayjs(date.value), unit);
  }

  public setHourUTC(hour: number) {
    const d = dayjs.utc(this.value).set('hour', hour);

    return new DateVO(d.toISOString());
  }

  public getUnit(unit: UnitType): number {
    return dayjs(this.value).get(unit);
  }

  public formatToIsoString() {
    return dayjs.utc(this.value).format(isoStringTemplate);
  }
}
