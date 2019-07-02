// @flow

import React, { Component } from 'react';

import { translate } from '../../../../base/i18n';

import { _formatConferenceIDPin } from '../../../_utils';

/**
 * The type of the React {@code Component} props of {@link DialInNumber}.
 */
type Props = {

    /**
     * The numberic identifier for the current conference, used after dialing a
     * the number to join the conference.
     */
    conferenceID: number,

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
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @extends Component
 */
class DialInNumber extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { conferenceID, phoneNumber, t } = this.props;

        return (
            <div className = 'dial-in-number'>
                <span className = 'phone-number'>
                    <span className = 'info-label'>
                        { t('info.dialInNumber') }
                    </span>
                    <span className = 'spacer'>&nbsp;</span>
                    <span className = 'info-value'>
                        { phoneNumber }
                    </span>
                </span>
                <span className = 'spacer'>&nbsp;</span>
                <span className = 'conference-id'>
                    <span className = 'info-label'>
                        { t('info.dialInConferenceID') }
                    </span>
                    <span className = 'spacer'>&nbsp;</span>
                    <span className = 'info-value'>
                        { `${_formatConferenceIDPin(conferenceID)}#` }
                    </span>
                </span>
            </div>
        );
    }
}

export default translate(DialInNumber);
