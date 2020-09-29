// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { getRoomName } from '../../base/conference';
import { translate } from '../../base/i18n';
import { Icon, IconArrowDown, IconArrowUp, IconPhone, IconVolumeOff } from '../../base/icons';
import { isVideoMutedByUser } from '../../base/media';
import { ActionButton, InputField, PreMeetingScreen, ToggleButton } from '../../base/premeeting';
import { connect } from '../../base/redux';
import { getDisplayName, updateSettings } from '../../base/settings';
import { getLocalJitsiVideoTrack } from '../../base/tracks';
import { isButtonEnabled } from '../../toolbox/functions.web';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setSkipPrejoin as setSkipPrejoinAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../actions';
import {
    isDeviceStatusVisible,
    isDisplayNameRequired,
    isJoinByPhoneButtonVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinSkipped
} from '../functions';

import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';
import DeviceStatus from './preview/DeviceStatus';

declare var interfaceConfig: Object;

type Props = {

    /**
     * Flag signaling if the 'skip prejoin' button is toggled or not.
     */
    buttonIsToggled: boolean,

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
     * Indicates whether the avatar should be shown when video is off
     */
    showAvatar: boolean,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * If should show an error when joining without a name.
     */
    showErrorOnJoin: boolean,

    /**
     * Flag signaling the visibility of join label, input and buttons
     */
    showJoinActions: boolean,

    /**
     * Flag signaling the visibility of the conference URL section.
     */
    showConferenceInfo: boolean,

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean,

    /**
     * Flag signaling the visibility of the skip prejoin toggle
     */
    showSkipPrejoin: boolean,

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
     * Default values for {@code Prejoin} component's properties.
     *
     * @static
     */
    static defaultProps = {
        showConferenceInfo: true,
        showJoinActions: true,
        showSkipPrejoin: true
    };

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
        this._onToggleButtonClick = this._onToggleButtonClick.bind(this);
        this._onDropdownClose = this._onDropdownClose.bind(this);
        this._onOptionsClick = this._onOptionsClick.bind(this);
        this._setName = this._setName.bind(this);
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

    _onToggleButtonClick: () => void;

    /**
     * Handler for the toggle button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onToggleButtonClick() {
        this.props.setSkipPrejoin(!this.props.buttonIsToggled);
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
            showAvatar,
            showCameraPreview,
            showDialog,
            showConferenceInfo,
            showJoinActions,
            t,
            videoTrack
        } = this.props;

        const { _closeDialog, _onDropdownClose, _onJoinButtonClick, _onOptionsClick, _setName, _showDialog } = this;
        const { showJoinByPhoneButtons, showError } = this.state;

        return (
            <PreMeetingScreen
                footer = { this._renderFooter() }
                name = { name }
                showAvatar = { showAvatar }
                showConferenceInfo = { showConferenceInfo }
                skipPrejoinButton = { this._renderSkipPrejoinButton() }
                title = { t('prejoin.joinMeeting') }
                videoMuted = { !showCameraPreview }
                videoTrack = { videoTrack }>
                {showJoinActions && (
                    <div className = 'prejoin-input-area-container'>
                        <div className = 'prejoin-input-area'>
                            <InputField
                                autoFocus = { true }
                                className = { showError ? 'error' : '' }
                                hasError = { showError }
                                onChange = { _setName }
                                onSubmit = { joinConference }
                                placeHolder = { t('dialog.enterDisplayName') }
                                value = { name } />

                            {showError && <div
                                className = 'prejoin-error'
                                data-testid = 'prejoin.errorMessage'>{t('prejoin.errorMissingName')}</div>}

                            <div className = 'prejoin-preview-dropdown-container'>
                                <InlineDialog
                                    content = { <div className = 'prejoin-preview-dropdown-btns'>
                                        <div
                                            className = 'prejoin-preview-dropdown-btn'
                                            data-testid = 'prejoin.joinWithoutAudio'
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
                                                data-testid = 'prejoin.joinByPhone'
                                                size = { 24 }
                                                src = { IconPhone } />
                                            { t('prejoin.joinAudioByPhone') }
                                        </div>}
                                    </div> }
                                    isOpen = { showJoinByPhoneButtons }
                                    onClose = { _onDropdownClose }>
                                    <ActionButton
                                        OptionsIcon = { showJoinByPhoneButtons ? IconArrowUp : IconArrowDown }
                                        hasOptions = { true }
                                        onClick = { _onJoinButtonClick }
                                        onOptionsClick = { _onOptionsClick }
                                        testId = 'prejoin.joinMeeting'
                                        type = 'primary'>
                                        { t('prejoin.joinMeeting') }
                                    </ActionButton>
                                </InlineDialog>
                            </div>
                        </div>
                    </div>
                )}
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

    /**
     * Renders the 'skip prejoin' button.
     *
     * @returns {React$Element}
     */
    _renderSkipPrejoinButton() {
        const { buttonIsToggled, t, showSkipPrejoin } = this.props;

        if (!showSkipPrejoin) {
            return null;
        }

        return (
            <div className = 'prejoin-checkbox-container'>
                <ToggleButton
                    isToggled = { buttonIsToggled }
                    onClick = { this._onToggleButtonClick }>
                    {t('prejoin.doNotShow')}
                </ToggleButton>
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state, ownProps): Object {
    const name = getDisplayName(state);
    const showErrorOnJoin = isDisplayNameRequired(state) && !name;
    const { showJoinActions } = ownProps;
    const isInviteButtonEnabled = isButtonEnabled('invite');

    // Hide conference info when interfaceConfig is available and the invite button is disabled.
    // In all other cases we want to preserve the behaviour and control the the conference info
    // visibility trough showJoinActions.
    const showConferenceInfo
        = typeof isInviteButtonEnabled === 'undefined' || isInviteButtonEnabled === true
            ? showJoinActions
            : false;

    return {
        buttonIsToggled: isPrejoinSkipped(state),
        name,
        deviceStatusVisible: isDeviceStatusVisible(state),
        roomName: getRoomName(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        showCameraPreview: !isVideoMutedByUser(state),
        showConferenceInfo,
        videoTrack: getLocalJitsiVideoTrack(state)
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
