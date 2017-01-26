/* global JitsiMeetJS, APP */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import InviteDialogView from './InviteDialogView';
import createRoomLocker from './RoomLocker';
import UIEvents from  '../../../service/UI/UIEvents';

const ConferenceEvents = JitsiMeetJS.events.conference;

/**
 * Invite module
 * Constructor takes conference object giving
 * ability to subscribe on its events
 */
class Invite {
    constructor(conference) {
        this.conference = conference;
        this.inviteUrl = APP.ConferenceUrl.getInviteUrl();
        this.createRoomLocker(conference);
        this.registerListeners();
    }

    /**
     * Registering listeners.
     * Primarily listeners for conference events.
     */
    registerListeners() {

        this.conference.on(ConferenceEvents.LOCK_STATE_CHANGED,
            (locked, error) => {

            logger.log("Received channel password lock change: ", locked,
                error);

            if (!locked) {
                this.getRoomLocker().resetPassword();
            }

            this.setLockedFromElsewhere(locked);
        });

        this.conference.on(ConferenceEvents.USER_ROLE_CHANGED, (id) => {
            if (APP.conference.isLocalId(id)
                    && this.isModerator !== this.conference.isModerator()) {

                this.setModerator(this.conference.isModerator());
            }
        });

        this.conference.on(ConferenceEvents.CONFERENCE_JOINED, () => {
            let roomLocker = this.getRoomLocker();
            roomLocker.hideRequirePasswordDialog();
        });

        APP.UI.addListener( UIEvents.INVITE_CLICKED,
                            () => { this.openLinkDialog(); });

        APP.UI.addListener( UIEvents.PASSWORD_REQUIRED,
            () => {
                let roomLocker = this.getRoomLocker();
                this.setLockedFromElsewhere(true);
                roomLocker.requirePassword().then(() => {
                    let pass = roomLocker.password;
                    // we received that password is required, but user is trying
                    // anyway to login without a password, mark room as not
                    // locked in case he succeeds (maybe someone removed the
                    // password meanwhile), if it is still locked another
                    // password required will be received and the room again
                    // will be marked as locked.
                    if (!pass)
                        this.setLockedFromElsewhere(false);
                    this.conference.join(pass);
                });
            });
    }

    /**
     * Updates the view.
     * If dialog hasn't been defined -
     * creates it and updates
     */
    updateView() {
        if (!this.view) {
            this.initDialog();
        }

        this.view.updateView();
    }

    /**
     * Room locker factory
     * @param room
     * @returns {Object} RoomLocker
     * @factory
     */
    createRoomLocker(room = this.conference) {
        let roomLocker = createRoomLocker(room);
        this.roomLocker = roomLocker;
        return this.getRoomLocker();
    }

    /**
     * Room locker getter
     * @returns {Object} RoomLocker
     */
    getRoomLocker() {
        return this.roomLocker;
    }

    /**
     * Opens the invite link dialog.
     */
    openLinkDialog () {
        if (!this.view) {
            this.initDialog();
        }

        this.view.open();
    }

    /**
     * Dialog initialization.
     * creating view object using as a model this module
     */
    initDialog() {
        this.view = new InviteDialogView(this);
    }

    /**
     * Password getter
     * @returns {String} password
     */
    getPassword() {
        return this.getRoomLocker().password;
    }

    /**
     * Switches between the moderator view and normal view.
     *
     * @param isModerator indicates if the participant is moderator
     */
    setModerator(isModerator) {
        this.isModerator = isModerator;

        this.updateView();
    }

    /**
     * Allows to unlock the room.
     * If the current user is moderator.
     */
    setRoomUnlocked() {
        if (this.isModerator) {
            this.getRoomLocker().lock().then(() => {
                APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
                this.updateView();
            });
        }
    }

    /**
     * Allows to lock the room if
     * the current user is moderator.
     * Takes the password.
     * @param {String} newPass
     */
    setRoomLocked(newPass) {
        let isModerator = this.isModerator;
        if (isModerator && (newPass || !this.getRoomLocker().isLocked)) {
            this.getRoomLocker().lock(newPass).then(() => {
                APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
                this.updateView();
            });
        }
    }

    /**
     * Helper method for encoding
     * Invite URL
     * @returns {string}
     */
    getEncodedInviteUrl() {
        return encodeURI(this.inviteUrl);
    }

    /**
     * Is locked flag.
     * Delegates to room locker
     * @returns {Boolean} isLocked
     */
    isLocked() {
        return this.getRoomLocker().isLocked;
    }

    /**
     * Set flag locked from elsewhere to room locker.
     * @param isLocked
     */
    setLockedFromElsewhere(isLocked) {
        let roomLocker = this.getRoomLocker();
        let oldLockState = roomLocker.isLocked;
        if (oldLockState !== isLocked) {
            roomLocker.lockedElsewhere = isLocked;
            APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
            this.updateView();
        }
    }
}

export default Invite;
