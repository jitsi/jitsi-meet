import dayjs from 'dayjs';
import durationPlugin from 'dayjs/plugin/duration';
import localizedFormatPlugin from 'dayjs/plugin/localizedFormat';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';

import i18next from './i18next';

dayjs.extend(durationPlugin);
dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormatPlugin);

// Day.js uses static language bundle loading, so in order to support dynamic
// language selection in the app we need to load all bundles that we support in
// the app.
import 'dayjs/locale/af';
import 'dayjs/locale/ar';
import 'dayjs/locale/be';
import 'dayjs/locale/bg';
import 'dayjs/locale/ca';
import 'dayjs/locale/cs';
import 'dayjs/locale/da';
import 'dayjs/locale/de';
import 'dayjs/locale/el';
import 'dayjs/locale/eo';
import 'dayjs/locale/es';
import 'dayjs/locale/es-us';
import 'dayjs/locale/et';
import 'dayjs/locale/eu';
import 'dayjs/locale/fa';
import 'dayjs/locale/fi';
import 'dayjs/locale/fr';
import 'dayjs/locale/fr-ca';
import 'dayjs/locale/gl';
import 'dayjs/locale/he';
import 'dayjs/locale/hi';
import 'dayjs/locale/hr';
import 'dayjs/locale/hu';
import 'dayjs/locale/hy-am';
import 'dayjs/locale/id';
import 'dayjs/locale/is';
import 'dayjs/locale/it';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/lt';
import 'dayjs/locale/lv';
import 'dayjs/locale/ml';
import 'dayjs/locale/mn';
import 'dayjs/locale/mr';
import 'dayjs/locale/nb';
import 'dayjs/locale/nl';
import 'dayjs/locale/oc-lnc';
import 'dayjs/locale/pl';
import 'dayjs/locale/pt';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/ro';
import 'dayjs/locale/ru';
import 'dayjs/locale/sk';
import 'dayjs/locale/sl';
import 'dayjs/locale/sq';
import 'dayjs/locale/sr';
import 'dayjs/locale/sv';
import 'dayjs/locale/te';
import 'dayjs/locale/tr';
import 'dayjs/locale/uk';
import 'dayjs/locale/vi';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

const LOCALE_MAPPING: Record<string, string> = {
    // i18next -> dayjs
    'hy': 'hy-am',
    'oc': 'oc-lnc',
    'zhCN': 'zh-cn',
    'zhTW': 'zh-tw',
    'ptBR': 'pt-br',
    'esUS': 'es-us',
    'frCA': 'fr-ca'
};

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
    return dayjs(dateOrTimeStamp).locale(_getSupportedLocale());
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
    // If the conference is under an hour long we want to display it without
    // showing the hour and we want to include the hour if the conference is
    // more than an hour long

    const d = dayjs.duration(duration);

    if (d.hours() !== 0) {
        return d.format('H:mm:ss');
    }

    return d.format('mm:ss');
}

/**
 * A lenient locale matcher to match language and dialect if possible.
 *
 * @private
 * @returns {string}
 */
function _getSupportedLocale() {
    const availableLocales = Object.keys(dayjs.Ls);
    const i18nLocale = i18next.language;
    let supportedLocale;

    if (LOCALE_MAPPING[i18nLocale]) {
        return LOCALE_MAPPING[i18nLocale];
    }

    if (availableLocales.includes(i18nLocale)) {
        return i18nLocale;
    }

    if (i18nLocale) {
        const localeRegexp = new RegExp('^([a-z]{2,2})(-)*([a-z]{2,2})*$');
        const localeResult = localeRegexp.exec(i18nLocale.toLowerCase());

        if (localeResult) {
            const currentLocaleRegexp
                = new RegExp(
                    `^${localeResult[1]}(-)*${`(${localeResult[3]})*` || ''}`);

            supportedLocale
                = availableLocales.find(lang => currentLocaleRegexp.exec(lang));
        }
    }

    return supportedLocale || 'en';
}
