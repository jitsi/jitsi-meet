import { batch } from 'react-redux';

// @ts-expect-error
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT
} from '../base/participants/actionTypes';
import {
    getDominantSpeakerParticipant,
    getLocalParticipant,
    getLocalScreenShareParticipant,
    isScreenShareParticipant
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { CLIENT_RESIZED } from '../base/responsive-ui/actionTypes';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';
import { setTileView } from '../video-layout/actions.web';
import { LAYOUTS } from '../video-layout/constants';
import { getCurrentLayout } from '../video-layout/functions.web';
import { WHITEBOARD_ID } from '../whiteboard/constants';
import { isWhiteboardVisible } from '../whiteboard/functions';

import {
    ADD_STAGE_PARTICIPANT,
    CLEAR_STAGE_PARTICIPANTS,
    REMOVE_STAGE_PARTICIPANT,
    RESIZE_FILMSTRIP,
    SET_USER_FILMSTRIP_WIDTH,
    TOGGLE_PIN_STAGE_PARTICIPANT
} from './actionTypes';
import {
    addStageParticipant,
    removeStageParticipant,
    setFilmstripHeight,
    setFilmstripWidth,
    setScreenshareFilmstripParticipant,
    setStageParticipants
} from './actions.web';
import {
    ACTIVE_PARTICIPANT_TIMEOUT,
    DEFAULT_FILMSTRIP_WIDTH,
    MAX_ACTIVE_PARTICIPANTS,
    MIN_STAGE_VIEW_HEIGHT,
    MIN_STAGE_VIEW_WIDTH,
    TOP_FILMSTRIP_HEIGHT
} from './constants';
import {
    getActiveParticipantsIds,
    getPinnedActiveParticipants,
    isFilmstripResizable,
    isStageFilmstripAvailable,
    isStageFilmstripTopPanel,
    updateRemoteParticipants,
    updateRemoteParticipantsOnLeave
} from './functions.web';
import './subscriber.web';

/**
 * Map of timers.
 *
 * @type {Map}
 */
const timers = new Map();

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    if (action.type === PARTICIPANT_LEFT) {
        // This has to be executed before we remove the participant from features/base/participants state in order to
        // remove the related thumbnail component before we need to re-render it. If we do this after next()
        // we will be in situation where the participant exists in the remoteParticipants array in features/filmstrip
        // but doesn't exist in features/base/participants state which will lead to rendering a thumbnail for
        // non-existing participant.
        updateRemoteParticipantsOnLeave(store, action.participant?.id);
    }

    let result;

    switch (action.type) {
    case CLIENT_RESIZED: {
        const state = store.getState();

        if (isFilmstripResizable(state)) {
            const { width: filmstripWidth, topPanelHeight } = state['features/filmstrip'];
            const { clientWidth, clientHeight } = action;
            let height, width;

            if ((filmstripWidth.current ?? 0) > clientWidth - MIN_STAGE_VIEW_WIDTH) {
                width = Math.max(clientWidth - MIN_STAGE_VIEW_WIDTH, DEFAULT_FILMSTRIP_WIDTH);
            } else {
                width = Math.min(clientWidth - MIN_STAGE_VIEW_WIDTH, filmstripWidth.userSet ?? 0);
            }
            if (width !== filmstripWidth.current) {
                store.dispatch(setFilmstripWidth(width));
            }

            if ((topPanelHeight.current ?? 0) > clientHeight - MIN_STAGE_VIEW_HEIGHT) {
                height = Math.max(clientHeight - MIN_STAGE_VIEW_HEIGHT, TOP_FILMSTRIP_HEIGHT);
            } else {
                height = Math.min(clientHeight - MIN_STAGE_VIEW_HEIGHT, topPanelHeight.userSet ?? 0);
            }
            if (height !== topPanelHeight.current) {
                store.dispatch(setFilmstripHeight(height));
            }
        }
        break;
    }
    case PARTICIPANT_JOINED: {
        result = next(action);
        if (isScreenShareParticipant(action.participant)) {
            break;
        }

        updateRemoteParticipants(store, false, action.participant?.id);
        break;
    }
    case SETTINGS_UPDATED: {
        if (typeof action.settings?.localFlipX === 'boolean') {
            // TODO: This needs to be removed once the large video is Reactified.
            VideoLayout.onLocalFlipXChanged(action.settings.localFlipX);
        }
        if (action.settings?.disableSelfView) {
            const state = store.getState();
            const local = getLocalParticipant(state);
            const localScreenShare = getLocalScreenShareParticipant(state);
            const activeParticipantsIds = getActiveParticipantsIds(state);

            if (activeParticipantsIds.find(id => id === local?.id)) {
                store.dispatch(removeStageParticipant(local?.id ?? ''));
            }

            if (localScreenShare) {
                if (activeParticipantsIds.find(id => id === localScreenShare.id)) {
                    store.dispatch(removeStageParticipant(localScreenShare.id));
                }
            }
        }
        if (action.settings?.maxStageParticipants !== undefined) {
            const maxParticipants = action.settings.maxStageParticipants;
            const { activeParticipants } = store.getState()['features/filmstrip'];
            const newMax = Math.min(MAX_ACTIVE_PARTICIPANTS, maxParticipants);

            if (newMax < activeParticipants.length) {
                const toRemove = activeParticipants.slice(0, activeParticipants.length - newMax);

                batch(() => {
                    toRemove.forEach(p => store.dispatch(removeStageParticipant(p.participantId)));
                });
            }
        }
        break;
    }
    case SET_USER_FILMSTRIP_WIDTH: {
        VideoLayout.refreshLayout();
        break;
    }
    case RESIZE_FILMSTRIP: {
        const { width = 0 } = action;

        store.dispatch(setFilmstripWidth(width));

        break;
    }
    case ADD_STAGE_PARTICIPANT: {
        const { dispatch, getState } = store;
        const { participantId, pinned } = action;
        const state = getState();
        const { activeParticipants } = state['features/filmstrip'];
        const { maxStageParticipants } = state['features/base/settings'];
        const isWhiteboardActive = isWhiteboardVisible(state);
        let queue;

        if (activeParticipants.find(p => p.participantId === participantId)) {
            queue = activeParticipants.filter(p => p.participantId !== participantId);
            queue.push({
                participantId,
                pinned
            });
            const tid = timers.get(participantId);

            clearTimeout(tid);
            timers.delete(participantId);
        } else if (activeParticipants.length < (maxStageParticipants ?? 0)) {
            queue = [ ...activeParticipants, {
                participantId,
                pinned
            } ];
        } else {
            const notPinnedIndex = activeParticipants.findIndex(p => !p.pinned);

            if (notPinnedIndex === -1) {
                if (pinned) {
                    queue = [ ...activeParticipants, {
                        participantId,
                        pinned
                    } ];
                    queue.shift();
                }
            } else {
                queue = [ ...activeParticipants, {
                    participantId,
                    pinned
                } ];
                queue.splice(notPinnedIndex, 1);
            }
        }

        if (participantId === WHITEBOARD_ID) {
            // If the whiteboard is pinned, this action should clear the other pins.
            queue = [ {
                participantId,
                pinned: true
            } ];
        } else if (isWhiteboardActive && Array.isArray(queue)) {
            // When another participant is pinned, remove the whiteboard from the stage area.
            queue = queue.filter(p => p?.participantId !== WHITEBOARD_ID);
        }

        // If queue is undefined we haven't made any changes to the active participants. This will mostly happen
        // if the participant that we are trying to add is not pinned and all slots are currently taken by pinned
        // participants.
        // IMPORTANT: setting active participants to undefined will crash jitsi-meet.
        if (typeof queue !== 'undefined') {
            dispatch(setStageParticipants(queue));
            if (!pinned) {
                const timeoutId = setTimeout(() => dispatch(removeStageParticipant(participantId)),
                    ACTIVE_PARTICIPANT_TIMEOUT);

                timers.set(participantId, timeoutId);
            }
        }

        if (getCurrentLayout(state) === LAYOUTS.TILE_VIEW) {
            dispatch(setTileView(false));
        }
        break;
    }
    case REMOVE_STAGE_PARTICIPANT: {
        const state = store.getState();
        const { participantId } = action;
        const tid = timers.get(participantId);

        clearTimeout(tid);
        timers.delete(participantId);
        const dominant = getDominantSpeakerParticipant(state);

        if (participantId === dominant?.id) {
            const timeoutId = setTimeout(() => store.dispatch(removeStageParticipant(participantId)),
                ACTIVE_PARTICIPANT_TIMEOUT);

            timers.set(participantId, timeoutId);

            return;
        }
        break;
    }
    case DOMINANT_SPEAKER_CHANGED: {
        const { id } = action.participant;
        const state = store.getState();
        const stageFilmstrip = isStageFilmstripAvailable(state);
        const local = getLocalParticipant(state);
        const currentLayout = getCurrentLayout(state);
        const dominantSpeaker = getDominantSpeakerParticipant(state);

        if (dominantSpeaker?.id === id || id === local?.id || currentLayout === LAYOUTS.TILE_VIEW) {
            break;
        }

        if (stageFilmstrip) {
            const isPinned = getPinnedActiveParticipants(state).some(p => p.participantId === id);

            store.dispatch(addStageParticipant(id, Boolean(isPinned)));
        }
        break;
    }
    case PARTICIPANT_LEFT: {
        const state = store.getState();
        const { id } = action.participant;
        const activeParticipantsIds = getActiveParticipantsIds(state);

        if (activeParticipantsIds.find(pId => pId === id)) {
            const tid = timers.get(id);
            const { activeParticipants } = state['features/filmstrip'];

            clearTimeout(tid);
            timers.delete(id);
            store.dispatch(setStageParticipants(activeParticipants.filter(p => p.participantId !== id)));
        }
        break;
    }
    case TOGGLE_PIN_STAGE_PARTICIPANT: {
        const { dispatch, getState } = store;
        const state = getState();
        const { participantId } = action;
        const pinnedParticipants = getPinnedActiveParticipants(state);
        const dominant = getDominantSpeakerParticipant(state);

        if (isStageFilmstripTopPanel(state, 2)) {
            const screenshares = state['features/video-layout'].remoteScreenShares;

            if (screenshares.find(sId => sId === participantId)) {
                dispatch(setScreenshareFilmstripParticipant(participantId));
                break;
            }
        }

        if (pinnedParticipants.find(p => p.participantId === participantId)) {
            if (dominant?.id === participantId) {
                const { activeParticipants } = state['features/filmstrip'];
                const queue = activeParticipants.map(p => {
                    if (p.participantId === participantId) {
                        return {
                            participantId,
                            pinned: false
                        };
                    }

                    return p;
                });

                dispatch(setStageParticipants(queue));
            } else {
                dispatch(removeStageParticipant(participantId));
            }
        } else {
            dispatch(addStageParticipant(participantId, true));
        }
        break;
    }
    case CLEAR_STAGE_PARTICIPANTS: {
        const activeParticipants = getActiveParticipantsIds(store.getState());

        activeParticipants.forEach(pId => {
            const tid = timers.get(pId);

            clearTimeout(tid);
            timers.delete(pId);
        });
    }
    }

    return result ?? next(action);
});
