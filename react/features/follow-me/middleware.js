// @flow

import { MiddlewareRegistry } from '../base/redux';
import {
    getLocalParticipant,
    getParticipantById,
    getPinnedParticipant,
    pinParticipant
} from '../base/participants';
import { CONFERENCE_WILL_JOIN } from '../base/conference';
import { setFilmstripVisible } from '../filmstrip';
import { setTileView } from '../video-layout';

import { FOLLOW_COMMAND } from './constants';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var APP: Object;

/**
 * The timeout after which a follow-me command that has been received will be
 * ignored if not consumed.
 *
 * @type {number} in seconds
 * @private
 */
const _FOLLOW_ME_RECEIVED_TIMEOUT = 30;

/**
 * An instance of a timeout used as a workaround when attempting to pin a
 * non-existent particapant, which may be caused by participant join information
 * not being received yet.
 *
 * @type {TimeoutID}
 */
let nextOnStageTimeout;

/**
 * A count of how many seconds the nextOnStageTimeout has ticked while waiting
 * for a participant to be discovered that should be pinned. This varaible
 * works in conjunction with {@code _FOLLOW_ME_RECEIVED_TIMEOUT} and
 * {@code nextOnStageTimeout}.
 *
 * @type {number}
 */
let nextOnStageTimer = 0;

/**
 * Represents the &quot;Follow Me&quot; feature which enables a moderator to
 * (partially) control the user experience/interface (e.g. filmstrip
 * visibility) of (other) non-moderator particiapnts.
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;

        // Listen to "Follow Me" commands. I'm not sure whether a moderator can
        // (in lib-jitsi-meet and/or Meet) become a non-moderator. If that's
        // possible, then it may be easiest to always listen to commands. The
        // listener will validate received commands before acting on them.
        conference.addCommandListener(
            FOLLOW_COMMAND, ({ attributes }, id) => {
                _onFollowMeCommand(attributes, id, store);
            });
    }
    }

    return next(action);
});

/**
 * Notifies this instance about a "Follow Me" command delivered by the Jitsi
 * conference.
 *
 * @param {Object} attributes - The attributes carried by the command.
 * @param {string} id - The identifier of the participant who issuing the
 * command. A notable idiosyncrasy to be mindful of here is that the command
 * may be issued by the local participant.
 * @param {Object} store - The redux store. Used to calculate and dispatch
 * updates.
 * @private
 * @returns {void}
 */
function _onFollowMeCommand(attributes, id, store) {
    const state = store.getState();

    // We require to know who issued the command because (1) only a
    // moderator is allowed to send commands and (2) a command MUST be
    // issued by a defined commander.
    if (typeof id === 'undefined') {
        return;
    }

    // The Command(s) API will send us our own commands and we don't want
    // to act upon them.
    if (getLocalParticipant(state).id === id) {
        return;
    }

    if (getParticipantById(state, id).role !== 'moderator') {
        logger.warn('Received follow-me command not from moderator');

        return;
    }

    if (typeof attributes.filmstripVisible !== 'undefined') {
        // XXX The Command(s) API doesn't preserve the types (of
        // attributes, at least) at the time of this writing so take into
        // account that what originated as a Boolean may be a String on
        // receipt.
        // eslint-disable-next-line eqeqeq
        const filmstripVisible = attributes.filmstripVisible == 'true';

        store.dispatch(setFilmstripVisible(filmstripVisible));
    }

    if (typeof attributes.sharedDocumentVisible !== 'undefined'
        && state['features/etherpad'].initialized) {
        // XXX The Command(s) API doesn't preserve the types (of
        // attributes, at least) at the time of this writing so take into
        // account that what originated as a Boolean may be a String on
        // receipt.
        // eslint-disable-next-line eqeqeq
        const etherpadVisible = attributes.sharedDocumentVisible == 'true';
        const documentManager = APP.UI.getSharedDocumentManager();

        if (documentManager
            && etherpadVisible !== state['features/etherpad'].editing) {
            documentManager.toggleEtherpad();
        }
    }

    if (typeof attributes.tileViewEnabled !== 'undefined') {
        store.dispatch(setTileView(attributes.tileViewEnabled === 'true'));
    }

    const pinnedParticipant
        = getPinnedParticipant(store.getState(), attributes.nextOnStage);
    const clickId = attributes.nextOnStage;

    if (typeof clickId !== 'undefined'
        && (!pinnedParticipant || clickId !== pinnedParticipant.id)) {
        _pinVideoThumbnailById(store, clickId);
    } else if (typeof clickId === 'undefined' && pinnedParticipant) {
        store.dispatch(pinParticipant(null));
    }
}

/**
 * Pins the video thumbnail given by clickId.
 *
 * @param {Object} store - The redux store.
 * @param {string} clickId - The identifier of the participant to pin.
 * @private
 * @returns {void}
 */
function _pinVideoThumbnailById(store, clickId) {
    if (getParticipantById(store.getState(), clickId)) {
        clearTimeout(nextOnStageTimeout);
        nextOnStageTimer = 0;

        store.dispatch(pinParticipant(clickId));
    } else {
        nextOnStageTimeout = setTimeout(() => {
            if (nextOnStageTimer > _FOLLOW_ME_RECEIVED_TIMEOUT) {
                nextOnStageTimer = 0;

                return;
            }

            nextOnStageTimer++;

            _pinVideoThumbnailById(store, clickId);
        }, 1000);
    }
}
