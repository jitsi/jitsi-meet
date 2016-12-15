/* global APP, JitsiMeetJS */
import UIEvents from '../../../../service/UI/UIEvents';
import AuthHandler from '../../../../modules/UI/authentication/AuthHandler';

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConferenceErrors = JitsiMeetJS.errors.conference;
const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Class ConferenceConnector
 *
 * @class ConferenceConnector
 */
export default class ConferenceConnector {

    /**
     * ConferenceConnector constructor.
     *
     * @param {Function} resolve - Function resolving promise.
     * @param {Funciton} reject - Function rejecting the promise.
     * @param {Object} invite - Invite module.
     * @param {Object} room - Created room.
     * @param {Object} connection - Conference connection.
     */
    constructor({ resolve, reject, invite, room, connection }) {
        this._resolve = resolve;
        this._reject = reject;
        this._invite = invite;
        this._room = room;
        this._connection = connection;

        this.reconnectTimeout = null;
        this._room.on(ConferenceEvents.CONFERENCE_JOINED,
            this._handleConferenceJoined.bind(this));
        this._room.on(ConferenceEvents.CONFERENCE_FAILED,
            this._onConferenceFailed.bind(this));
        this._room.on(ConferenceEvents.CONFERENCE_ERROR,
            this._onConferenceError.bind(this));
    }

    /**
     * Handler switch for failing conference.
     *
     * @param {Object} err - Object error.
     * @param {Array} params - Error params.
     * @returns {void}
     * @private
     */
    _onConferenceFailed(err, ...params) {
        logger.error('CONFERENCE FAILED:', err, ...params);
        APP.UI.hideRingOverLay();
        switch (err) {

            // room is locked by the password
        case ConferenceErrors.PASSWORD_REQUIRED:
            APP.UI.emitEvent(UIEvents.PASSWORD_REQUIRED);
            break;

        case ConferenceErrors.CONNECTION_ERROR:
            {
                const [ msg ] = params;

                APP.UI.notifyConnectionFailed(msg);
            }
            break;

        case ConferenceErrors.NOT_ALLOWED_ERROR:

            // let's show some auth not allowed page
            window.location.pathname = '../../../../authError.html';
            break;

        // not enough rights to create conference
        case ConferenceErrors.AUTHENTICATION_REQUIRED:
            // schedule reconnect to check if someone else created the room
            this.reconnectTimeout = setTimeout(() => {
                this._room.join();
            }, 5000);

            // notify user that auth is required
            AuthHandler.requireAuth(
                this._room, this._invite.getRoomLocker().password);
            break;

        case ConferenceErrors.RESERVATION_ERROR:
            {
                const [ code, msg ] = params;

                APP.UI.notifyReservationError(code, msg);
            }
            break;

        case ConferenceErrors.GRACEFUL_SHUTDOWN:
            APP.UI.notifyGracefulShutdown();
            break;

        case ConferenceErrors.JINGLE_FATAL_ERROR:
            APP.UI.notifyInternalError();
            break;

        case ConferenceErrors.CONFERENCE_DESTROYED:
            {
                const [ reason ] = params;

                APP.UI.hideStats();
                APP.UI.notifyConferenceDestroyed(reason);
            }
            break;

            // FIXME FOCUS_DISCONNECTED is confusing event name.
            // What really happens there is that the library is not ready yet,
            // because Jicofo is not available, but it is going to give
            // it another try.
        case ConferenceErrors.FOCUS_DISCONNECTED:
            {
                const [ focus, retrySec ] = params;

                APP.UI.notifyFocusDisconnected(focus, retrySec);
            }
            break;

        case ConferenceErrors.FOCUS_LEFT:
        case ConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE:
            // FIXME the conference should be stopped by the
            // library and not by the app. Both the errors
            // above are unrecoverable from the library
            // perspective.
            this._room.leave().then(() => this._connection.disconnect());
            APP.UI.showPageReloadOverlay(
                false /* not a network type of failure */, err);
            break;

        case ConferenceErrors.CONFERENCE_MAX_USERS:
            this._connection.disconnect();
            APP.UI.notifyMaxUsersLimitReached();
            break;
        case ConferenceErrors.INCOMPATIBLE_SERVER_VERSIONS:
            window.location.reload();
            break;
        default:
            this._handleConferenceFailed(err, ...params);
        }
    }

    /**
     * Default handler for conference failing.
     *
     * @param {Object} err - Error object.
     * @returns {void}
     * @private
     */
    _handleConferenceFailed(err) {
        this._unsubscribe();
        this._reject(err);
    }

    /**
     * Handler for conference error.
     *
     * @param {Object} err - Error data object.
     * @param {Array} params - Array of error params.
     * @private
     * @returns {void}
     */
    _onConferenceError(err, ...params) {
        logger.error('CONFERENCE Error:', err, params);
        switch (err) {
        case ConferenceErrors.CHAT_ERROR:
            {
                const [ code, msg ] = params;

                APP.UI.showChatError(code, msg);
            }
            break;

        default:
            logger.error('Unknown error.', err);
        }
    }

    /**
     * Method unsubscribing from conference events.
     *
     * @private
     * @returns {void}
     */
    _unsubscribe() {
        this._room.off(
            ConferenceEvents.CONFERENCE_JOINED, this._handleConferenceJoined);
        this._room.off(
            ConferenceEvents.CONFERENCE_FAILED, this._onConferenceFailed);
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
        }
        AuthHandler.closeAuth();
    }

    /**
     * Handler for join the conference.
     *
     * @private
     * @returns {void}
     */
    _handleConferenceJoined() {
        this._unsubscribe();
        this._resolve();
    }

    /**
     * Method joining to room.
     *
     * @returns {void}
     */
    connect() {
        this._room.join();
    }
}
