// @flow

import {
    checkLocalParticipantCanJoin,
    isJaneWaitingAreaEnabled
} from '../../../jane-waiting-area-native/functions';
import { getLocalParticipantType } from '../../participants/functions';

/**
 * Returns the field value in a platform generic way.
 *
 * @param {Object | string} fieldParameter - The parameter passed through the change event function.
 * @returns {string}
 */
export function getFieldValue(fieldParameter: Object | string) {
    return typeof fieldParameter === 'string' ? fieldParameter : fieldParameter?.target?.value;
}

// eslint-disable-next-line require-jsdoc
export function shouldShowPreCallMessage(state: Object) {

    if (isJaneWaitingAreaEnabled(state)) {
        return getLocalParticipantType(state) !== 'StaffMember' && !checkLocalParticipantCanJoin(state);
    }

    return true;
}
