import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

import i18next from './i18next';

// allows for moment durations to be formatted
momentDurationFormatSetup(moment);

// MomentJS uses static language bundle loading, so in order to support dynamic
// language selection in the app we need to load all bundles that we support in
// the app.
require('moment/locale/af');
require('moment/locale/ar');
require('moment/locale/be');
require('moment/locale/bg');
require('moment/locale/ca');
require('moment/locale/cs');
require('moment/locale/da');
require('moment/locale/de');
require('moment/locale/el');
require('moment/locale/en-gb');
require('moment/locale/eo');
require('moment/locale/es-us');
require('moment/locale/es');
require('moment/locale/et');
require('moment/locale/eu');
require('moment/locale/fa');
require('moment/locale/fi');
require('moment/locale/fr-ca');
require('moment/locale/fr');
require('moment/locale/gl');
require('moment/locale/he');
require('moment/locale/hr');
require('moment/locale/hu');
require('moment/locale/hy-am');
require('moment/locale/id');
require('moment/locale/is');
require('moment/locale/it');
require('moment/locale/ja');
require('moment/locale/ko');
require('moment/locale/lt');
require('moment/locale/lv');
require('moment/locale/ml');
require('moment/locale/mn');
require('moment/locale/mr');
require('moment/locale/nb');
require('moment/locale/nl');
require('moment/locale/oc-lnc');
require('moment/locale/pl');
require('moment/locale/pt');
require('moment/locale/pt-br');
require('moment/locale/ro');
require('moment/locale/ru');
require('moment/locale/sk');
require('moment/locale/sl');
require('moment/locale/sr');
require('moment/locale/sv');
require('moment/locale/tr');
require('moment/locale/uk');
require('moment/locale/vi');
require('moment/locale/zh-cn');
require('moment/locale/zh-tw');

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

    // @ts-ignore
    if (moment.duration(duration).format('h') !== '0') {
        // @ts-ignore
        return moment.duration(duration).format('h:mm:ss');
    }

    // @ts-ignore
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

    return supportedLocale || 'en';
}
