// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';
import { getDialInfoPageURL } from '../../../functions';

import DialInNumber from './DialInNumber';

type Props = {

    /**
     * The name of the current conference. Used as part of inviting users.
     */
    conferenceName: string,

    /**
     * The object representing the dialIn feature.
     */
    dialIn: Object,

    /**
     * The current location url of the conference.
     */
    locationUrl: Object,

    /**
     * The phone number to dial to begin the process of dialing into a
     * conference.
     */
    phoneNumber: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function

};

/**
 * Returns a ReactElement for showing how to dial into the conference, if
 * dialing in is available.
 *
 * @private
 * @returns {null|ReactElement}
 */
function DialInSection({
    conferenceName,
    dialIn,
    locationUrl,
    phoneNumber,
    t
}: Props) {
    return (
        <div className = 'invite-more-dialog dial-in-display'>
            <DialInNumber
                conferenceID = { dialIn.conferenceID }
                phoneNumber = { phoneNumber } />
            <a
                className = 'more-numbers'
                href = {
                    getDialInfoPageURL(
                        conferenceName,
                        locationUrl
                    )
                }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { t('info.moreNumbers') }
            </a>
        </div>
    );
}

export default translate(DialInSection);
