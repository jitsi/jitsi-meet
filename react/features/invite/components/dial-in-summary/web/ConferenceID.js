// @flow

import React, { Component } from 'react';

import { translate } from '../../../../base/i18n';

import { _formatConferenceIDPin } from '../../../_utils';

/**
 * The type of the React {@code Component} props of {@link ConferenceID}.
 */
type Props = {

    /**
     * The conference ID for dialing in.
     */
    conferenceID: number,

    /**
     * The name of the conference.
     */
    conferenceName: ?string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Displays a conference ID used as a pin for dialing into a conference.
 *
 * @extends Component
 */
class ConferenceID extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { conferenceID, conferenceName, t } = this.props;

        return (
            <div className = 'dial-in-conference-id'>
                <div className = 'dial-in-conference-name'>
                    { conferenceName }
                </div>
                <div className = 'dial-in-conference-description'>
                    { t('info.dialANumber') }
                </div>
                <div className = 'dial-in-conference-pin'>
                    { `${t('info.dialInConferenceID')} ${_formatConferenceIDPin(conferenceID)}` }
                </div>
            </div>
        );
    }
}

export default translate(ConferenceID);
