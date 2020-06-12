// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { getRoomName } from '../../base/conference';
import { translate } from '../../base/i18n';
import { Icon, IconPhone, IconVolumeOff } from '../../base/icons';
import { ActionButton, InputField, PreMeetingScreen } from '../../base/premeeting';
import { connect } from '../../base/redux';
import { getDisplayName, updateSettings } from '../../base/settings';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setSkipPrejoin as setSkipPrejoinAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../actions';
import {
    getActiveVideoTrack,
    isJoinByPhoneButtonVisible,
    isDeviceStatusVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinVideoMuted
} from '../functions';

import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';
import DeviceStatus from './preview/DeviceStatus';

type Props = {

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean,

    /**
     * If join by phone button should be visible.
     */
    hasJoinByPhoneButton: boolean,

    /**
     * Joins the current meeting.
     */
    joinConference: Function,

    /**
     * Joins the current meeting without audio.
     */
    joinConferenceWithoutAudio: Function,

    /**
     * The name of the user that is about to join.
     */
    name: string,

    /**
     * Updates settings.
     */
    updateSettings: Function,

    /**
     * The name of the meeting that is about to be joined.
     */
    roomName: string,

    /**
     * Sets visibility of the prejoin page for the next sessions.
     */
    setSkipPrejoin: Function,

    /**
     * Sets visibility of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object,
};

type State = {

    /**
     * Flag controlling the visibility of the 'join by phone' buttons.
     */
    showJoinByPhoneButtons: boolean
}

/**
 * This component is displayed before joining a meeting.
 */
class Prejoin extends Component<Props, State> {
    /**
     * Initializes a new {@code Prejoin} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            showJoinByPhoneButtons: false
        };

        this._closeDialog = this._closeDialog.bind(this);
        this._showDialog = this._showDialog.bind(this);
        this._onCheckboxChange = this._onCheckboxChange.bind(this);
        this._onDropdownClose = this._onDropdownClose.bind(this);
        this._onOptionsClick = this._onOptionsClick.bind(this);
        this._setName = this._setName.bind(this);
    }

    _onCheckboxChange: () => void;

    /**
     * Handler for the checkbox.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onCheckboxChange(e) {
        this.props.setSkipPrejoin(e.target.checked);
    }

    _onDropdownClose: () => void;

    /**
     * Closes the dropdown.
     *
     * @returns {void}
     */
    _onDropdownClose() {
        this.setState({
            showJoinByPhoneButtons: false
        });
    }

    _onOptionsClick: () => void;

    /**
     * Displays the join by phone buttons dropdown.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onOptionsClick(e) {
        e.stopPropagation();

        this.setState({
            showJoinByPhoneButtons: !this.state.showJoinByPhoneButtons
        });
    }

    _setName: () => void;

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    _setName(displayName) {
        this.props.updateSettings({
            displayName
        });
    }

    _closeDialog: () => void;

    /**
     * Closes the join by phone dialog.
     *
     * @returns {undefined}
     */
    _closeDialog() {
        this.props.setJoinByPhoneDialogVisiblity(false);
    }

    _showDialog: () => void;

    /**
     * Displays the dialog for joining a meeting by phone.
     *
     * @returns {undefined}
     */
    _showDialog() {
        this.props.setJoinByPhoneDialogVisiblity(true);
        this._onDropdownClose();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            hasJoinByPhoneButton,
            joinConference,
            joinConferenceWithoutAudio,
            name,
            showCameraPreview,
            showDialog,
            t,
            videoTrack
        } = this.props;

        const { _closeDialog, _onCheckboxChange, _onDropdownClose, _onOptionsClick, _setName, _showDialog } = this;
        const { showJoinByPhoneButtons } = this.state;

        return (
            <PreMeetingScreen
                footer = { this._renderFooter() }
                title = { t('prejoin.joinMeeting') }
                videoMuted = { !showCameraPreview }
                videoTrack = { videoTrack }>
                <div className = 'prejoin-input-area-container'>
                    <div className = 'prejoin-input-area'>
                        <InputField
                            onChange = { _setName }
                            onSubmit = { joinConference }
                            placeHolder = { t('dialog.enterDisplayName') }
                            value = { name } />

                        <div className = 'prejoin-preview-dropdown-container'>
                            <InlineDialog
                                content = { <div className = 'prejoin-preview-dropdown-btns'>
                                    <div
                                        className = 'prejoin-preview-dropdown-btn'
                                        onClick = { joinConferenceWithoutAudio }>
                                        <Icon
                                            className = 'prejoin-preview-dropdown-icon'
                                            size = { 24 }
                                            src = { IconVolumeOff } />
                                        { t('prejoin.joinWithoutAudio') }
                                    </div>
                                    {hasJoinByPhoneButton && <div
                                        className = 'prejoin-preview-dropdown-btn'
                                        onClick = { _showDialog }>
                                        <Icon
                                            className = 'prejoin-preview-dropdown-icon'
                                            size = { 24 }
                                            src = { IconPhone } />
                                        { t('prejoin.joinAudioByPhone') }
                                    </div>}
                                </div> }
                                isOpen = { showJoinByPhoneButtons }
                                onClose = { _onDropdownClose }>
                                <ActionButton
                                    disabled = { !name }
                                    hasOptions = { true }
                                    onClick = { joinConference }
                                    onOptionsClick = { _onOptionsClick }
                                    type = 'primary'>
                                    { t('prejoin.joinMeeting') }
                                </ActionButton>
                            </InlineDialog>
                        </div>
                    </div>

                    <div className = 'prejoin-checkbox-container'>
                        <input
                            className = 'prejoin-checkbox'
                            onChange = { _onCheckboxChange }
                            type = 'checkbox' />
                        <span>{t('prejoin.doNotShow')}</span>
                    </div>
                </div>
                { showDialog && (
                    <JoinByPhoneDialog
                        joinConferenceWithoutAudio = { joinConferenceWithoutAudio }
                        onClose = { _closeDialog } />
                )}
            </PreMeetingScreen>
        );
    }

    /**
     * Renders the screen footer if any.
     *
     * @returns {React$Element}
     */
    _renderFooter() {
        return this.props.deviceStatusVisible && <DeviceStatus />;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        name: getDisplayName(state),
        roomName: getRoomName(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        showCameraPreview: !isPrejoinVideoMuted(state),
        videoTrack: getActiveVideoTrack(state)
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    setSkipPrejoin: setSkipPrejoinAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(Prejoin));
