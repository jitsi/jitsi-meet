import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRemoteVideoMenuButtonEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { translate } from '../../../base/i18n/functions';
import { IconRemoteControlStart, IconRemoteControlStop } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';

// TODO: Move these enums into the store after further reactification of the
// non-react RemoteVideo component.
export const REMOTE_CONTROL_MENU_STATES = {
    NOT_SUPPORTED: 0,
    NOT_STARTED: 1,
    REQUESTING: 2,
    STARTED: 3
};

/**
 * The type of the React {@code Component} props of {@link RemoteControlButton}.
 */
interface IProps extends WithTranslation {

    /**
     * Callback to execute when the button is clicked.
     */
    notifyClick?: Function;

    /**
     * Notify mode for `participantMenuButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * The callback to invoke when the component is clicked.
     */
    onClick: (() => void) | null;

    /**
     * The ID of the participant linked to the onClick callback.
     */
    participantID: string;

    /**
     * The current status of remote control. Should be a number listed in the
     * enum REMOTE_CONTROL_MENU_STATES.
     */
    remoteControlState: number;
}

/**
 * Implements a React {@link Component} which displays a button showing the
 * current state of remote control for a participant and can start or stop a
 * remote control session.
 *
 * @augments Component
 */
class RemoteControlButton extends Component<IProps> {
    /**
     * Initializes a new {@code RemoteControlButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null|ReactElement}
     */
    override render() {
        const { remoteControlState, t } = this.props;

        let disabled = false, icon;

        switch (remoteControlState) {
        case REMOTE_CONTROL_MENU_STATES.NOT_STARTED:
            icon = IconRemoteControlStart;
            break;
        case REMOTE_CONTROL_MENU_STATES.REQUESTING:
            disabled = true;
            icon = IconRemoteControlStart;
            break;
        case REMOTE_CONTROL_MENU_STATES.STARTED:
            icon = IconRemoteControlStop;
            break;
        case REMOTE_CONTROL_MENU_STATES.NOT_SUPPORTED:

            // Intentionally fall through.
        default:
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t('videothumbnail.remoteControl') }
                className = 'kicklink'
                disabled = { disabled }
                icon = { icon }
                onClick = { this._onClick }
                text = { t('videothumbnail.remoteControl') } />
        );
    }

    /**
     * Sends analytics event for pressing the button and executes the passed
     * onClick handler.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { notifyClick, notifyMode, onClick, participantID, remoteControlState } = this.props;

        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }

        // TODO: What do we do in case the state is e.g. "requesting"?
        if (remoteControlState === REMOTE_CONTROL_MENU_STATES.STARTED
            || remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED) {

            const enable
                = remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED;

            sendAnalytics(createRemoteVideoMenuButtonEvent(
                'remote.control.button',
                {
                    enable,
                    'participant_id': participantID
                }));
        }
        onClick?.();

    }
}

export default translate(RemoteControlButton);
