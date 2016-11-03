/* global APP */

import UIEvents from '../../../../service/UI/UIEvents';
import ContactListView from './ContactListView';
import Contact from './Contact';

/**
 * Model for the Contact list.
 *
 * @class ContactList
 */
class ContactList {
    constructor(conference) {
        this.conference = conference;
        this.contacts = [];
        this.roomLocked = false;
        //setup ContactList Model into ContactList View
        ContactListView.setup(this);
    }

    /**
     * Is locked flag.
     * Delegates to Invite module
     * TO FIX: find a better way to access the IS LOCKED state of the invite.
     *
     * @returns {Boolean}
     */
    isLocked() {
        return APP.conference.invite.isLocked();
    }

    /**
     * Adding new participant.
     *
     * @param id
     * @param isLocal
     */
    addContact(id, isLocal) {
        let isExist = this.contacts.some((el) => el.id === id);

        if (!isExist) {
            let newContact = new Contact({ id, isLocal });
            this.contacts.push(newContact);
            APP.UI.emitEvent(UIEvents.CONTACT_ADDED, { id, isLocal });
        }
    }

    /**
     * Removing participant.
     *
     * @param id
     * @returns {Array|*}
     */
    removeContact(id) {
        this.contacts = this.contacts.filter((el) => el.id !== id);
        APP.UI.emitEvent(UIEvents.CONTACT_REMOVED, { id });
        return this.contacts;
    }

    /**
     * Changing the display name.
     *
     * @param id
     * @param name
     */
    onDisplayNameChange (id, name) {
        if(!name)
            return;
        if (id === 'localVideoContainer') {
            id = APP.conference.getMyUserId();
        }

        let contacts = this.contacts.filter((el) => el.id === id);
        contacts.forEach((el) => {
            el.name = name;
        });
        APP.UI.emitEvent(UIEvents.DISPLAY_NAME_CHANGED, { id, name });
    }

    /**
     * Changing the avatar.
     *
     * @param id
     * @param avatar
     */
    changeUserAvatar (id, avatar) {
        let contacts = this.contacts.filter((el) => el.id === id);
        contacts.forEach((el) => {
            el.avatar = avatar;
        });
        APP.UI.emitEvent(UIEvents.USER_AVATAR_CHANGED, { id, avatar });
    }
}

export default ContactList;