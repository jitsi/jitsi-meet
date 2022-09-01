// @flow

import { getFeatureFlag, FILMSTRIP_ENABLED } from '../base/flags';
import {
    getLocalParticipant,
    getParticipantCountWithFake,
    getPinnedParticipant
} from '../base/participants';
import { Platform } from '../base/react';
import { toState } from '../base/redux';
import { ASPECT_RATIO_NARROW } from '../base/responsive-ui/constants';
import { shouldHideSelfView } from '../base/settings/functions.any';
import conferenceStyles from '../conference/components/native/styles';
import { shouldDisplayTileView } from '../video-layout';

import { styles } from './components';

export * from './functions.any';

/**
 * Returns true if the filmstrip on mobile is visible, false otherwise.
 *
 * NOTE: Filmstrip on mobile behaves differently to web, and is only visible
 * when there are at least 2 participants.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {boolean}
 */
export function isFilmstripVisible(stateful: Object | Function) {
    const state = toState(stateful);

    const enabled = getFeatureFlag(state, FILMSTRIP_ENABLED, true);

    if (!enabled) {
        return false;
    }

    return getParticipantCountWithFake(state) > 1;
}

/**
 * Determines whether the remote video thumbnails should be displayed/visible in
 * the filmstrip.
 *
 * @param {Object} state - The full redux state.
 * @returns {boolean} - If remote video thumbnails should be displayed/visible
 * in the filmstrip, then {@code true}; otherwise, {@code false}.
 */
export function shouldRemoteVideosBeVisible(state: Object) {
    if (state['features/invite'].calleeInfoVisible) {
        return false;
    }

    // Include fake participants to derive how many thumbnails are displayed,
    // as it is assumed all participants, including fake, will be displayed
    // in the filmstrip.
    const participantCount = getParticipantCountWithFake(state);
    const pinnedParticipant = getPinnedParticipant(state);
    const { disable1On1Mode } = state['features/base/config'];

    return Boolean(
        participantCount > 2

            // Always show the filmstrip when there is another participant to
            // show and the local video is pinned. Note we are not taking the
            // toolbar visibility into account here (unlike web) because
            // showing / hiding views in quick succession on mobile is taxing.
            || (participantCount > 1 && pinnedParticipant?.local)

            || disable1On1Mode);
}

/**
 * Not implemented on mobile.
 *
 * @returns {Array<string>}
 */
export function getActiveParticipantsIds() {
    return [];
}

/**
 * Returns the number of participants displayed in tile view.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {number} - The number of participants displayed in tile view.
 */
export function getTileViewParticipantCount(stateful: Object | Function) {
    const state = toState(stateful);
    const disableSelfView = shouldHideSelfView(state);
    const localParticipant = getLocalParticipant(state);
    const participantCount = getParticipantCountWithFake(state) - (disableSelfView && localParticipant ? 1 : 0);

    return participantCount;
}

/**
 * Returns how many columns should be displayed for tile view.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {number} - The number of columns to be rendered in tile view.
 * @private
 */
export function getColumnCount(stateful: Object | Function) {
    const state = toState(stateful);
    const participantCount = getTileViewParticipantCount(state);
    const { aspectRatio } = state['features/base/responsive-ui'];

    // For narrow view, tiles should stack on top of each other for a lonely
    // call and a 1:1 call. Otherwise tiles should be grouped into rows of
    // two.
    if (aspectRatio === ASPECT_RATIO_NARROW) {
        return participantCount >= 3 ? 2 : 1;
    }

    if (participantCount === 4) {
        // In wide view, a four person call should display as a 2x2 grid.
        return 2;
    }

    return Math.min(participantCount <= 6 ? 3 : 4, participantCount);
}

/**
 * Returns true if the filmstrip has a scroll and false otherwise.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} - True if the scroll is displayed and false otherwise.
 */
export function isFilmstripScrollVisible(state) {
    if (shouldDisplayTileView(state)) {
        return state['features/filmstrip']?.tileViewDimensions?.hasScroll;
    }

    const { aspectRatio, clientWidth, clientHeight, safeAreaInsets = {} } = state['features/base/responsive-ui'];
    const isNarrowAspectRatio = aspectRatio === ASPECT_RATIO_NARROW;
    const disableSelfView = shouldHideSelfView(state);
    const localParticipant = Boolean(getLocalParticipant(state));
    const localParticipantVisible = localParticipant && !disableSelfView;
    const participantCount
        = getParticipantCountWithFake(state)
            - (localParticipant && (shouldDisplayLocalThumbnailSeparately() || disableSelfView) ? 1 : 0);
    const { height: thumbnailHeight, width: thumbnailWidth, margin } = styles.thumbnail;
    const { height, width } = getFilmstripDimensions({
        aspectRatio,
        clientWidth,
        clientHeight,
        insets: safeAreaInsets,
        localParticipantVisible
    });

    if (isNarrowAspectRatio) {
        return width < (thumbnailWidth + (2 * margin)) * participantCount;
    }

    return height < (thumbnailHeight + (2 * margin)) * participantCount;
}

/**
 * Whether the stage filmstrip is available or not.
 *
 * @param {Object} state - Redux state.
 * @returns {boolean}
 */
export function isStageFilmstripAvailable() {
    return false;
}

/**
 * Whether the stage filmstrip is enabled.
 *
 * @returns {boolean}
 */
export function isStageFilmstripEnabled() {
    return false;
}

/**
 * Whether or not the top panel is enabled.
 *
 * @returns {boolean}
 */
export function isTopPanelEnabled() {
    return false;

}

/**
 * Calculates the width and height of the filmstrip based on the screen size and aspect ratio.
 *
 * @param {Object} options - The screen aspect ratio, width, height and safe are insets.
 * @returns {Object} - The width and the height.
 */
export function getFilmstripDimensions({
    aspectRatio,
    clientWidth,
    clientHeight,
    insets = {},
    localParticipantVisible = true
}) {
    const { height, width, margin } = styles.thumbnail;
    const conferenceBorder = conferenceStyles.conference.borderWidth || 0;
    const { left = 0, right = 0, top = 0, bottom = 0 } = insets;

    if (aspectRatio === ASPECT_RATIO_NARROW) {
        return {
            height,
            width:
                (shouldDisplayLocalThumbnailSeparately() && localParticipantVisible
                    ? clientWidth - width - (margin * 2) : clientWidth)
                    - left - right - (styles.filmstripNarrow.margin * 2) - (conferenceBorder * 2)

        };
    }

    return {
        height:
            (shouldDisplayLocalThumbnailSeparately() && localParticipantVisible
                ? clientHeight - height - (margin * 2) : clientHeight)
                - top - bottom - (conferenceBorder * 2),
        width
    };
}

/**
 * Returns true if the local thumbnail should be displayed separately and false otherwise.
 *
 * @returns {boolean} - True if the local thumbnail should be displayed separately and flase otherwise.
 */
export function shouldDisplayLocalThumbnailSeparately() {
    // XXX Our current design is to have the local participant separate from
    // the remote participants. Unfortunately, Android's Video
    // implementation cannot accommodate that because remote participants'
    // videos appear on top of the local participant's video at times.
    // That's because Android's Video utilizes EGL and EGL gives us only two
    // practical layers in which we can place our participants' videos:
    // layer #0 sits behind the window, creates a hole in the window, and
    // there we render the LargeVideo; layer #1 is known as media overlay in
    // EGL terms, renders on top of layer #0, and, consequently, is for the
    // Filmstrip. With the separate LocalThumbnail, we should have left the
    // remote participants' Thumbnails in layer #1 and utilized layer #2 for
    // LocalThumbnail. Unfortunately, layer #2 is not practical (that's why
    // I said we had two practical layers only) because it renders on top of
    // everything which in our case means on top of participant-related
    // indicators such as moderator, audio and video muted, etc. For now we
    // do not have much of a choice but to continue rendering LocalThumbnail
    // as any other remote Thumbnail on Android.
    return Platform.OS !== 'android';
}

/**
 * Not implemented on mobile.
 *
 * @returns {undefined}
 */
export function getScreenshareFilmstripParticipantId() {
    return undefined;
}


