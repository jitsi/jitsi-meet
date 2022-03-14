// @flow

import { PARTICIPANT_LEFT } from '../base/participants';
import { ReducerRegistry } from '../base/redux';

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_VISIBLE,
    SET_FILMSTRIP_WIDTH,
    SET_HORIZONTAL_VIEW_DIMENSIONS,
    SET_REMOTE_PARTICIPANTS,
    SET_TILE_VIEW_DIMENSIONS,
    SET_USER_FILMSTRIP_WIDTH,
    SET_USER_IS_RESIZING,
    SET_VERTICAL_VIEW_DIMENSIONS,
    SET_VISIBLE_REMOTE_PARTICIPANTS,
    SET_VOLUME
} from './actionTypes';

const DEFAULT_STATE = {
    /**
     * The indicator which determines whether the {@link Filmstrip} is enabled.
     *
     * @public
     * @type {boolean}
     */
    enabled: true,

    /**
     * The horizontal view dimensions.
     *
     * @public
     * @type {Object}
     */
    horizontalViewDimensions: {},

    /**
     * Whether or not the user is actively resizing the filmstrip.
     *
     * @public
     * @type {boolean}
     */
    isResizing: false,

    /**
     * The custom audio volume levels per participant.
     *
     * @type {Object}
     */
    participantsVolume: {},

    /**
     * The ordered IDs of the remote participants displayed in the filmstrip.
     *
     * @public
     * @type {Array<string>}
     */
    remoteParticipants: [],

    /**
     * The tile view dimensions.
     *
     * @public
     * @type {Object}
     */
    tileViewDimensions: {},

    /**
     * The vertical view dimensions.
     *
     * @public
     * @type {Object}
     */
    verticalViewDimensions: {},

    /**
     * The indicator which determines whether the {@link Filmstrip} is visible.
     *
     * @public
     * @type {boolean}
     */
    visible: true,

    /**
     * The end index in the remote participants array that is visible in the filmstrip.
     *
     * @public
     * @type {number}
     */
    visibleParticipantsEndIndex: 0,

    /**
     * The start index in the remote participants array that is visible in the filmstrip.
     *
     * @public
     * @type {number}
     */
    visibleParticipantsStartIndex: 0,

    /**
     * The visible remote participants in the filmstrip.
     *
     * @public
     * @type {Set<string>}
     */
    visibleRemoteParticipants: new Set(),

    /**
     * The width of the resizable filmstrip.
     *
     * @public
     * @type {Object}
     */
    width: {
        /**
         * Current width. Affected by: user filmstrip resize,
         * window resize, panels open/ close.
         */
        current: null,

        /**
         * Width set by user resize. Used as the preferred width.
         */
        userSet: null
    }
};

ReducerRegistry.register(
    'features/filmstrip',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_FILMSTRIP_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };

        case SET_FILMSTRIP_VISIBLE:
            return {
                ...state,
                visible: action.visible
            };

        case SET_HORIZONTAL_VIEW_DIMENSIONS:
            return {
                ...state,
                horizontalViewDimensions: action.dimensions
            };
        case SET_REMOTE_PARTICIPANTS: {
            state.remoteParticipants = action.participants;
            const { visibleParticipantsStartIndex: startIndex, visibleParticipantsEndIndex: endIndex } = state;

            state.visibleRemoteParticipants = new Set(state.remoteParticipants.slice(startIndex, endIndex + 1));

            return { ...state };
        }
        case SET_TILE_VIEW_DIMENSIONS:
            return {
                ...state,
                tileViewDimensions: action.dimensions
            };
        case SET_VERTICAL_VIEW_DIMENSIONS:
            return {
                ...state,
                verticalViewDimensions: action.dimensions
            };
        case SET_VOLUME:
            return {
                ...state,
                participantsVolume: {
                    ...state.participantsVolume,

                    // NOTE: This would fit better in the features/base/participants. But currently we store
                    // the participants as an array which will make it expensive to search for the volume for
                    // every participant separately.
                    [action.participantId]: action.volume
                }
            };
        case SET_VISIBLE_REMOTE_PARTICIPANTS: {
            return {
                ...state,
                visibleParticipantsStartIndex: action.startIndex,
                visibleParticipantsEndIndex: action.endIndex,
                visibleRemoteParticipants:
                    new Set(state.remoteParticipants.slice(action.startIndex, action.endIndex + 1))
            };
        }
        case PARTICIPANT_LEFT: {
            const { id, local } = action.participant;

            if (local) {
                return state;
            }
            delete state.participantsVolume[id];

            return {
                ...state
            };
        }
        case SET_FILMSTRIP_WIDTH: {
            return {
                ...state,
                width: {
                    ...state.width,
                    current: action.width
                }
            };
        }
        case SET_USER_FILMSTRIP_WIDTH: {
            const { width } = action;

            return {
                ...state,
                width: {
                    current: width,
                    userSet: width
                }
            };
        }
        case SET_USER_IS_RESIZING: {
            return {
                ...state,
                isResizing: action.resizing
            };
        }
        }

        return state;
    });
