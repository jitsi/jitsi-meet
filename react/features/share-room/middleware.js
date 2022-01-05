// @flow

import { Share } from 'react-native';

import { getName } from '../app/functions';
import { MiddlewareRegistry } from '../base/redux';
import { getShareInfoText } from '../invite';

import { BEGIN_SHARE_ROOM } from './actionTypes';
import { endShareRoom } from './actions';
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
function _shareRoom(roomURL: string, { dispatch, getState }) {
    getShareInfoText(getState(), roomURL)
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
                    });
        });
}
