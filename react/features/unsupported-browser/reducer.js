import { ReducerRegistry } from '../base/redux';

import { DISMISS_MOBILE_APP_PROMO } from './actionTypes';

ReducerRegistry.register(
        'features/unsupported-browser',
        (state = {}, action) => {
            switch (action.type) {
            case DISMISS_MOBILE_APP_PROMO:
                return {
                    ...state,

                    /**
                     * The indicator which determines whether the React
                     * Component UnsupportedMobileBrowser which was rendered as
                     * a promotion of the mobile app on a browser was dismissed
                     * by the user. If unused, then we have chosen to force the
                     * mobile app and not allow the Web app in mobile browsers.
                     *
                     * @type {boolean}
                     */
                    mobileAppPromoDismissed: true
                };
            }

            return state;
        });
