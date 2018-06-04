// flow-typed signature: c30aa20539f52183d4d30dd36d8ab9c2
// flow-typed version: 886cf7c002/moment_v2.3.x/flow_>=v0.63.x

type moment$MomentOptions = {
  y?: number | string,
  year?: number | string,
  years?: number | string,
  M?: number | string,
  month?: number | string,
  months?: number | string,
  d?: number | string,
  day?: number | string,
  days?: number | string,
  date?: number | string,
  h?: number | string,
  hour?: number | string,
  hours?: number | string,
  m?: number | string,
  minute?: number | string,
  minutes?: number | string,
  s?: number | string,
  second?: number | string,
  seconds?: number | string,
  ms?: number | string,
  millisecond?: number | string,
  milliseconds?: number | string
};

type moment$MomentObject = {
  years: number,
  months: number,
  date: number,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number
};

type moment$MomentCreationData = {
  input: string,
  format: string,
  locale: Object,
  isUTC: boolean,
  strict: boolean
};

type moment$CalendarFormat = string | ((moment: moment$Moment) => string);

type moment$CalendarFormats = {
  sameDay?: moment$CalendarFormat,
  nextDay?: moment$CalendarFormat,
  nextWeek?: moment$CalendarFormat,
  lastDay?: moment$CalendarFormat,
  lastWeek?: moment$CalendarFormat,
  sameElse?: moment$CalendarFormat
};

declare class moment$LocaleData {
  months(moment: moment$Moment): string,
  monthsShort(moment: moment$Moment): string,
  monthsParse(month: string): number,
  weekdays(moment: moment$Moment): string,
  weekdaysShort(moment: moment$Moment): string,
  weekdaysMin(moment: moment$Moment): string,
  weekdaysParse(weekDay: string): number,
  longDateFormat(dateFormat: string): string,
  isPM(date: string): boolean,
  meridiem(hours: number, minutes: number, isLower: boolean): string,
  calendar(
    key:
      | "sameDay"
      | "nextDay"
      | "lastDay"
      | "nextWeek"
      | "prevWeek"
      | "sameElse",
    moment: moment$Moment
  ): string,
  relativeTime(
    number: number,
    withoutSuffix: boolean,
    key: "s" | "m" | "mm" | "h" | "hh" | "d" | "dd" | "M" | "MM" | "y" | "yy",
    isFuture: boolean
  ): string,
  pastFuture(diff: any, relTime: string): string,
  ordinal(number: number): string,
  preparse(str: string): any,
  postformat(str: string): any,
  week(moment: moment$Moment): string,
  invalidDate(): string,
  firstDayOfWeek(): number,
  firstDayOfYear(): number
}
declare class moment$MomentDuration {
  humanize(suffix?: boolean): string,
  milliseconds(): number,
  asMilliseconds(): number,
  seconds(): number,
  asSeconds(): number,
  minutes(): number,
  asMinutes(): number,
  hours(): number,
  asHours(): number,
  days(): number,
  asDays(): number,
  months(): number,
  asMonths(): number,
  years(): number,
  asYears(): number,
  add(value: number | moment$MomentDuration | Object, unit?: string): this,
  subtract(value: number | moment$MomentDuration | Object, unit?: string): this,
  as(unit: string): number,
  get(unit: string): number,
  toJSON(): string,
  toISOString(): string,
  isValid(): boolean
}
declare class moment$Moment {
  static ISO_8601: string,
  static (
    string?: string,
    format?: string | Array<string>,
    strict?: boolean
  ): moment$Moment,
  static (
    string?: string,
    format?: string | Array<string>,
    locale?: string,
    strict?: boolean
  ): moment$Moment,
  static (
    initDate: ?Object | number | Date | Array<number> | moment$Moment | string
  ): moment$Moment,
  static unix(seconds: number): moment$Moment,
  static utc(): moment$Moment,
  static utc(number: number | Array<number>): moment$Moment,
  static utc(
    str: string,
    str2?: string | Array<string>,
    str3?: string
  ): moment$Moment,
  static utc(moment: moment$Moment): moment$Moment,
  static utc(date: Date): moment$Moment,
  static parseZone(): moment$Moment,
  static parseZone(rawDate: string): moment$Moment,
  static parseZone(
    rawDate: string,
    format: string | Array<string>
  ): moment$Moment,
  static parseZone(
    rawDate: string,
    format: string,
    strict: boolean
  ): moment$Moment,
  static parseZone(
    rawDate: string,
    format: string,
    locale: string,
    strict: boolean
  ): moment$Moment,
  isValid(): boolean,
  invalidAt(): 0 | 1 | 2 | 3 | 4 | 5 | 6,
  creationData(): moment$MomentCreationData,
  millisecond(number: number): this,
  milliseconds(number: number): this,
  millisecond(): number,
  milliseconds(): number,
  second(number: number): this,
  seconds(number: number): this,
  second(): number,
  seconds(): number,
  minute(number: number): this,
  minutes(number: number): this,
  minute(): number,
  minutes(): number,
  hour(number: number): this,
  hours(number: number): this,
  hour(): number,
  hours(): number,
  date(number: number): this,
  dates(number: number): this,
  date(): number,
  dates(): number,
  day(day: number | string): this,
  days(day: number | string): this,
  day(): number,
  days(): number,
  weekday(number: number): this,
  weekday(): number,
  isoWeekday(number: number): this,
  isoWeekday(): number,
  dayOfYear(number: number): this,
  dayOfYear(): number,
  week(number: number): this,
  weeks(number: number): this,
  week(): number,
  weeks(): number,
  isoWeek(number: number): this,
  isoWeeks(number: number): this,
  isoWeek(): number,
  isoWeeks(): number,
  month(number: number): this,
  months(number: number): this,
  month(): number,
  months(): number,
  quarter(number: number): this,
  quarter(): number,
  year(number: number): this,
  years(number: number): this,
  year(): number,
  years(): number,
  weekYear(number: number): this,
  weekYear(): number,
  isoWeekYear(number: number): this,
  isoWeekYear(): number,
  weeksInYear(): number,
  isoWeeksInYear(): number,
  get(string: string): number,
  set(unit: string, value: number): this,
  set(options: { [unit: string]: number }): this,
  static max(...dates: Array<moment$Moment>): moment$Moment,
  static max(dates: Array<moment$Moment>): moment$Moment,
  static min(...dates: Array<moment$Moment>): moment$Moment,
  static min(dates: Array<moment$Moment>): moment$Moment,
  add(
    value: number | moment$MomentDuration | moment$Moment | Object,
    unit?: string
  ): this,
  subtract(
    value: number | moment$MomentDuration | moment$Moment | string | Object,
    unit?: string
  ): this,
  startOf(unit: string): this,
  endOf(unit: string): this,
  local(): this,
  utc(): this,
  utcOffset(
    offset: number | string,
    keepLocalTime?: boolean,
    keepMinutes?: boolean
  ): this,
  utcOffset(): number,
  format(format?: string): string,
  fromNow(removeSuffix?: boolean): string,
  from(
    value: moment$Moment | string | number | Date | Array<number>,
    removePrefix?: boolean
  ): string,
  toNow(removePrefix?: boolean): string,
  to(
    value: moment$Moment | string | number | Date | Array<number>,
    removePrefix?: boolean
  ): string,
  calendar(refTime?: any, formats?: moment$CalendarFormats): string,
  diff(
    date: moment$Moment | string | number | Date | Array<number>,
    format?: string,
    floating?: boolean
  ): number,
  valueOf(): number,
  unix(): number,
  daysInMonth(): number,
  toDate(): Date,
  toArray(): Array<number>,
  toJSON(): string,
  toISOString(
    keepOffset?: boolean
  ): string,
  toObject(): moment$MomentObject,
  isBefore(
    date?: moment$Moment | string | number | Date | Array<number>,
    units?: ?string
  ): boolean,
  isSame(
    date?: moment$Moment | string | number | Date | Array<number>,
    units?: ?string
  ): boolean,
  isAfter(
    date?: moment$Moment | string | number | Date | Array<number>,
    units?: ?string
  ): boolean,
  isSameOrBefore(
    date?: moment$Moment | string | number | Date | Array<number>,
    units?: ?string
  ): boolean,
  isSameOrAfter(
    date?: moment$Moment | string | number | Date | Array<number>,
    units?: ?string
  ): boolean,
  isBetween(
    fromDate: moment$Moment | string | number | Date | Array<number>,
    toDate?: ?moment$Moment | string | number | Date | Array<number>,
    granularity?: ?string,
    inclusion?: ?string
  ): boolean,
  isDST(): boolean,
  isDSTShifted(): boolean,
  isLeapYear(): boolean,
  clone(): moment$Moment,
  static isMoment(obj: any): boolean,
  static isDate(obj: any): boolean,
  static locale(locale: string, localeData?: Object): string,
  static updateLocale(locale: string, localeData?: ?Object): void,
  static locale(locales: Array<string>): string,
  locale(locale: string, customization?: Object | null): moment$Moment,
  locale(): string,
  static months(): Array<string>,
  static monthsShort(): Array<string>,
  static weekdays(): Array<string>,
  static weekdaysShort(): Array<string>,
  static weekdaysMin(): Array<string>,
  static months(): string,
  static monthsShort(): string,
  static weekdays(): string,
  static weekdaysShort(): string,
  static weekdaysMin(): string,
  static localeData(key?: string): moment$LocaleData,
  static duration(
    value: number | Object | string,
    unit?: string
  ): moment$MomentDuration,
  static isDuration(obj: any): boolean,
  static normalizeUnits(unit: string): string,
  static invalid(object: any): moment$Moment
}

declare module "moment" {
  declare module.exports: Class<moment$Moment>;
}
