/* global APP */

import InviteDialog from './InviteDialog';
import InviteDialogView from './InviteDialogView';
import UIEvents from '../../../service/UI/UIEvents';

class Invite {
    constructor(conference) {
        this.conference = conference;
        this.registerListeners();
    }

    registerListeners() {

    }

    /**
     * Opens the invite link dialog.
     */
    openLinkDialog () {
        let promise;

        if (!this.view) {
            promise = this.initDialog();
        } else {
            promise = Promise.resolve();
        }

        promise.then(() => this.view.open());
    }

    initDialog() {
        let options = {};

        return new Promise((resolve) => {
            this.getPassword().then(password => {
                options.password = password;
                options.isModerator = this.isModerator;
                options.inviteUrl = this.inviteUrl;

                this.model = new InviteDialog(options);
                this.view = new InviteDialogView(this.model);
                this.model.addView(this.view);
                resolve();
            });
        });
    }

    getPassword() {
        return new Promise((resolve) => {
            let event = UIEvents.REQUEST_ROOM_PASSWORD;

            APP.UI.emitEvent(event, (room) => {
                resolve(room.password);
            });
        });
    }

    setLocalAsModerator() {
        let promise;
        this.isModerator = true;

        if(!this.model) {
            promise = this.initDialog();
        } else {
            promise = Promise.resolve();
        }

        promise.then(() => {
            this.model.setLocalAsModerator();
        });
    }

    unsetLocalAsModerator() {
        let promise;

        if(!this.model) {
            promise = this.initDialog();
        } else {
            promise = Promise.resolve();
        }

        promise.then(() => {
            this.model.unsetLocalAsModerator();
        });
    }

    setRoomUnlocked() {
        let promise;

        if(!this.model) {
            promise = this.initDialog();
        } else {
            promise = Promise.resolve();
        }

        promise.then(() => {
            this.model.setRoomUnlocked();
        });
    }

    setRoomLocked() {
        let promise;

        if(!this.model) {
            promise = this.initDialog();
        } else {
            promise = Promise.resolve();
        }

        promise.then(() => {
            return this.getPassword();
        }).then((password) => {
            this.model.setRoomLocked(password);
        });
    }

    /**
     * Updates the room invite url.
     */
    updateInviteUrl (newInviteUrl) {
        let promise;
        if (!this.model) {
            promise = this.initDialog();
        } else {
            promise = Promise.resolve();
        }

        promise.then(() => {
            this.model.updateInviteUrl(newInviteUrl);
        });
    }
}

const InviteModule = new Invite();
export default InviteModule;
