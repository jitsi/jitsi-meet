import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { isJwtFeatureEnabledStateless } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import { IParticipantFeatures } from '../base/participants/types';
import { toState } from '../base/redux/functions';
import { iAmVisitor } from '../visitors/functions';

import { VISITORS_MODE_BUTTONS } from './constants';

/**
 * Indicates if the audio mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioMuteButtonDisabled(state: IReduxState) {
    const { available, muted, unmuteBlocked, gumPending } = state['features/base/media'].audio;
    const { startSilent } = state['features/base/config'];

    return Boolean(!available || startSilent || (muted && unmuteBlocked) || gumPending !== IGUMPendingState.NONE
        || iAmVisitor(state));
}

/**
 * Returns the buttons corresponding to features disabled through jwt.
 * This function is stateless as it returns a new array and may cause re-rendering.
 *
 * @param {boolean} isTranscribing - Whether there is currently a transcriber in the meeting.
 * @param {ILocalParticipant} localParticipantFeatures - The features of the local participant.
 * @returns {string[]} - The disabled by jwt buttons array.
 */
export function getJwtDisabledButtons(
        isTranscribing: boolean,
        localParticipantFeatures?: IParticipantFeatures) {
    const acc = [];

    if (!isJwtFeatureEnabledStateless({
        localParticipantFeatures,
        feature: 'livestreaming',
        ifNotInFeatures: false
    })) {
        acc.push('livestreaming');
    }

    if (!isTranscribing && !isJwtFeatureEnabledStateless({
        localParticipantFeatures,
        feature: 'transcription',
        ifNotInFeatures: false
    })) {
        acc.push('closedcaptions');
    }

    return acc;
}

/**
 * Returns the list of enabled toolbar buttons.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @param {string[]} definedToolbarButtons - The list of all possible buttons.
 *
 * @returns {Array<string>} - The list of enabled toolbar buttons.
 */
export function getToolbarButtons(stateful: IStateful, definedToolbarButtons: string[]): Array<string> {
    const state = toState(stateful);
    const { toolbarButtons, customToolbarButtons } = state['features/base/config'];
    const customButtons = customToolbarButtons?.map(({ id }) => id);
    let buttons = Array.isArray(toolbarButtons) ? toolbarButtons : definedToolbarButtons;

    if (iAmVisitor(state)) {
        buttons = VISITORS_MODE_BUTTONS.filter(button => buttons.indexOf(button) > -1);
    }

    if (customButtons) {
        return [ ...buttons, ...customButtons ];
    }

    return buttons;
}

/**
 * Checks if the specified button is enabled.
 *
 * @param {string} buttonName - The name of the button. See {@link interfaceConfig}.
 * @param {Object|Array<string>} state - The redux state or the array with the enabled buttons.
 * @returns {boolean} - True if the button is enabled and false otherwise.
 */
export function isButtonEnabled(buttonName: string, state: IReduxState | Array<string>) {
    const buttons = Array.isArray(state) ? state : state['features/toolbox'].toolbarButtons || [];

    return buttons.includes(buttonName);
}
