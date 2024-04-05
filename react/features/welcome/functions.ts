import { IStateful } from "../base/app/types";
import { MEETING_TITLE, WAITING_AREA_TEXT, WELCOME_PAGE_ENABLED, BACK_BUTTON_HANDLER, DIRECT_JOIN_MEETING_ENABLED } from "../base/flags/constants";
import { getFeatureFlag } from "../base/flags/functions";
import { toState } from "../base/redux/functions";

/**
 * Determines whether the {@code WelcomePage} is enabled.
 *
 * @param {IStateful} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the app, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageEnabled(stateful: IStateful) {
    if (navigator.product === "ReactNative") {
        return getFeatureFlag(stateful, WELCOME_PAGE_ENABLED, false);
    }

    const config = toState(stateful)["features/base/config"];

    return !config.welcomePage?.disabled;
}

export function isDirectJoinMeetingEnabled(stateful: IStateful) {
    if (navigator.product === "ReactNative") {
        return getFeatureFlag(stateful, DIRECT_JOIN_MEETING_ENABLED, false);
    }

    const config = toState(stateful)["features/base/config"];

    return !config.directJoinMeeting?.disabled;
}

export function isBackButtonHandlerEnabled(stateful: IStateful) {
    if (navigator.product === "ReactNative") {
        return getFeatureFlag(stateful, BACK_BUTTON_HANDLER, false);
    }

    const config = toState(stateful)["features/base/config"];

    return !config.backButtonHandler?.disabled;
}

/**
 * Returns the configured custom URL (if any) to redirect to instead of the normal landing page.
 *
 * @param {IStateful} stateful - The redux state or {@link getState}.
 * @returns {string} - The custom URL.
 */
export function getCustomLandingPageURL(stateful: IStateful) {
    return toState(stateful)["features/base/config"].welcomePage?.customUrl;
}

// set waiting area text

export function isWaitingAreaTextEnabled(stateful: IStateful) {
    if (navigator.product === "ReactNative") {
        return getFeatureFlag(
            stateful,
            WAITING_AREA_TEXT,
            false
        );
    }

    const config = toState(stateful)["features/base/config"];

    return !config.TextForWaitingArea?.disabled;
    // return toState(stateful)['features/base/config'].TextForWaitingArea?.waitingText;
}


// set meeting title

export function isMeetingTitleEnabled(stateful: IStateful) {
    if (navigator.product === "ReactNative") {
        return getFeatureFlag(
            stateful,
            MEETING_TITLE,
            false
        );
    }

    const config = toState(stateful)["features/base/config"];

    return !config.TextForMeetingTitle?.disabled;
    // return toState(stateful)['features/base/config'].TextForMeetingTitle?.meetingTitle;
}
