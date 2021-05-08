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
    const participantType = getLocalParticipantType(state);
    const { remoteParticipantsStatuses } = state['features/jane-waiting-area-native'];

    if (isJaneWaitingAreaEnabled(state)) {
        return participantType !== 'StaffMember'
            && !checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType);
    }

    return true;
}
