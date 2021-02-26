// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { getDialInfoPageURL } from '../../../functions';

import DialInNumber from './DialInNumber';

type Props = {

    /**
     * The object representing the dialIn feature.
     */
    _dialIn: Object,

    /**
     * The url of the page containing the dial-in numbers list.
     */
    _dialInfoPageUrl: string,

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
    _dialIn,
    _dialInfoPageUrl,
    phoneNumber,
    t
}: Props) {
    return (
        <div className = 'invite-more-dialog dial-in-display'>
            <DialInNumber
                conferenceID = { _dialIn.conferenceID }
                phoneNumber = { phoneNumber } />
            <a
                className = 'more-numbers'
                href = { _dialInfoPageUrl }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { t('info.moreNumbers') }
            </a>
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
    return {
        _dialIn: state['features/invite'],
        _dialInfoPageUrl: getDialInfoPageURL(state)
    };
}

export default translate(connect(_mapStateToProps)(DialInSection));
