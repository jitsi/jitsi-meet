import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { translate } from '../../../base/i18n';

/**
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @extends Component
 */
class DialInNumber extends Component {
    /**
     * {@code DialInNumber} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The numberic identifier for the current conference, used after
         * dialing a the number to join the conference.
         */
        conferenceID: PropTypes.number,

        /**
         * The phone number to dial to begin the process of dialing into a
         * conference.
         */
        phoneNumber: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { conferenceID, phoneNumber } = this.props;

        return (
            <div className = 'dial-in-number'>
                <span className = 'phone-number'>
                    { this.props.t('info.dialInNumber', { phoneNumber }) }
                </span>
                <span className = 'conference-id'>
                    { this.props.t(
                        'info.dialInConferenceID', { conferenceID }) }
                </span>
            </div>
        );
    }
}

export default translate(DialInNumber);
