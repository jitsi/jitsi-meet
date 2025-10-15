import { IReduxState } from '../app/types';
import { hasAvailableDevices } from '../base/devices/functions.web';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import { isLocalParticipantHost, isParticipantModerator, isRemoteParticipantHost } from '../base/participants/functions';
import { isScreenMediaShared } from '../screen-share/functions';
import { isWhiteboardVisible } from '../whiteboard/functions';

import { MAIN_TOOLBAR_BUTTONS_PRIORITY, TOOLBAR_TIMEOUT } from './constants';
import { isButtonEnabled } from './functions.any';
import { IGetVisibleButtonsParams, IToolboxButton, NOTIFY_CLICK_MODE } from './types';

export * from './functions.any';

/**
 * Helper for getting the height of the toolbox.
 *
 * @returns {number} The height of the toolbox.
 */
export function getToolboxHeight() {
    const toolbox = document.getElementById('new-toolbox');

    return toolbox?.clientHeight || 0;
}

/**
 * Indicates if the toolbox is visible or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean} - True to indicate that the toolbox is visible, false -
 * otherwise.
 */
export function isToolboxVisible(state: IReduxState) {
    const { iAmRecorder, iAmSipGateway, toolbarConfig } = state['features/base/config'];
    const { alwaysVisible } = toolbarConfig || {};
    const {
        timeoutID,
        visible
    } = state['features/toolbox'];
    const { audioSettingsVisible, videoSettingsVisible } = state['features/settings'];
    const whiteboardVisible = isWhiteboardVisible(state);

    return Boolean(!iAmRecorder && !iAmSipGateway
            && (
                timeoutID
                || visible
                || alwaysVisible
                || audioSettingsVisible
                || videoSettingsVisible
                || whiteboardVisible
            ));
}

/**
 * Indicates if the audio settings button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioSettingsButtonDisabled(state: IReduxState) {

    return !(hasAvailableDevices(state, 'audioInput')
        || hasAvailableDevices(state, 'audioOutput'))
        || state['features/base/config'].startSilent;
}

/**
 * Indicates if the desktop share button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isDesktopShareButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked } = state['features/base/media'].video;
    const videoOrShareInProgress = !muted || isScreenMediaShared(state);
    const enabledInJwt = isJwtFeatureEnabled(state, MEET_FEATURES.SCREEN_SHARING, true);

    return !enabledInJwt || (unmuteBlocked && !videoOrShareInProgress);
}

/**
 * Indicates if the video settings button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoSettingsButtonDisabled(state: IReduxState) {
    return !hasAvailableDevices(state, 'videoInput');
}

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked, gumPending } = state['features/base/media'].video;

    return !hasAvailableDevices(state, 'videoInput')
        || (unmuteBlocked && Boolean(muted))
        || gumPending !== IGUMPendingState.NONE;
}

/**
 * If an overflow drawer should be displayed or not.
 * This is usually done for mobile devices or on narrow screens.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function showOverflowDrawer(state: IReduxState) {
    return state['features/toolbox'].overflowDrawer;
}

/**
 * Returns the toolbar timeout from config or the default value.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {number} - Toolbar timeout in milliseconds.
 */
export function getToolbarTimeout(state: IReduxState) {
    const { toolbarConfig } = state['features/base/config'];

    return toolbarConfig?.timeout || TOOLBAR_TIMEOUT;
}

/**
 * Sets the notify click mode for the buttons.
 *
 * @param {Object} buttons - The list of toolbar buttons.
 * @param {Map} buttonsWithNotifyClick - The buttons notify click configuration.
 * @returns {void}
 */
function setButtonsNotifyClickMode(buttons: Object, buttonsWithNotifyClick: Map<string, NOTIFY_CLICK_MODE>) {
    if (typeof APP === 'undefined' || (buttonsWithNotifyClick?.size ?? 0) <= 0) {
        return;
    }

    Object.values(buttons).forEach((button: any) => {
        if (typeof button === 'object') {
            button.notifyMode = buttonsWithNotifyClick.get(button.key);
        }
    });
}

/**
 * Returns all buttons that need to be rendered.
 *
 * @param {IGetVisibleButtonsParams} params - The parameters needed to extract the visible buttons.
 * @returns {Object} - The visible buttons arrays .
 */
export function getVisibleButtons({
    allButtons,
    buttonsWithNotifyClick,
    toolbarButtons,
    clientWidth,
    jwtDisabledButtons,
    mainToolbarButtonsThresholds
}: IGetVisibleButtonsParams) {
    setButtonsNotifyClickMode(allButtons, buttonsWithNotifyClick);

    const filteredButtons = Object.keys(allButtons).filter(key =>
        typeof key !== 'undefined' // filter invalid buttons that may be coming from config.mainToolbarButtons
        // override
        && !jwtDisabledButtons.includes(key)
        && isButtonEnabled(key, toolbarButtons));


    const { order } = mainToolbarButtonsThresholds.find(({ width }) => clientWidth > width)
        || mainToolbarButtonsThresholds[mainToolbarButtonsThresholds.length - 1];

    const mainToolbarButtonKeysOrder = [
        ...order.filter(key => filteredButtons.includes(key)),
        ...MAIN_TOOLBAR_BUTTONS_PRIORITY.filter(key => !order.includes(key) && filteredButtons.includes(key)),
        ...filteredButtons.filter(key => !order.includes(key) && !MAIN_TOOLBAR_BUTTONS_PRIORITY.includes(key))
    ];

    const mainButtonsKeys = mainToolbarButtonKeysOrder.slice(0, order.length);
    const overflowMenuButtons = filteredButtons.reduce((acc, key) => {
        if (!mainButtonsKeys.includes(key)) {
            acc.push(allButtons[key]);
        }

        return acc;
    }, [] as IToolboxButton[]);

    // if we have 1 button in the overflow menu it is better to directly display it in the main toolbar by replacing
    // the "More" menu button with it.
    if (overflowMenuButtons.length === 1) {
        const button = overflowMenuButtons.shift()?.key;

        button && mainButtonsKeys.push(button);
    }

    const mainMenuButtons = mainButtonsKeys.map(key => allButtons[key]);

    return {
        mainMenuButtons,
        overflowMenuButtons
    };
}

/**
 * Returns the list of participant menu buttons that have that notify the api when clicked.
 *
 * @param {Object} state - The redux state.
 * @returns {Map<string, NOTIFY_CLICK_MODE>} - The list of participant menu buttons.
 */
export function getParticipantMenuButtonsWithNotifyClick(state: IReduxState): Map<string, NOTIFY_CLICK_MODE> {
    return state['features/toolbox'].participantMenuButtonsWithNotifyClick;
}

interface ICSSTransitionObject {
    delay: number;
    duration: number;
    easingFunction: string;
}

/**
 * Returns the time, timing function and delay for elements that are position above the toolbar and need to move along
 * with the toolbar.
 *
 * @param {boolean} isToolbarVisible - Whether the toolbar is visible or not.
 * @returns {ICSSTransitionObject}
 */
export function getTransitionParamsForElementsAboveToolbox(isToolbarVisible: boolean): ICSSTransitionObject {
    // The transition time and delay is different to account for the time when the toolbar is about to hide/show but
    // the elements don't have to move.
    return isToolbarVisible ? {
        duration: 0.15,
        easingFunction: 'ease-in',
        delay: 0.15
    } : {
        duration: 0.24,
        easingFunction: 'ease-in',
        delay: 0
    };
}

/**
 * Converts a given object to a css transition value string.
 *
 * @param {ICSSTransitionObject} object - The object.
 * @returns {string}
 */
export function toCSSTransitionValue(object: ICSSTransitionObject) {
    const { delay, duration, easingFunction } = object;

    return `${duration}s ${easingFunction} ${delay}s`;
}

/**
 * Gathers and formats meeting data into a string with role-based attendance.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {string} - The formatted meeting data.
 */
export function getMeetingDataAsString(state: IReduxState): string {
    const {
        'features/base/conference': { room, conference, conferenceTimestamp },
        'features/chat': { messages },
        'features/polls': { polls }
    } = state;

    // Part 1: Get complete participant data
    const speakerStats = conference?.getSpeakerStats();
    const participantNameMap = new Map<string, string>();
    const localParticipant = state['features/base/participants'].local;

    // Build a map of clean names for use in Chat and Polls sections
    if (speakerStats && localParticipant) {
        for (const userId in speakerStats) {
            const statsModel = speakerStats[userId];
            const cleanName = statsModel.isLocalStats()
                ? localParticipant.name
                : statsModel.getDisplayName() || state['features/base/participants'].remote.get(userId)?.name;

            if (cleanName) {
                participantNameMap.set(userId, cleanName);
            }
        }
    }


    // Part 2: Format Timestamps, Duration, and Header
    const downloadTime = Date.now();
    const meetingStartTime = Number(conferenceTimestamp) || downloadTime;
    const durationMs = downloadTime - meetingStartTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    let durationString: string;

    if (durationMinutes < 1) {
        durationString = 'Less than a minute';
    } else if (durationMinutes === 1) {
        durationString = '1 minute';
    } else {
        durationString = `${durationMinutes} minutes`;
    }

    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetSign = offsetMinutes > 0 ? '-' : '+';
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const paddedMins = String(offsetMins).padStart(2, '0');
    const timeZone = `GMT${offsetSign}${offsetHours}:${paddedMins}`;

    let dataString = `Room Name: ${room}\n`;

    dataString += `Timezone: ${timeZone}\n\n`;
    dataString += `Start Time: ${new Date(meetingStartTime).toLocaleString()}\n`;
    dataString += `End Time (at download): ${new Date(downloadTime).toLocaleString()}\n`;
    dataString += `Duration: ${durationString}\n\n`;


    // --- Part 3: Format Complete Attendance List with (H) and (M) roles (CORRECTED) ---
    dataString += '--- Attendance ---\n';

    // This map will store the FINAL status of each participant, preventing duplicates.
    const finalAttendance = new Map<string, { displayName: string; role: string; status: string; }>();

    if (speakerStats && Object.keys(speakerStats).length > 0) {
        // Step 1: Process speakerStats to determine the final state of each user.
        for (const userId in speakerStats) {
            const statsModel = speakerStats[userId];
            const displayName = participantNameMap.get(userId) || 'Unknown User';
            const isPresent = !statsModel.hasLeft();
            const existingEntry = finalAttendance.get(userId);

            // We only update or add an entry if:
            // 1. The user is currently present (this status overrides any previous 'left' status).
            // 2. There is no existing entry for this user yet.
            if (isPresent || !existingEntry) {
                let roleString = '';

                if (statsModel.isLocalStats()) {
                    if (localParticipant) {
                        if (isLocalParticipantHost(state)) {
                            roleString = '(H)';
                        } else if (isParticipantModerator(localParticipant)) {
                            roleString = '(M)';
                        }
                    }
                } else {
                    const remoteParticipant = state['features/base/participants'].remote.get(userId);

                    if (remoteParticipant) {
                        if (isRemoteParticipantHost(remoteParticipant)) {
                            roleString = '(H)';
                        } else if (isParticipantModerator(remoteParticipant)) {
                            roleString = '(M)';
                        }
                    }
                }

                finalAttendance.set(userId, {
                    displayName,
                    role: roleString,
                    status: isPresent ? '' : ''
                });
            }
        }

        // Step 2: Build the string from the de-duplicated final attendance list.
        if (finalAttendance.size > 0) {
            finalAttendance.forEach(p => {
                const line = `${p.displayName} ${p.role}${p.status}`.replace('  ', ' ').trimEnd();

                dataString += `${line}\n`;
            });
        } else {
            dataString += 'No attendance data was available.\n';
        }

    } else {
        dataString += 'No attendance data was available.\n';
    }
    dataString += '\n';


    // Part 4: Format Chat History
    dataString += '--- Chat History ---\n';

    const containsNonSystemMessages = messages.every(msg => !msg.messageId);

    if (messages.length > 0 && !containsNonSystemMessages) {
        messages.forEach(msg => {
            if (msg.isReaction || msg.privateMessage || msg.messageType === 'system') return;
            const chatDisplayName = participantNameMap.get((msg as any).participantId) || 'Unknown User';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString();

            dataString += `[${timestamp}] ${chatDisplayName}: ${msg.message}\n`;
        });
    } else {
        dataString += 'No chat messages were sent.\n';
    }
    dataString += '\n';


    // Part 5: Format Poll Results
    dataString += '--- Polls ---\n';
    if (Object.keys(polls ?? {}).length > 0) {
        Object.values(polls ?? {}).forEach((poll, index) => {
            dataString += `Poll ${index + 1}: ${poll.question}\n`;
            (poll.answers || []).forEach(answer => {
                const voteCount = answer.voters.length;
                const voterNames = answer.voters
                    .map(voterId => participantNameMap.get(voterId) || 'Unknown User')
                    .join(', ');

                dataString += `  - ${answer.name} (${voteCount} votes): [${voterNames}]\n`;
            });
            dataString += '\n';
        });
    } else {
        dataString += 'No polls were conducted.\n\n';
    }

    return dataString;
}

/**
 * Gathers meeting data, formats it, and triggers a download of the resulting text file.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {void}
 */
export function downloadMeetingData(state: IReduxState): void {
    // Part 1: Get the formatted content string
    const dataString = getMeetingDataAsString(state);

    // Part 2: Generate the dynamic filename
    const roomName = state['features/base/conference']?.room;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const filename = `${roomName || 'meeting'}_${dateString}.txt`;

    // Part 3: Trigger the file download
    const element = document.createElement('a');
    const file = new Blob([ dataString ]);

    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
