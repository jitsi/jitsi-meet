// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_FILMSTRIP_ENABLED,
    SET_FILMSTRIP_HOVERED,
    SET_FILMSTRIP_VISIBLE,
    SET_FILMSTRIP_VISIBLE_PARTICIPANT_IDS
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
     * The indicator which determines whether the {@link Filmstrip} is visible.
     *
     * @public
     * @type {boolean}
     */
    visible: true,

    /**
     * IDs of those participants that are currently visible in the filmstrip.
     * @public
     * @type {Array}
     */
    visibleParticipantIds: []
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

        case SET_FILMSTRIP_HOVERED:
            return {
                ...state,

                /**
                 * The indicator which determines whether the {@link Filmstrip}
                 * is being hovered (over).
                 *
                 * @public
                 * @type {boolean}
                 */
                hovered: action.hovered
            };

        case SET_FILMSTRIP_VISIBLE:
            return {
                ...state,
                visible: action.visible
            };

        case SET_FILMSTRIP_VISIBLE_PARTICIPANT_IDS:
            return {
                ...state,
                visibleParticipantIds: [
                    ...action.visibleParticipantIds
                ]
            };
        }

        return state;
    });
