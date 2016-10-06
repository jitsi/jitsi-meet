/* global */

/**
 * Class representing custom dialog
 * for invitation of participants
 * @class InviteDialog
 */
export default class InviteDialog {
    constructor(options) {
        this.password = options.password;
        this.inviteUrl = options.inviteUrl || null;
        this.isModerator = options.isModerator || false;
    }

    setupListeners() {

    }

    setLocalAsModerator() {
        this.isModerator = true;
    }

    unsetLocalAsModerator() {
        this.isModerator = false;
    }

    getEncodedInviteUrl() {
        return encodeURI(this.inviteUrl);
    }

    removePassword() {
        this.password = null;
    }
}