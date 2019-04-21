// @flow

import moment from 'moment';

import i18next from './i18next';

// allows for moment durations to be formatted
import 'moment-duration-format';

// MomentJS uses static language bundle loading, so in order to support dynamic
// language selection in the app we need to load all bundles that we support in
// the app.
// require('moment/locale/bg');
// require('moment/locale/de');
// require('moment/locale/eo');
// require('moment/locale/es');
// require('moment/locale/fr');
// require('moment/locale/hy-am');
// require('moment/locale/it');
// require('moment/locale/nb');

// OC is not available. Please submit OC translation to the MomentJS project.

// require('moment/locale/pl');
// require('moment/locale/pt');
// require('moment/locale/pt-br');
// require('moment/locale/ru');
// require('moment/locale/sk');
// require('moment/locale/sl');
// require('moment/locale/sv');
// require('moment/locale/tr');
// require('moment/locale/zh-cn');

moment.locale('zh-cn', {
    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
    weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'YYYY-MM-DD',
        LL: 'YYYY年MM月DD日',
        LLL: 'YYYY年MM月DD日Ah点mm分',
        LLLL: 'YYYY年MM月DD日ddddAh点mm分',
        l: 'YYYY-M-D',
        ll: 'YYYY年M月D日',
        lll: 'YYYY年M月D日 HH:mm',
        llll: 'YYYY年M月D日dddd HH:mm'
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '凌晨' || meridiem === '早上' ||
            meridiem === '上午') {
            return hour;
        } else if (meridiem === '下午' || meridiem === '晚上') {
            return hour + 12;
        } else {
            // '中午'
            return hour >= 11 ? hour : hour + 12;
        }
    },
    meridiem: function (hour, minute, isLower) {
        const hm = hour * 100 + minute;
        if (hm < 600) {
            return '凌晨';
        } else if (hm < 900) {
            return '早上';
        } else if (hm < 1130) {
            return '上午';
        } else if (hm < 1230) {
            return '中午';
        } else if (hm < 1800) {
            return '下午';
        } else {
            return '晚上';
        }
    },
    calendar: {
        sameDay: '[今天]LT',
        nextDay: '[明天]LT',
        nextWeek: '[下]ddddLT',
        lastDay: '[昨天]LT',
        lastWeek: '[上]ddddLT',
        sameElse: 'L'
    },
    dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '日';
            case 'M':
                return number + '月';
            case 'w':
            case 'W':
                return number + '周';
            default:
                return number;
        }
    },
    relativeTime: {
        future: '%s内',
        past: '%s前',
        s: '几秒',
        ss: '%d秒',
        m: '1分钟',
        mm: '%d分钟',
        h: '1小时',
        hh: '%d小时',
        d: '1天',
        dd: '%d天',
        M: '1个月',
        MM: '%d个月',
        y: '1年',
        yy: '%d年'
    },
    week: {
        // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
        dow: 1, // Monday is the first day of the week.
        doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
})
/**
 * Returns a localized date formatter initialized with a specific {@code Date}
 * or timestamp ({@code number}).
 *
 * @private
 * @param {Date | number} dateOrTimeStamp - The date or unix timestamp (ms)
 * to format.
 * @returns {Object}
 */
export function getLocalizedDateFormatter(dateOrTimeStamp: Date | number) {
    return moment(dateOrTimeStamp).locale(_getSupportedLocale());
}

/**
 * Returns a localized duration formatter initialized with a
 * specific duration ({@code number}).
 *
 * @private
 * @param {number} duration - The duration (ms)
 * to format.
 * @returns {Object}
 */
export function getLocalizedDurationFormatter(duration: number) {
    // FIXME The flow-type definition of moment is v2.3 while our package.json
    // states v2.19 so maybe locale on moment's duration was introduced in
    // between?
    //

    // If the conference is under an hour long we want to display it without
    // showing the hour and we want to include the hour if the conference is
    // more than an hour long

    if (moment.duration(duration).format('h') !== '0') {
        return moment.duration(duration).format('h:mm:ss');
    }

    return moment.duration(duration).format('mm:ss', { trim: false });
}

/**
 * A lenient locale matcher to match language and dialect if possible.
 *
 * @private
 * @returns {string}
 */
function _getSupportedLocale() {
    const i18nLocale = i18next.language;
    let supportedLocale;

    if (i18nLocale) {
        const localeRegexp = new RegExp('^([a-z]{2,2})(-)*([a-z]{2,2})*$');
        const localeResult = localeRegexp.exec(i18nLocale.toLowerCase());

        if (localeResult) {
            const currentLocaleRegexp
                = new RegExp(
                    `^${localeResult[1]}(-)*${`(${localeResult[3]})*` || ''}`);

            supportedLocale

                // FIXME The flow-type definition of moment is v2.3 while our
                // package.json states v2.19 so maybe locales on moment was
                // introduced in between?
                = moment.locales().find(lang => currentLocaleRegexp.exec(lang));
        }
    }

    return supportedLocale || 'zh-cn';
}
