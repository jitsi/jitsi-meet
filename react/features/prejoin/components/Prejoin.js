// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { getRoomName } from '../../base/conference';
import { translate } from '../../base/i18n';
import { IconArrowDown, IconArrowUp, IconPhone, IconVolumeOff } from '../../base/icons';
import { isVideoMutedByUser } from '../../base/media';
import { ActionButton, InputField, PreMeetingScreen } from '../../base/premeeting';
import { connect } from '../../base/redux';
import { getDisplayName, updateSettings } from '../../base/settings';
import { getLocalJitsiVideoTrack } from '../../base/tracks';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../actions';
import {
    isDeviceStatusVisible,
    isDisplayNameRequired,
    isJoinByPhoneButtonVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinNameReadOnly
} from '../functions';

import DropdownButton from './DropdownButton';
import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';

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
     * Whether the name input should be read only or not.
     */
    readOnlyName: boolean,

    /**
     * The name of the meeting that is about to be joined.
     */
    roomName: string,

    /**
     * Sets visibility of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * If should show an error when joining without a name.
     */
    showErrorOnJoin: boolean,

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
    videoTrack: ?Object
};

type State = {

    /**
     * Flag controlling the visibility of the error label.
     */
    showError: boolean,

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
            showError: false,
            showJoinByPhoneButtons: false
        };

        this._closeDialog = this._closeDialog.bind(this);
        this._showDialog = this._showDialog.bind(this);
        this._onJoinButtonClick = this._onJoinButtonClick.bind(this);
        this._onDropdownClose = this._onDropdownClose.bind(this);
        this._onOptionsClick = this._onOptionsClick.bind(this);
        this._setName = this._setName.bind(this);
        this._onJoinConferenceWithoutAudioKeyPress = this._onJoinConferenceWithoutAudioKeyPress.bind(this);
        this._showDialogKeyPress = this._showDialogKeyPress.bind(this);
        this._onJoinKeyPress = this._onJoinKeyPress.bind(this);
    }
    _onJoinButtonClick: () => void;

    /**
     * Handler for the join button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onJoinButtonClick() {
        if (this.props.showErrorOnJoin) {
            this.setState({
                showError: true
            });

            return;
        }

        this.setState({ showError: false });
        this.props.joinConference();
    }

    _onJoinKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onJoinKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onJoinButtonClick();
        }
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

    _showDialogKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _showDialogKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._showDialog();
        }
    }

    _onJoinConferenceWithoutAudioKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onJoinConferenceWithoutAudioKeyPress(e) {
        if (this.props.joinConferenceWithoutAudio
            && (e.key === ' '
                || e.key === 'Enter')) {
            e.preventDefault();
            this.props.joinConferenceWithoutAudio();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            deviceStatusVisible,
            hasJoinByPhoneButton,
            joinConference,
            joinConferenceWithoutAudio,
            name,
            readOnlyName,
            showCameraPreview,
            showDialog,
            t,
            videoTrack
        } = this.props;

        const { _closeDialog, _onDropdownClose, _onJoinButtonClick, _onJoinKeyPress, _showDialogKeyPress,
            _onJoinConferenceWithoutAudioKeyPress, _onOptionsClick, _setName, _showDialog } = this;
        const { showJoinByPhoneButtons, showError } = this.state;

        return (
            <PreMeetingScreen
                showDeviceStatus = { deviceStatusVisible }
                title = { t('prejoin.joinMeeting') }
                videoMuted = { !showCameraPreview }
                videoTrack = { videoTrack }>
                <div
                    className = 'prejoin-input-area'
                    data-testid = 'prejoin.screen'>
                    <InputField
                        autoComplete = { 'name' }
                        autoFocus = { true }
                        className = { showError ? 'error' : '' }
                        hasError = { showError }
                        onChange = { _setName }
                        onSubmit = { joinConference }
                        placeHolder = { t('dialog.enterDisplayName') }
                        readOnly = { readOnlyName }
                        value = { name } />

                    {showError && <div
                        className = 'prejoin-error'
                        data-testid = 'prejoin.errorMessage'>{t('prejoin.errorMissingName')}</div>}

                    <div className = 'prejoin-preview-dropdown-container'>
                        <InlineDialog
                            content = { <div className = 'prejoin-preview-dropdown-btns'>
                                <DropdownButton
                                    dataTestId = 'prejoin.joinWithoutAudio'
                                    icon = { IconVolumeOff }
                                    label = { t('prejoin.joinWithoutAudio') }
                                    onButtonClick = { joinConferenceWithoutAudio }
                                    onKeyPressed = { _onJoinConferenceWithoutAudioKeyPress } />
                                {hasJoinByPhoneButton && <DropdownButton
                                    dataTestId = 'prejoin.joinByPhone'
                                    icon = { IconPhone }
                                    label = { t('prejoin.joinAudioByPhone') }
                                    onButtonClick = { _showDialog }
                                    onKeyPressed = { _showDialogKeyPress } />}
                            </div> }
                            isOpen = { showJoinByPhoneButtons }
                            onClose = { _onDropdownClose }>
                            <ActionButton
                                OptionsIcon = { showJoinByPhoneButtons ? IconArrowUp : IconArrowDown }
                                ariaDropDownLabel = { t('prejoin.joinWithoutAudio') }
                                ariaLabel = { t('prejoin.joinMeeting') }
                                ariaPressed = { showJoinByPhoneButtons }
                                hasOptions = { true }
                                onClick = { _onJoinButtonClick }
                                onKeyPress = { _onJoinKeyPress }
                                onOptionsClick = { _onOptionsClick }
                                role = 'button'
                                tabIndex = { 0 }
                                testId = 'prejoin.joinMeeting'
                                type = 'primary'>
                                { t('prejoin.joinMeeting') }
                            </ActionButton>
                        </InlineDialog>
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
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    const name = getDisplayName(state);
    const showErrorOnJoin = isDisplayNameRequired(state) && !name;

    return {
        name,
        deviceStatusVisible: isDeviceStatusVisible(state),
        roomName: getRoomName(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        readOnlyName: isPrejoinNameReadOnly(state),
        showCameraPreview: !isVideoMutedByUser(state),
        videoTrack: getLocalJitsiVideoTrack(state)
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(Prejoin));
