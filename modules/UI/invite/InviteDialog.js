/* global */

/**
 * Class representing custom dialog
 * for invitation of participants
 * @class InviteDialog
 */
export default class InviteDialog {
    constructor(options) {
        this.views = [];
        this.roomLocked = false;
        this.password = options.password;
        this.inviteUrl = options.inviteUrl || null;
        this.isModerator = options.isModerator || false;
    }

    addView(view) {
        this.views.push(view);
    }

    removeView(view) {
        this.views = this.views.filter(el => el !== view);
    }

    setRoomLocked(password) {
        this.roomLocked = true;
        this.password = password;
        this.updateViews();
    }

    updateViews() {
        this.views.forEach(view => {
            view.updateView();
        });
    }

    setRoomUnlocked() {
        this.roomLocked = false;
        this.password = null;
        this.updateViews();
    }

    setLocalAsModerator() {
        this.isModerator = true;
        this.updateViews();
    }

    unsetLocalAsModerator() {
        this.isModerator = false;
        this.updateViews();
    }

    getEncodedInviteUrl() {
        return encodeURI(this.inviteUrl);
    }

    removePassword() {
        this.password = null;
        this.updateViews();
    }

    updateInviteUrl(newInviteUrl) {
        this.inviteUrl = newInviteUrl;
    }
}