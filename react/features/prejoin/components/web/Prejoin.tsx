/* eslint-disable react/jsx-no-bind */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { isNameReadOnly } from '../../../base/config/functions.web';
import { IconArrowDown, IconArrowUp, IconPhoneRinging, IconVolumeOff } from '../../../base/icons/svg';
import { isVideoMutedByUser } from '../../../base/media/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import ActionButton from '../../../base/premeeting/components/web/ActionButton';
import PreMeetingScreen from '../../../base/premeeting/components/web/PreMeetingScreen';
import { updateSettings } from '../../../base/settings/actions';
import { getDisplayName } from '../../../base/settings/functions.web';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getLocalJitsiVideoTrack } from '../../../base/tracks/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import isInsecureRoomName from '../../../base/util/isInsecureRoomName';
import { openDisplayNamePrompt } from '../../../display-name/actions';
import { isUnsafeRoomWarningEnabled } from '../../../prejoin/functions';
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
import logger from '../../logger';
import { hasDisplayName } from '../../utils';

import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';

interface IProps {

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean;

    /**
     * If join by phone button should be visible.
     */
    hasJoinByPhoneButton: boolean;

    /**
     * Flag signaling if the display name is visible or not.
     */
    isDisplayNameVisible: boolean;

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
     * If the recording warning is visible or not.
     */
    showRecordingWarning: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning: boolean;

    /**
     * Whether the user has approved to join a room with unsafe name.
     */
    unsafeRoomConsent?: boolean;

    /**
     * Updates settings.
     */
    updateSettings: Function;

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack?: Object;
}

// Hardcoded theme colors (ideally from a theme context or SCSS variables)
const themeColors = {
    backgroundColorDark: '#1A1E2D',
    backgroundColorLight: '#252A3A',
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    primaryColor: '#7B61FF',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    spacingSmall: '8px',
    spacingMedium: '16px',
    spacingLarge: '24px',
    spacingExtraLarge: '32px'
};

const useStyles = makeStyles()(theme => {
    return {
        // Main dashboard layout
        dashboardLayout: {
            display: 'flex',
            flexDirection: 'column',
            padding: themeColors.spacingLarge,
            width: '100%',
            maxWidth: '1200px', // Max width for the dashboard content
            margin: '0 auto'
        },

        // Profile section
        profileSection: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: themeColors.spacingExtraLarge,
            backgroundColor: themeColors.backgroundColorLight, // Card background
            padding: themeColors.spacingMedium,
            borderRadius: themeColors.borderRadius,
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)'
        },
        profileAvatar: {
            marginRight: themeColors.spacingMedium,
            // Avatar component itself handles size, using default for now
        },
        profileName: {
            ...withPixelLineHeight(theme.typography.h4), // Larger name
            color: themeColors.textColorPrimary,
            fontWeight: '600'
        },

        // Dashboard cards container
        dashboardCardsContainer: {
            display: 'flex',
            gap: themeColors.spacingLarge,
            // On smaller screens, stack them
            '@media (max-width: 768px)': {
                flexDirection: 'column'
            }
        },

        // Individual card style
        dashboardCard: {
            backgroundColor: themeColors.backgroundColorLight,
            borderRadius: themeColors.borderRadius,
            padding: themeColors.spacingLarge,
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
            flex: 1, // Make cards share space
            display: 'flex',
            flexDirection: 'column',
            minWidth: '300px' // Minimum width for a card
        },
        cardTitle: {
            ...withPixelLineHeight(theme.typography.h6),
            color: themeColors.textColorPrimary,
            marginBottom: themeColors.spacingMedium,
            fontWeight: '600'
        },

        // Specific styles for join meeting card content
        joinMeetingCardContent: {
            display: 'flex',
            flexDirection: 'column',
            gap: themeColors.spacingMedium
        },

        // Input field styling (for display name)
        displayNameInput: { // Applied to the Input component's container
            width: '100%',
            '& input': {
                backgroundColor: themeColors.backgroundColorDark, // Darker than card bg
                color: themeColors.textColorPrimary,
                border: `1px solid ${themeColors.borderColor}`,
                borderRadius: `calc(${themeColors.borderRadius} / 1.5)`, // Slightly less rounded
                padding: `${themeColors.spacingSmall} ${themeColors.spacingMedium}`,
                fontSize: '1rem',
                textAlign: 'left', // Default text align
                '&::placeholder': {
                    color: themeColors.textColorSecondary
                }
            }
        },
        inputError: { // For the error message below input
            color: theme.palette.error01, // Using existing theme error color
            fontSize: '0.8rem',
            marginTop: themeColors.spacingSmall
        },

        // ActionButton styling (for Join Meeting button)
        joinButton: { // Applied to ActionButton component
            // These styles will be applied to the root element of ActionButton if it accepts a className prop
            // For more specific styling, internal elements of ActionButton would need to be targeted,
            // or ActionButton itself would need to be modified/replaced.
            width: '100%', // Make button full width of its container in the card
            padding: `${themeColors.spacingMedium} ${themeColors.spacingLarge}`, // Larger padding
            fontSize: '1.1rem', // Larger font size
            borderRadius: `calc(${themeColors.borderRadius} / 1.5)`, // Consistent rounding
            // The ActionButton's 'primary' type should ideally use $primaryColor from the theme.
            // If not, these would be needed:
            // backgroundColor: themeColors.primaryColor,
            // color: themeColors.textColorPrimary,
            // '&:hover': {
            //    backgroundColor: darken(themeColors.primaryColor, 10%),
            // },
            textTransform: 'none' // Ensure text isn't all caps if default is so
        },

        // Fallback for existing styles to avoid breaking things not touched yet
        inputContainer: { // Original class, might not be needed if fully restructured
            width: '100%'
        },
        error: { // Original error style
            backgroundColor: theme.palette.actionDanger,
            color: theme.palette.text01,
            borderRadius: theme.shape.borderRadius,
            width: '100%',
            ...withPixelLineHeight(theme.typography.labelRegular),
            boxSizing: 'border-box',
            padding: theme.spacing(1), // Keep for now
            textAlign: 'center',
            marginTop: `-${theme.spacing(2)}`, // Keep for now
            marginBottom: theme.spacing(3) // Keep for now
        },
        dropdownContainer: { // For join options - may remove or simplify
            position: 'relative',
            width: '100%'
        },

        dropdownButtons: {
            width: '300px',
            padding: '8px 0',
            backgroundColor: theme.palette.action02,
            color: theme.palette.text04,
            borderRadius: theme.shape.borderRadius,
            position: 'relative',
            top: `-${theme.spacing(3)}`,

            '@media (max-width: 511px)': {
                margin: '0 auto',
                top: 0
            },

            '@media (max-width: 420px)': {
                top: 0,
                width: 'calc(100% - 32px)'
            }
        }
    };
});

const Prejoin = ({
    deviceStatusVisible,
    hasJoinByPhoneButton,
    isDisplayNameVisible,
    joinConference,
    joinConferenceWithoutAudio,
    joiningInProgress,
    name,
    participantId,
    prejoinConfig,
    readOnlyName,
    setJoinByPhoneDialogVisiblity,
    showCameraPreview,
    showDialog,
    showErrorOnJoin,
    showRecordingWarning,
    showUnsafeRoomWarning,
    unsafeRoomConsent,
    updateSettings: dispatchUpdateSettings,
    videoTrack
}: IProps) => {
    const showDisplayNameField = useMemo(
        () => isDisplayNameVisible && !readOnlyName,
        [ isDisplayNameVisible, readOnlyName ]);
    const showErrorOnField = useMemo(
        () => showDisplayNameField && showErrorOnJoin,
        [ showDisplayNameField, showErrorOnJoin ]);
    const [ showJoinByPhoneButtons, setShowJoinByPhoneButtons ] = useState(false);
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    /**
     * Handler for the join button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onJoinButtonClick = () => {
        if (showErrorOnJoin) {
            dispatch(openDisplayNamePrompt({
                onPostSubmit: joinConference,
                validateInput: hasDisplayName
            }));

            return;
        }

        logger.info('Prejoin join button clicked.');

        joinConference();
    };

    /**
     * Closes the dropdown.
     *
     * @returns {void}
     */
    const onDropdownClose = () => {
        setShowJoinByPhoneButtons(false);
    };

    /**
     * Displays the join by phone buttons dropdown.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onOptionsClick = (e?: React.KeyboardEvent | React.MouseEvent | undefined) => {
        e?.stopPropagation();

        setShowJoinByPhoneButtons(show => !show);
    };

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    const setName = (displayName: string) => {
        dispatchUpdateSettings({
            displayName
        });
    };

    /**
     * Closes the join by phone dialog.
     *
     * @returns {undefined}
     */
    const closeDialog = () => {
        setJoinByPhoneDialogVisiblity(false);
    };

    /**
     * Displays the dialog for joining a meeting by phone.
     *
     * @returns {undefined}
     */
    const doShowDialog = () => {
        setJoinByPhoneDialogVisiblity(true);
        onDropdownClose();
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const showDialogKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            doShowDialog();
        }
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const onJoinConferenceWithoutAudioKeyPress = (e: React.KeyboardEvent) => {
        if (joinConferenceWithoutAudio
            && (e.key === ' '
                || e.key === 'Enter')) {
            e.preventDefault();
            logger.info('Prejoin joinConferenceWithoutAudio dispatched on a key pressed.');
            joinConferenceWithoutAudio();
        }
    };

    /**
     * Gets the list of extra join buttons.
     *
     * @returns {Object} - The list of extra buttons.
     */
    const getExtraJoinButtons = () => {
        const noAudio = {
            key: 'no-audio',
            testId: 'prejoin.joinWithoutAudio',
            icon: IconVolumeOff,
            label: t('prejoin.joinWithoutAudio'),
            onClick: () => {
                logger.info('Prejoin join conference without audio pressed.');
                joinConferenceWithoutAudio();
            },
            onKeyPress: onJoinConferenceWithoutAudioKeyPress
        };

        const byPhone = {
            key: 'by-phone',
            testId: 'prejoin.joinByPhone',
            icon: IconPhoneRinging,
            label: t('prejoin.joinAudioByPhone'),
            onClick: doShowDialog,
            onKeyPress: showDialogKeyPress
        };

        return {
            noAudio,
            byPhone
        };
    };

    /**
     * Handle keypress on input.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     * @returns {void}
     */
    const onInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            logger.info('Dispatching join conference on Enter key press from the prejoin screen.');
            joinConference();
        }
    };

    const extraJoinButtons = getExtraJoinButtons();
    let extraButtonsToRender = Object.values(extraJoinButtons).filter((val: any) =>
        !(prejoinConfig?.hideExtraJoinButtons || []).includes(val.key)
    );

    if (!hasJoinByPhoneButton) {
        extraButtonsToRender = extraButtonsToRender.filter((btn: any) => btn.key !== 'by-phone');
    }
    const hasExtraJoinButtons = Boolean(extraButtonsToRender.length);

    return (
        <PreMeetingScreen
            showDeviceStatus = { deviceStatusVisible }
            showRecordingWarning = { showRecordingWarning }
            showUnsafeRoomWarning = { showUnsafeRoomWarning }
            title = { t('prejoin.joinMeeting') } // Title for PreMeetingScreen, may not be visible with new layout
            videoMuted = { !showCameraPreview }
            videoTrack = { videoTrack }>

            {/* New Dashboard Layout */}
            <div className = { classes.dashboardLayout } data-testid = 'prejoin.dashboard'>

                {/* Profile Section */}
                {isDisplayNameVisible && (
                    <div className = { classes.profileSection }>
                        <Avatar
                            className = { classes.profileAvatar }
                            displayName = { name }
                            participantId = { participantId }
                            size = { 60 } /> {/* Slightly larger avatar */}
                        <div className = { classes.profileName }>{name || t('prejoin.anonymousUser')}</div>
                    </div>
                )}

                {/* Dashboard Cards Container */}
                <div className = { classes.dashboardCardsContainer }>
                    {/* Join Meeting Card */}
                    <div className = { classes.dashboardCard }>
                        <div className = { classes.cardTitle }>{t('prejoin.joinMeetingCardTitle', 'Join or Start a Meeting')}</div>
                        <div className = { classes.joinMeetingCardContent }>
                            {showDisplayNameField && (
                                <Input
                                    accessibilityLabel = { t('dialog.enterDisplayName') }
                                    autoComplete = { 'name' }
                                    autoFocus = { true }
                                    className = { classes.displayNameInput } // New style
                                    error = { showErrorOnField }
                                    id = 'premeeting-name-input'
                                    onChange = { setName }
                                    onKeyPress = { showUnsafeRoomWarning && !unsafeRoomConsent ? undefined : onInputKeyPress }
                                    placeholder = { t('dialog.enterDisplayName') }
                                    readOnly = { readOnlyName }
                                    value = { name } />
                            )}
                            {showErrorOnField && (
                                <div className = { classes.inputError } data-testid = 'prejoin.errorMessage'>
                                    {t('prejoin.errorMissingName')}
                                </div>
                            )}
                            <ActionButton
                                className = { classes.joinButton } // For potential specific overrides if ActionButton styling is tricky
                                disabled = { joiningInProgress
                                    || (showUnsafeRoomWarning && !unsafeRoomConsent)
                                    || showErrorOnField }
                                onClick = { onJoinButtonClick }
                                testId = 'prejoin.joinMeeting'
                                type = 'primary'>
                                {t('prejoin.joinMeeting')}
                            </ActionButton>
                            {/* Simplified Join Options - TODO: Revisit for better UI for these options */}
                            {hasExtraJoinButtons && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                {extraButtonsToRender.map(({ key, label, icon: BtnIcon, onClick: btnOnClick, onKeyPress: btnOnKeyPress }) => (
                                    <Button
                                        accessibilityLabel={label}
                                        disabled = { joiningInProgress || showErrorOnField }
                                        fullWidth = { true }
                                        icon={BtnIcon}
                                        key = { key }
                                        label={label}
                                        onClick={btnOnClick}
                                        onKeyPress={btnOnKeyPress}
                                        type = { BUTTON_TYPES.TERTIARY } /> // Use tertiary for less emphasis
                                ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scheduled Meetings Card (Placeholder) */}
                    <div className = { classes.dashboardCard }>
                        <div className = { classes.cardTitle }>{t('prejoin.scheduledMeetingsCardTitle', 'Upcoming Meetings')}</div>
                        <div>{t('prejoin.scheduledMeetingsPlaceholder', 'Your scheduled meetings will appear here.')}</div>
                        {/* Placeholder items */}
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: themeColors.spacingMedium }}>
                            <li style={{ padding: `${themeColors.spacingSmall} 0`, borderBottom: `1px solid ${themeColors.borderColor}` }}>
                                {t('prejoin.placeholderMeeting1', 'Team Sync - 10:00 AM')}
                            </li>
                            <li style={{ padding: `${themeColors.spacingSmall} 0`, borderBottom: `1px solid ${themeColors.borderColor}` }}>
                                {t('prejoin.placeholderMeeting2', 'Project Review - 2:00 PM')}
                            </li>
                            <li style={{ padding: `${themeColors.spacingSmall} 0`}}>
                                {t('prejoin.placeholderMeeting3', 'Client Call - 4:30 PM')}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* TODO: Integrate Device Status/Preview section here if it's not part of PreMeetingScreen controls */}
                {/* For now, assuming PreMeetingScreen handles the preview and its controls are styled elsewhere or accept global styles */}

            </div>

            {showDialog && ( /* This is for JoinByPhoneDialog, keep it at the Prejoin root level */
                <JoinByPhoneDialog
                    joinConferenceWithoutAudio = { joinConferenceWithoutAudio }
                    onClose = { closeDialog } />
            )}
        </PreMeetingScreen>
    );
};


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
    const { room } = state['features/base/conference'];
    const { unsafeRoomConsent } = state['features/base/premeeting'];
    const { showPrejoinWarning: showRecordingWarning } = state['features/base/config'].recordings ?? {};

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        isDisplayNameVisible: isPrejoinDisplayNameVisible(state),
        joiningInProgress,
        name,
        participantId,
        prejoinConfig: state['features/base/config'].prejoinConfig,
        readOnlyName: isNameReadOnly(state),
        showCameraPreview: !isVideoMutedByUser(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
        showRecordingWarning: Boolean(showRecordingWarning),
        showUnsafeRoomWarning: isInsecureRoomName(room) && isUnsafeRoomWarningEnabled(state),
        unsafeRoomConsent,
        videoTrack: getLocalJitsiVideoTrack(state)
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Prejoin);
