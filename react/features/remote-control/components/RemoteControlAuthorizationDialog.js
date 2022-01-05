// @flow

import React, { Component } from 'react';

import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getParticipantById } from '../../base/participants';
import { connect } from '../../base/redux';
import { getLocalVideoTrack } from '../../base/tracks';
import { grant, deny } from '../actions';

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

    _isScreenSharing: boolean,
    _sourceType: string,

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
        const { _isScreenSharing, _sourceType } = this.props;

        if (_isScreenSharing && _sourceType === 'screen') {
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
        const { dispatch, participantId } = this.props;

        dispatch(deny(participantId));

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
        const { dispatch, participantId } = this.props;

        dispatch(hideDialog());
        dispatch(grant(participantId));

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
 *     _displayName: string,
 *     _isScreenSharing: boolean,
 *     _sourceId: string,
 *     _sourceType: string
 * }}
 */
function _mapStateToProps(state, ownProps) {
    const { _displayName, participantId } = ownProps;
    const participant = getParticipantById(state, participantId);
    const tracks = state['features/base/tracks'];
    const track = getLocalVideoTrack(tracks);
    const _isScreenSharing = track?.videoType === 'desktop';
    const { sourceType } = track?.jitsiTrack || {};

    return {
        _displayName: participant ? participant.name : _displayName,
        _isScreenSharing,
        _sourceType: sourceType
    };
}

export default translate(
    connect(_mapStateToProps)(RemoteControlAuthorizationDialog));
