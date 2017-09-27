import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

// TODO: Move these enums into the store after further reactification of the
// non-react RemoteVideo component.
export const REMOTE_CONTROL_MENU_STATES = {
    NOT_SUPPORTED: 0,
    NOT_STARTED: 1,
    REQUESTING: 2,
    STARTED: 3
};

/**
 * Implements a React {@link Component} which displays a button showing the
 * current state of remote control for a participant and can start or stop a
 * remote control session.
 *
 * @extends Component
 */
class RemoteControlButton extends Component {
    /**
     * {@code RemoteControlButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The callback to invoke when the component is clicked.
         */
        onClick: PropTypes.func,

        /**
         * The ID of the participant linked to the onClick callback.
         */
        participantID: PropTypes.string,

        /**
         * The current status of remote control. Should be a number listed in
         * the enum REMOTE_CONTROL_MENU_STATES.
         */
        remoteControlState: PropTypes.number,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null|ReactElement}
     */
    render() {
        const {
            onClick,
            participantID,
            remoteControlState,
            t
        } = this.props;

        let className, icon;

        switch (remoteControlState) {
        case REMOTE_CONTROL_MENU_STATES.NOT_STARTED:
            className = 'requestRemoteControlLink';
            icon = 'fa fa-play';
            break;
        case REMOTE_CONTROL_MENU_STATES.REQUESTING:
            className = 'requestRemoteControlLink disabled';
            icon = 'remote-control-spinner fa fa-spinner fa-spin';
            break;
        case REMOTE_CONTROL_MENU_STATES.STARTED:
            className = 'requestRemoteControlLink';
            icon = 'fa fa-stop';
            break;
        case REMOTE_CONTROL_MENU_STATES.NOT_SUPPORTED:

            // Intentionally fall through.
        default:
            return null;
        }

        return (
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.remoteControl') }
                displayClass = { className }
                iconClass = { icon }
                id = { `remoteControl_${participantID}` }
                onClick = { onClick } />
        );
    }
}

export default translate(RemoteControlButton);
