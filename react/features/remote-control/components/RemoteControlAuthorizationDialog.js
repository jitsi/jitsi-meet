// @flow

import React, { Component } from 'react';

import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getParticipantById } from '../../base/participants';
import { connect } from '../../base/redux';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of
 * {@link RemoteControlAuthorizationDialog}.
 */
type Props = {

    /**
     * The display name of the participant who is requesting authorization for
     * remote desktop control session.
     */
    _displayName: string,

    /**
     * Used to show/hide the dialog on cancel.
     */
    dispatch: Function,

    /**
     * The ID of the participant who is requesting authorization for remote
     * desktop control session.
     */
    participantId: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a dialog for remote control authorization.
 */
class RemoteControlAuthorizationDialog extends Component<Props> {
    /**
     * Initializes a new RemoteControlAuthorizationDialog instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Dialog
                okKey = { 'dialog.allow' }
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.remoteControlTitle'
                width = 'small'>
                {
                    this.props.t(
                        'dialog.remoteControlRequestMessage',
                        { user: this.props._displayName })
                }
                {
                    this._getAdditionalMessage()
                }
            </Dialog>
        );
    }

    /**
     * Renders additional message text for the dialog.
     *
     * @private
     * @returns {ReactElement}
     */
    _getAdditionalMessage() {
        // FIXME: Once we have this information in redux we should
        // start getting it from there.
        if (APP.conference.isSharingScreen
                && APP.conference.getDesktopSharingSourceType() === 'screen') {
            return null;
        }

        return (
            <div>
                <br />
                { this.props.t('dialog.remoteControlShareScreenWarning') }
            </div>
        );
    }

    _onCancel: () => boolean;

    /**
     * Notifies the remote control module about the denial of the remote control
     * request.
     *
     * @private
     * @returns {boolean} Returns true to close the dialog.
     */
    _onCancel() {
        // FIXME: This should be action one day.
        APP.remoteControl.receiver.deny(this.props.participantId);

        return true;
    }

    _onSubmit: () => boolean;

    /**
     * Notifies the remote control module that the remote control request is
     * accepted.
     *
     * @private
     * @returns {boolean} Returns false to prevent closure because the dialog is
     * closed manually to be sure that if the desktop picker dialog can be
     * displayed (if this dialog is displayed when we try to display the desktop
     * picker window, the action will be ignored).
     */
    _onSubmit() {
        this.props.dispatch(hideDialog());

        // FIXME: This should be action one day.
        APP.remoteControl.receiver.grant(this.props.participantId);

        return false;
    }
}

/**
 * Maps (parts of) the Redux state to the RemoteControlAuthorizationDialog's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The React Component props passed to the associated
 * (instance of) RemoteControlAuthorizationDialog.
 * @private
 * @returns {{
 *     _displayName: string
 * }}
 */
function _mapStateToProps(state, ownProps) {
    const { _displayName, participantId } = ownProps;
    const participant = getParticipantById(state, participantId);

    return {
        _displayName: participant ? participant.name : _displayName
    };
}

export default translate(
    connect(_mapStateToProps)(RemoteControlAuthorizationDialog));
