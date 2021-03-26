// @flow

import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants';
import { ReducerRegistry } from '../base/redux';

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_ITEMS_RENDERED,
    SET_FILMSTRIP_VISIBLE,
    SET_HORIZONTAL_VIEW_DIMENSIONS,
    SET_TILE_VIEW_DIMENSIONS,
    SET_VERTICAL_VIEW_DIMENSIONS
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
     * The tile view dimensions.
     *
     * @public
     * @type {Object}
     */
    tileViewDimensions: {},

    /**
     * The indicator which determines whether the {@link Filmstrip} is visible.
     *
     * @public
     * @type {boolean}
     */
    visible: true,

    remoteParticipants: []
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
        case SET_FILMSTRIP_ITEMS_RENDERED:
            return {
                ...state,
                startIndex: action.startIndex,
                endIndex: action.endIndex
            };
        case PARTICIPANT_JOINED: {
            const { id, local } = action.participant;

            if (!local) {
                state.remoteParticipants.push(id);
            }

            return state;
        }
        case PARTICIPANT_LEFT: {
            const { id, local } = action.participant;

            if (local) {
                return state;
            }

            const { remoteParticipants } = state;

            const index = remoteParticipants.findIndex(participantId => participantId === id);

            if (index === -1) {
                return state;
            }

            remoteParticipants[index] = remoteParticipants[remoteParticipants.length - 1];
            remoteParticipants.pop();

            return state;
        }
        }

        return state;
    });
