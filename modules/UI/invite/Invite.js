/* global JitsiMeetJS, APP */

import InviteDialogView from './InviteDialogView';
import createRoomLocker from './RoomLocker';
import UIEvents from  '../../../service/UI/UIEvents';

const ConferenceEvents = JitsiMeetJS.events.conference;

class Invite {
    constructor(conference) {
        this.conference = conference;
        this.createRoomLocker(conference);
        this.initDialog();
        this.registerListeners();
    }

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

    updateView() {
        if (!this.view) {
            this.initDialog();
        }

        this.view.updateView();
    }

    createRoomLocker(room = this.conference) {
        let roomLocker = createRoomLocker(room);
        this.roomLocker = roomLocker;
        return this.getRoomLocker();
    }

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

    initDialog() {
        this.password = this.getPassword();
        this.view = new InviteDialogView(this);
    }

    getPassword() {
        return this.roomLocker.password;
    }

    setLocalAsModerator() {
        this.isModerator = true;

        this.updateView();
    }

    unsetLocalAsModerator() {
        this.isModerator = false;
        this.updateView();
    }

    setRoomUnlocked() {
        if (this.isModerator) {
            this.roomLocker.lock().then(() => {
                APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK);
                this.updateView();
            });
        }
    }

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

    getEncodedInviteUrl() {
        return encodeURI(this.inviteUrl);
    }

    isLocked() {
        return this.roomLocker.isLocked;
    }
}

export default Invite;
