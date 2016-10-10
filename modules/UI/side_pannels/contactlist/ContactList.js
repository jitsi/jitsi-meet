/* global APP */

import UIEvents from '../../../../service/UI/UIEvents';
import ContactListView from './ContactListView';
import Contact from './Contact';

/**
 * Model for Contact list
 * @class ContactList
 */
class ContactList {
    constructor(conference) {
        this.conference = conference;
        this.contacts = [];
        this.roomLocked = false;
        ContactListView.init(this);
    }

    isLocked() {
        return APP.UI.Invite.isLocked();
    }

    /**
     * Wrapper on emit method
     * @param type
     * @param data
     */
    publish(type, data) {
        APP.UI.emitEvent(type, data);
    }

    /**
     * Wrapper on addListener
     * @param type
     * @param handler
     */
    subscribe(type, handler) {
        APP.UI.addListener(type, handler);
    }

    /**
     * Adding new participant
     * @param id
     * @param isLocal
     */
    addContact(id, isLocal) {
        let isExist = this.contacts.some((el) => el.id === id);

        if (!isExist) {
            let newContact = new Contact({ id, isLocal });
            this.contacts.push(newContact);
            this.publish(UIEvents.ADD_CONTACT, { id, isLocal });
        }
    }

    /**
     * Removing participant
     * @param id
     * @returns {Array|*}
     */
    removeContact(id) {
        this.contacts = this.contacts.filter((el) => el.id !== id);
        this.publish(UIEvents.REMOVE_CONTACT, { id });
        return this.contacts;
    }

    /**
     * Changing the display name
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
        this.publish(UIEvents.DISPLAY_NAME_CHANGED, { id, name });
    }

    /**
     * Changing the avatar
     * @param id
     * @param avatar
     */
    changeUserAvatar (id, avatar) {
        let contacts = this.contacts.filter((el) => el.id === id);
        contacts.forEach((el) => {
            el.avatar = avatar;
        });
        this.publish(UIEvents.CHANGE_USER_AVATAR, { id, avatar });
    }
}

export default ContactList;