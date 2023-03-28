import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { isNameReadOnly } from '../../../base/config/functions.web';
import { translate } from '../../../base/i18n/functions';
import { IconArrowDown, IconArrowUp, IconPhoneRinging, IconVolumeOff } from '../../../base/icons/svg';
import { isVideoMutedByUser } from '../../../base/media/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import ActionButton from '../../../base/premeeting/components/web/ActionButton';
import PreMeetingScreen from '../../../base/premeeting/components/web/PreMeetingScreen';
import { updateSettings } from '../../../base/settings/actions';
import { getDisplayName } from '../../../base/settings/functions.web';
import { getLocalJitsiVideoTrack } from '../../../base/tracks/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../../actions.web';
import {
    isDeviceStatusVisible,
    isDisplayNameRequired,
    isJoinByPhoneButtonVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinDisplayNameVisible
} from '../../functions';

// @ts-ignore
import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';

interface IProps extends WithTranslation {

    /**
     * Indicates whether the display  name is editable.
     */
    canEditDisplayName: boolean;

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean;

    /**
     * If join by phone button should be visible.
     */
    hasJoinByPhoneButton: boolean;

    /**
     * Joins the current meeting.
     */
    joinConference: Function;

    /**
     * Joins the current meeting without audio.
     */
    joinConferenceWithoutAudio: Function;

    /**
     * Whether conference join is in progress.
     */
    joiningInProgress?: boolean;

    /**
     * The name of the user that is about to join.
     */
    name: string;

    /**
     * Local participant id.
     */
    participantId?: string;

    /**
     * The prejoin config.
     */
    prejoinConfig?: any;

    /**
     * Whether the name input should be read only or not.
     */
    readOnlyName: boolean;

    /**
     * Sets visibility of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function;

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean;

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean;

    /**
     * If should show an error when joining without a name.
     */
    showErrorOnJoin: boolean;

    /**
     * Updates settings.
     */
    updateSettings: Function;

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack?: Object;
}

interface IState {

    /**
     * Flag controlling the visibility of the 'join by phone' buttons.
     */
    showJoinByPhoneButtons: boolean;
}

/**
 * This component is displayed before joining a meeting.
 */
class Prejoin extends Component<IProps, IState> {
    showDisplayNameField: boolean;

    /**
     * Initializes a new {@code Prejoin} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
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
        this._getExtraJoinButtons = this._getExtraJoinButtons.bind(this);
        this._onInputKeyPress = this._onInputKeyPress.bind(this);

        this.showDisplayNameField = props.canEditDisplayName || props.showErrorOnJoin;
    }

    /**
     * Handler for the join button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onJoinButtonClick() {
        if (this.props.showErrorOnJoin) {
            return;
        }
        this.props.joinConference();
    }

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

    /**
     * Displays the join by phone buttons dropdown.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onOptionsClick(e?: React.KeyboardEvent | React.MouseEvent | undefined) {
        e?.stopPropagation();

        this.setState({
            showJoinByPhoneButtons: !this.state.showJoinByPhoneButtons
        });
    }

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    _setName(displayName: string) {
        this.props.updateSettings({
            displayName
        });
    }

    /**
     * Closes the join by phone dialog.
     *
     * @returns {undefined}
     */
    _closeDialog() {
        this.props.setJoinByPhoneDialogVisiblity(false);
    }

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
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _showDialogKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._showDialog();
        }
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onJoinConferenceWithoutAudioKeyPress(e: React.KeyboardEvent) {
        if (this.props.joinConferenceWithoutAudio
            && (e.key === ' '
                || e.key === 'Enter')) {
            e.preventDefault();
            this.props.joinConferenceWithoutAudio();
        }
    }

    /**
     * Gets the list of extra join buttons.
     *
     * @returns {Object} - The list of extra buttons.
     */
    _getExtraJoinButtons() {
        const { joinConferenceWithoutAudio, t } = this.props;

        const noAudio = {
            key: 'no-audio',
            testId: 'prejoin.joinWithoutAudio',
            icon: IconVolumeOff,
            label: t('prejoin.joinWithoutAudio'),
            onClick: joinConferenceWithoutAudio,
            onKeyPress: this._onJoinConferenceWithoutAudioKeyPress
        };

        const byPhone = {
            key: 'by-phone',
            testId: 'prejoin.joinByPhone',
            icon: IconPhoneRinging,
            label: t('prejoin.joinAudioByPhone'),
            onClick: this._showDialog,
            onKeyPress: this._showDialogKeyPress
        };

        return {
            noAudio,
            byPhone
        };
    }

    /**
     * Handle keypress on input.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     * @returns {void}
     */
    _onInputKeyPress(e: React.KeyboardEvent) {
        const { joinConference } = this.props;

        if (e.key === 'Enter') {
            joinConference();
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
            joinConferenceWithoutAudio,
            joiningInProgress,
            name,
            participantId,
            prejoinConfig,
            readOnlyName,
            showCameraPreview,
            showDialog,
            showErrorOnJoin,
            t,
            videoTrack
        } = this.props;
        const { _closeDialog, _onDropdownClose, _onJoinButtonClick,
            _onOptionsClick, _setName, _onInputKeyPress } = this;

        const extraJoinButtons = this._getExtraJoinButtons();
        let extraButtonsToRender = Object.values(extraJoinButtons).filter((val: any) =>
            !(prejoinConfig?.hideExtraJoinButtons || []).includes(val.key)
        );

        if (!hasJoinByPhoneButton) {
            extraButtonsToRender = extraButtonsToRender.filter((btn: any) => btn.key !== 'by-phone');
        }
        const hasExtraJoinButtons = Boolean(extraButtonsToRender.length);
        const { showJoinByPhoneButtons } = this.state;

        return (
            <PreMeetingScreen
                showDeviceStatus = { deviceStatusVisible }
                title = { t('prejoin.joinMeeting') }
                videoMuted = { !showCameraPreview }
                videoTrack = { videoTrack }>
                <div
                    className = 'prejoin-input-area'
                    data-testid = 'prejoin.screen'>
                    {this.showDisplayNameField ? (<Input
                        autoComplete = { 'name' }
                        autoFocus = { true }
                        className = 'prejoin-input'
                        error = { showErrorOnJoin }
                        onChange = { _setName }
                        onKeyPress = { _onInputKeyPress }
                        placeholder = { t('dialog.enterDisplayName') }
                        readOnly = { readOnlyName }
                        value = { name } />
                    ) : (
                        <div className = 'prejoin-avatar-container'>
                            <Avatar
                                className = 'prejoin-avatar'
                                displayName = { name }
                                participantId = { participantId }
                                size = { 72 } />
                            <div className = 'prejoin-avatar-name'>{name}</div>
                        </div>
                    )}

                    {showErrorOnJoin && <div
                        className = 'prejoin-error'
                        data-testid = 'prejoin.errorMessage'>{t('prejoin.errorMissingName')}</div>}

                    <div className = 'prejoin-preview-dropdown-container'>
                        <Popover
                            content = { hasExtraJoinButtons && <div className = 'prejoin-preview-dropdown-btns'>
                                {extraButtonsToRender.map(({ key, ...rest }) => (
                                    <Button
                                        disabled = { joiningInProgress }
                                        fullWidth = { true }
                                        key = { key }
                                        type = { BUTTON_TYPES.SECONDARY }
                                        { ...rest } />
                                ))}
                            </div> }
                            onPopoverClose = { _onDropdownClose }
                            position = 'bottom'
                            trigger = 'click'
                            visible = { showJoinByPhoneButtons }>
                            <ActionButton
                                OptionsIcon = { showJoinByPhoneButtons ? IconArrowUp : IconArrowDown }
                                ariaDropDownLabel = { t('prejoin.joinWithoutAudio') }
                                ariaLabel = { t('prejoin.joinMeeting') }
                                ariaPressed = { showJoinByPhoneButtons }
                                disabled = { joiningInProgress }
                                hasOptions = { hasExtraJoinButtons }
                                onClick = { _onJoinButtonClick }
                                onOptionsClick = { _onOptionsClick }
                                role = 'button'
                                tabIndex = { 0 }
                                testId = 'prejoin.joinMeeting'
                                type = 'primary'>
                                { t('prejoin.joinMeeting') }
                            </ActionButton>
                        </Popover>
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
function mapStateToProps(state: IReduxState) {
    const name = getDisplayName(state);
    const showErrorOnJoin = isDisplayNameRequired(state) && !name;
    const { id: participantId } = getLocalParticipant(state) ?? {};
    const { joiningInProgress } = state['features/prejoin'];

    return {
        canEditDisplayName: isPrejoinDisplayNameVisible(state),
        deviceStatusVisible: isDeviceStatusVisible(state),
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        joiningInProgress,
        name,
        participantId,
        prejoinConfig: state['features/base/config'].prejoinConfig,
        readOnlyName: isNameReadOnly(state),
        showCameraPreview: !isVideoMutedByUser(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
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
