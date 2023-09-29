import { IReduxState, IStore } from '../app/types';
import { TILE_VIEW_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { pinParticipant } from '../base/participants/actions';
import { getParticipantCount, getPinnedParticipant } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import { isStageFilmstripAvailable, isTileViewModeDisabled } from '../filmstrip/functions';
import { isVideoPlaying } from '../shared-video/functions';
import { VIDEO_QUALITY_LEVELS } from '../video-quality/constants';
import { getReceiverVideoQualityLevel } from '../video-quality/functions';
import { getMinHeightForQualityLvlMap } from '../video-quality/selector';

import { LAYOUTS } from './constants';

/**
 * A selector for retrieving the current automatic pinning setting.
 *
 * @private
 * @returns {string|undefined} The string "remote-only" is returned if only
 * remote screen sharing should be automatically pinned, any other truthy value
 * means automatically pin all screen shares. Falsy means do not automatically
 * pin any screen shares.
 */
export function getAutoPinSetting() {
    return typeof interfaceConfig === 'object'
        ? interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE
        : 'remote-only';
}

/**
 * Returns the {@code LAYOUTS} constant associated with the layout
 * the application should currently be in.
 *
 * @param {Object} state - The redux state.
 * @returns {string}
 */
export function getCurrentLayout(state: IReduxState) {
    if (navigator.product === 'ReactNative') {
        // FIXME: what should this return?
        return undefined;
    } else if (shouldDisplayTileView(state)) {
        return LAYOUTS.TILE_VIEW;
    } else if (interfaceConfig.VERTICAL_FILMSTRIP) {
        if (isStageFilmstripAvailable(state, 2)) {
            return LAYOUTS.STAGE_FILMSTRIP_VIEW;
        }

        return LAYOUTS.VERTICAL_FILMSTRIP_VIEW;
    }

    return LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW;
}

/**
 * Selector for determining if the UI layout should be in tile view. Tile view
 * is determined by more than just having the tile view setting enabled, as
 * one-on-one calls should not be in tile view, as well as etherpad editing.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} True if tile view should be displayed.
 */
export function shouldDisplayTileView(state: IReduxState) {
    const tileViewDisabled = isTileViewModeDisabled(state);

    if (tileViewDisabled) {
        return false;
    }

    const { tileViewEnabled } = state['features/video-layout'] ?? {};

    if (tileViewEnabled !== undefined) {
        // If the user explicitly requested a view mode, we
        // do that.
        return tileViewEnabled;
    }

    const tileViewEnabledFeatureFlag = getFeatureFlag(state, TILE_VIEW_ENABLED, true);
    const { disableTileView } = state['features/base/config'];

    if (disableTileView || !tileViewEnabledFeatureFlag) {
        return false;
    }

    const participantCount = getParticipantCount(state);
    const { iAmRecorder } = state['features/base/config'];

    // None tile view mode is easier to calculate (no need for many negations), so we do
    // that and negate it only once.
    const shouldDisplayNormalMode = Boolean(

        // Reasons for normal mode:

        // Editing etherpad
        state['features/etherpad']?.editing

        // We pinned a participant
        || getPinnedParticipant(state)

        // It's a 1-on-1 meeting
        || participantCount < 3

        // There is a shared YouTube video in the meeting
        || isVideoPlaying(state)

        // We want jibri to use stage view by default
        || iAmRecorder
    );

    return !shouldDisplayNormalMode;
}

/**
 * Private helper to automatically pin the latest screen share stream or unpin
 * if there are no more screen share streams.
 *
 * @param {Array<string>} screenShares - Array containing the list of all the screen sharing endpoints
 * before the update was triggered (including the ones that have been removed from redux because of the update).
 * @param {Store} store - The redux store.
 * @returns {void}
 */
export function updateAutoPinnedParticipant(
        screenShares: Array<string>, { dispatch, getState }: IStore) {
    const state = getState();
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares;
    const pinned = getPinnedParticipant(getState);

    // if the pinned participant is shared video or some other fake participant we want to skip auto-pinning
    if (pinned?.fakeParticipant && pinned.fakeParticipant !== FakeParticipant.RemoteScreenShare) {
        return;
    }

    // Unpin the screen share when the screen sharing participant leaves. Switch to tile view if no other
    // participant was pinned before screen share was auto-pinned, pin the previously pinned participant otherwise.
    if (!remoteScreenShares?.length) {
        let participantId = null;

        if (pinned && !screenShares.find(share => share === pinned.id)) {
            participantId = pinned.id;
        }
        dispatch(pinParticipant(participantId));

        return;
    }

    const latestScreenShareParticipantId = remoteScreenShares[remoteScreenShares.length - 1];

    if (latestScreenShareParticipantId) {
        dispatch(pinParticipant(latestScreenShareParticipantId));
    }
}

/**
 * Selector for whether we are currently in tile view.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isLayoutTileView(state: IReduxState) {
    return getCurrentLayout(state) === LAYOUTS.TILE_VIEW;
}

/**
 * Returns the video quality for the given height.
 *
 * @param {number|undefined} height - Height of the video container.
 * @returns {number}
 */
function getVideoQualityForHeight(height: number) {
    if (!height) {
        return VIDEO_QUALITY_LEVELS.LOW;
    }
    const levels = Object.values(VIDEO_QUALITY_LEVELS)
        .map(Number)
        .sort((a, b) => a - b);

    for (const level of levels) {
        if (height <= level) {
            return level;
        }
    }

    return VIDEO_QUALITY_LEVELS.ULTRA;
}

/**
 * Returns the video quality level for the resizable filmstrip thumbnail height.
 *
 * @param {number} height - The height of the thumbnail.
 * @param {Object} state - Redux state.
 * @returns {number}
 */
export function getVideoQualityForResizableFilmstripThumbnails(height: number, state: IReduxState) {
    if (!height) {
        return VIDEO_QUALITY_LEVELS.LOW;
    }

    return getReceiverVideoQualityLevel(height, getMinHeightForQualityLvlMap(state));
}

/**
 * Returns the video quality level for the screen sharing filmstrip thumbnail height.
 *
 * @param {number} height - The height of the thumbnail.
 * @param {Object} state - Redux state.
 * @returns {number}
 */
export function getVideoQualityForScreenSharingFilmstrip(height: number, state: IReduxState) {
    if (!height) {
        return VIDEO_QUALITY_LEVELS.LOW;
    }

    return getReceiverVideoQualityLevel(height, getMinHeightForQualityLvlMap(state));
}

/**
 * Returns the video quality for the large video.
 *
 * @param {number} largeVideoHeight - The height of the large video.
 * @returns {number} - The video quality for the large video.
 */
export function getVideoQualityForLargeVideo(largeVideoHeight: number) {
    return getVideoQualityForHeight(largeVideoHeight);
}

/**
 * Returns the video quality level for the thumbnails in the stage filmstrip.
 *
 * @param {number} height - The height of the thumbnails.
 * @param {Object} state - Redux state.
 * @returns {number}
 */
export function getVideoQualityForStageThumbnails(height: number, state: IReduxState) {
    if (!height) {
        return VIDEO_QUALITY_LEVELS.LOW;
    }

    return getReceiverVideoQualityLevel(height, getMinHeightForQualityLvlMap(state));
}
