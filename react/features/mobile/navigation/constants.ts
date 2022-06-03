import debounce from 'lodash/debounce';

import { readyToClose } from '../external-api/actions';

/**
 * Debounced sending of `readyToClose`.
 */
export const _sendReadyToClose = debounce(dispatch => {
    dispatch(readyToClose());
}, 2500, { leading: true });
