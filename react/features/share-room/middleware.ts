import { Share } from 'react-native';

import { getName } from '../app/functions.native';
import { IStore } from '../app/types';
import { INVITE_DIAL_IN_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getShareInfoText } from '../invite/functions';

import { BEGIN_SHARE_ROOM } from './actionTypes';
import { endShareRoom, toggleShareDialog } from './actions';
import logger from './logger';

/**
 * Middleware that captures room URL sharing actions and starts the sharing
 * process.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case BEGIN_SHARE_ROOM:
        _shareRoom(action.roomURL, store);
        break;
    }

    return next(action);
});

/**
 * Open the native sheet for sharing a specific conference/room URL.
 *
 * @param {string} roomURL - The URL of the conference/room to be shared.
 * @param {Store} store - Redux store.
 * @private
 * @returns {void}
 */
function _shareRoom(roomURL: string, { dispatch, getState }: IStore) {
    const dialInEnabled = getFeatureFlag(getState(), INVITE_DIAL_IN_ENABLED, true);

    getShareInfoText(getState(), roomURL, false /* useHtml */, !dialInEnabled /* skipDialIn */)
        .then(message => {
            const title = `${getName()} Conference`;
            const onFulfilled
                = (shared: boolean) => dispatch(endShareRoom(roomURL, shared));

            Share.share(
                /* content */ {
                    message,
                    title
                },
                /* options */ {
                    dialogTitle: title, // Android
                    subject: title // iOS
                })
                .then(
                    /* onFulfilled */ value => {
                        onFulfilled(value.action === Share.sharedAction);
                    },
                    /* onRejected */ reason => {
                        logger.error(
                            `Failed to share conference/room URL ${roomURL}:`,
                            reason);
                        onFulfilled(false);
                    })
                .finally(() => {
                    dispatch(toggleShareDialog(false));
                });
        });
}
