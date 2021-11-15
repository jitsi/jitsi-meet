// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { getDialInfoPageURL, hasMultipleNumbers } from '../../../functions';

import DialInNumber from './DialInNumber';

type Props = {

    /**
     * The numeric identifier for the current conference, used after dialing a
     * the number to join the conference.
     */
    _conferenceID: number,

    /**
     * The url of the page containing the dial-in numbers list.
     */
    _dialInfoPageUrl: string,

    /**
     * If multiple dial-in numbers are available.
     */
    _hasMultipleNumbers: boolean;

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
    _conferenceID,
    _dialInfoPageUrl,
    _hasMultipleNumbers,
    phoneNumber,
    t
}: Props) {
    return (
        <div className = 'invite-more-dialog dial-in-display'>
            <DialInNumber
                conferenceID = { _conferenceID }
                phoneNumber = { phoneNumber } />
            {_hasMultipleNumbers ? <a
                className = 'more-numbers'
                href = { _dialInfoPageUrl }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { t('info.moreNumbers') }
            </a> : null}
        </div>
    );
}


/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DialInLink} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const dialIn = state['features/invite'];

    return {
        _conferenceID: dialIn.conferenceID,
        _dialInfoPageUrl: getDialInfoPageURL(state),
        _hasMultipleNumbers: hasMultipleNumbers(dialIn.numbers)
    };
}

export default translate(connect(_mapStateToProps)(DialInSection));
