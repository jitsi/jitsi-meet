import { ReducerRegistry } from '../base/redux';

import { MOBILE_BROWSER_PAGE_IS_SHOWN } from './actionTypes';

ReducerRegistry.register(
        'features/unsupported-browser',
        (state = {}, action) => {
            switch (action.type) {
            case MOBILE_BROWSER_PAGE_IS_SHOWN:
                return {
                    ...state,

                    /**
                     * Flag that shows that mobile browser page is shown.
                     *
                     * @type {boolean}
                     */
                    mobileBrowserPageIsShown: true
                };
            }

            return state;
        });
