/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link ConferenceID}.
 */
type Props = {

    /**
     * The conference ID for dialing in.
     */
    conferenceID: number,

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
        const { conferenceID, t } = this.props;

        return (
            <div className = 'dial-in-conference-id'>
                { t('info.dialANumber', { conferenceID }) }
            </div>
        );
    }
}

export default translate(ConferenceID);
