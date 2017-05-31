import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for kicking out
 * a participant from the conference.
 *
 * @extends Component
 */
class KickButton extends Component {
    /**
     * {@code KickButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The callback to invoke when the component is clicked.
         */
        onClick: React.PropTypes.func,

        /**
         * The ID of the participant linked to the onClick callback.
         */
        participantID: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { onClick, participantID, t } = this.props;

        return (
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.kick') }
                iconClass = 'icon-kick'
                id = { `ejectlink_${participantID}` }
                onClick = { onClick } />
        );
    }
}

export default translate(KickButton);
