import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * Displays a conference ID used as a pin for dialing into a conferene.
 *
 * @extends Component
 */
class ConferenceID extends Component {
    /**
     * {@code ConferenceID} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The conference ID for dialing in.
         */
        conferenceID: PropTypes.number,

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
        const { conferenceID, t } = this.props;

        return (
            <div className = 'dial-in-conference-id'>
                { t('info.dialANumber', { conferenceID }) }
            </div>
        );
    }
}

export default translate(ConferenceID);
