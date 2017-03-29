/* @flow */

import { dismissMobileAppPromo } from '../actions';
import { DISMISS_MOBILE_APP_PROMO } from '../actionTypes';

declare var describe: Function;
declare var expect: Function;
declare var it: Function;

/**
 *  Test suite related to unsupported browser actions.
 */
describe('Unsupported browser actions', () => {

    /**
     *  Checks whether action creator returns action with correct type.
     */
    it('Dismiss mobile app promo has correct action type', () => {
        const action = dismissMobileAppPromo();

        expect(action.type).toBe(DISMISS_MOBILE_APP_PROMO);
    });
});
