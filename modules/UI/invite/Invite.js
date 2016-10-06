/* global APP, $ */

import InviteDialog from './InviteDialog';
import InviteDialogView from './InviteDialogView';
import UIEvents from '../../../service/UI/UIEvents';

class Invite {
    constructor() {
        this.roomLocked = false;
    }
    /**
     * Opens the invite link dialog.
     */
    openLinkDialog () {
        if (!this.view) {
            this.initDialog().then(() => this.view.open());
        } else {
            this.view.open();
        }
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
                resolve();
            });
        });
    }

    getPassword() {
        return new Promise((resolve) => {
            if(!this.roomLocked) {
                resolve(null);
            } else {
                let event = UIEvents.REQUEST_ROOM_PASSWORD;

                APP.UI.emitEvent(event, (room) => {
                    resolve(room.password);
                });
            }
        });
    }

    setLocalAsModerator() {
        this.isModerator = true;

        if(this.model) {
            this.model.setLocalAsModerator();
        }
    }

    unsetLocalAsModerator() {
        this.isModerator = false;

        if(this.model) {
            this.model.unsetLocalAsModerator();
        }
    }

    setRoomUnlocked() {
        this.roomLocked = false;
    }

    setRoomLocked() {
        this.roomLocked = true;
    }

    /**
     * Updates the room invite url.
     */
    updateInviteUrl (newInviteUrl) {
        this.inviteUrl = newInviteUrl;

        // If the invite dialog has been already opened we update the
        // information.
        let inviteLink = document.getElementById('inviteLinkRef');
        if (inviteLink) {
            inviteLink.value = this.inviteUrl;
            inviteLink.select();
            $('#inviteLinkRef').parent()
                .find('button[value=true]').prop('disabled', false);
        }
    }
}

const InviteModule = new Invite();
export default InviteModule;
