import { PARTICIPANTS_PANE_CLOSE } from './actionTypes';

/**
 * Action to close the participants pane.
 *
 * @returns {Object}
 */
export const close = () => {
    return {
        type: PARTICIPANTS_PANE_CLOSE
    };
};
