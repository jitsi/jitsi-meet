// @flow

import moment from 'moment';

import i18next from './i18next';

// MomentJS uses static language bundle loading, so in order to support dynamic
// language selection in the app we need to load all bundles that we support in
// the app.
require('moment/locale/bg');
require('moment/locale/de');
require('moment/locale/eo');
require('moment/locale/es');
require('moment/locale/fr');
require('moment/locale/hy-am');
require('moment/locale/it');
require('moment/locale/nb');

// OC is not available. Please submit OC translation to the MomentJS project.

require('moment/locale/pl');
require('moment/locale/pt');
require('moment/locale/pt-br');
require('moment/locale/ru');
require('moment/locale/sk');
require('moment/locale/sl');
require('moment/locale/sv');
require('moment/locale/tr');
require('moment/locale/zh-cn');

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
    // $FlowFixMe
    return moment.duration(duration).locale(_getSupportedLocale());
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
                //
                // $FlowFixMe
                = moment.locales().find(lang => currentLocaleRegexp.exec(lang));
        }
    }

    return supportedLocale || 'en';
}
