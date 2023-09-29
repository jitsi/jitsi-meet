import { PARTICIPANTS_PANE_OPEN } from './actionTypes';

export * from './actions.any';

/**
 * Action to open the participants pane.
 *
 * @returns {Object}
 */
export const open = () => {
    return {
        type: PARTICIPANTS_PANE_OPEN
    };
};
