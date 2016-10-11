/* global JitsiMeetJS, APP */

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
        this.createRoomLocker(conference);
        this.initDialog();
        this.registerListeners();
    }

    /**
     * Registering listeners.
     * Primarily listeners for conference events.
     */
    registerListeners() {
        let event = ConferenceEvents.LOCK_STATE_CHANGED;
        this.conference.on(event, (locked, error) => {
            let oldLockState = this.roomLocker.lockedElsewhere;

            console.log("Received channel password lock change: ", locked,
                error);

            if (!locked) {
                this.roomLocker.resetPassword();
            }

            if (oldLockState !== locked) {
                this.roomLocker.lockedElsewhere = locked;
                APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
                this.updateView();
            }

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
        this.password = this.getPassword();
        this.view = new InviteDialogView(this);
    }

    /**
     * Password getter
     * @returns {String} password
     */
    getPassword() {
        return this.roomLocker.password;
    }

    /**
     * Sets local as moderator
     * Used to show UI states
     */
    setLocalAsModerator() {
        this.isModerator = true;

        this.updateView();
    }

    /**
     * Unsets local as moderator
     * Used fo show UI states
     */
    unsetLocalAsModerator() {
        this.isModerator = false;
        this.updateView();
    }

    /**
     * Allows to unlock the room.
     * If the current user is moderator.
     */
    setRoomUnlocked() {
        if (this.isModerator) {
            this.roomLocker.lock().then(() => {
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
        if (isModerator && (newPass || !this.roomLocker.isLocked)) {
            this.roomLocker.lock(newPass).then(() => {
                APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
                this.updateView();
            });
        }
    }

    /**
     * Updates the room invite url.
     */
    updateInviteUrl (newInviteUrl) {
        this.inviteUrl = newInviteUrl;
        this.updateView();
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
        return this.roomLocker.isLocked;
    }

    /**
     * Set flag locked from elsewhere to room locker
     */
    lockFromElsewhere() {
        this.roomLocker.lockedElsewhere = true;
        APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
    }

    /**
     * Unset flag locked from elsewhere to room locker
     */
    unlockFromElsewhere() {
        this.roomLocker.lockedElsewhere = false;
        APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
    }
}

export default Invite;
