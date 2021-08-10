// @flow

import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants';
import { ReducerRegistry } from '../base/redux';

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_VISIBLE,
    SET_HORIZONTAL_VIEW_DIMENSIONS,
    SET_TILE_VIEW_DIMENSIONS,
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
     * The custom audio volume levels per participant.
     *
     * @type {Object}
     */
    participantsVolume: {},

    /**
     * The ordered IDs of the remote participants displayed in the filmstrip.
     *
     * NOTE: Currently the order will match the one from the base/participants array. But this is good initial step for
     * reordering the remote participants.
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
     * The visible participants in the filmstrip.
     *
     * @public
     * @type {Array<string>}
     */
    visibleParticipants: [],


    /**
     * The start index in the remote participants array that is visible in the filmstrip.
     *
     * @public
     * @type {number}
     */
    visibleParticipantsStartIndex: 0
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
        case SET_VISIBLE_REMOTE_PARTICIPANTS:
            return {
                ...state,
                visibleParticipantsStartIndex: action.startIndex,
                visibleParticipantsEndIndex: action.endIndex,
                visibleParticipants: state.remoteParticipants.slice(action.startIndex, action.endIndex + 1)
            };
        case PARTICIPANT_JOINED: {
            const { id, local } = action.participant;

            if (!local) {
                state.remoteParticipants = [ ...state.remoteParticipants, id ];

                const { visibleParticipantsStartIndex: startIndex, visibleParticipantsEndIndex: endIndex } = state;

                if (state.remoteParticipants.length - 1 <= endIndex) {
                    state.visibleParticipants = state.remoteParticipants.slice(startIndex, endIndex + 1);
                }
            }

            return state;
        }
        case PARTICIPANT_LEFT: {
            const { id, local } = action.participant;

            if (local) {
                return state;
            }

            let removedParticipantIndex = 0;

            state.remoteParticipants = state.remoteParticipants.filter((participantId, index) => {
                if (participantId === id) {
                    removedParticipantIndex = index;

                    return false;
                }

                return true;
            });

            const { visibleParticipantsStartIndex: startIndex, visibleParticipantsEndIndex: endIndex } = state;

            if (removedParticipantIndex >= startIndex && removedParticipantIndex <= endIndex) {
                state.visibleParticipants = state.remoteParticipants.slice(startIndex, endIndex + 1);
            }

            delete state.participantsVolume[id];

            return state;
        }
        }

        return state;
    });
