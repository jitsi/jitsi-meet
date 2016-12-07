/* global $, APP, interfaceConfig */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import Avatar from '../../avatar/Avatar';
import UIEvents from '../../../../service/UI/UIEvents';
import UIUtil from '../../util/UIUtil';

let numberOfContacts = 0;
const sidePanelsContainerId = 'sideToolbarContainer';
const htmlStr = `
    <div id="contacts_container" class="sideToolbarContainer__inner">
        <div class="title" data-i18n="contactlist"
            data-i18n-options='{"pcount":"1"}'></div>
        <ul id="contacts"></ul>
    </div>`;

function initHTML() {
    $(`#${sidePanelsContainerId}`)
        .append(htmlStr);
}

/**
 * Updates the number of participants in the contact list button and sets
 * the glow
 * @param delta indicates whether a new user has joined (1) or someone has
 * left(-1)
 */
function updateNumberOfParticipants(delta) {
    numberOfContacts += delta;

    if (numberOfContacts <= 0) {
        logger.error("Invalid number of participants: " + numberOfContacts);
        return;
    }

    $("#numberOfParticipants").text(numberOfContacts);

    APP.translation.translateElement(
        $("#contacts_container>div.title"), {pcount: numberOfContacts});
}

/**
 * Creates the avatar element.
 *
 * @return {object} the newly created avatar element
 */
function createAvatar(jid) {
    let avatar = document.createElement('img');
    avatar.className = "icon-avatar avatar";
    avatar.src = Avatar.getAvatarUrl(jid);

    return avatar;
}

/**
 * Creates the display name paragraph.
 *
 * @param displayName the display name to set
 */
function createDisplayNameParagraph(key, displayName) {
    let p = document.createElement('p');
    if (displayName) {
        p.innerHTML = displayName;
    } else if(key) {
        p.setAttribute("data-i18n",key);
    }

    return p;
}

/**
 * Getter for current contact element
 * @param id
 * @returns {JQuery}
 */
function getContactEl (id) {
    return $(`#contacts>li[id="${id}"]`);
}

/**
 * Contact list.
 */
var ContactListView = {
    init () {
        initHTML();
        this.lockKey = 'roomLocked';
        this.unlockKey = 'roomUnlocked';
    },

    /**
     * setup ContactList Model into ContactList View
     *
     * @param model
     */
    setup (model) {
        this.model = model;
        this.addInviteButton();
        this.registerListeners();
        this.toggleLock();
    },
    /**
     * Adds layout for invite button
     */
    addInviteButton() {
        let container = document.getElementById('contacts_container');

        container.firstElementChild // this is the title
            .insertAdjacentHTML('afterend', this.getInviteButtonLayout());

        APP.translation.translateElement($(container));
        $(document).on('click', '#addParticipantsBtn', () => {
            APP.UI.emitEvent(UIEvents.INVITE_CLICKED);
        });
    },
    /**
     *  Returns layout for invite button
     */
    getInviteButtonLayout() {
        let classes = 'button-control button-control_primary';
        classes += ' button-control_full-width';
        let key = 'addParticipants';

        let lockedHtml = this.getLockDescriptionLayout(this.lockKey);
        let unlockedHtml = this.getLockDescriptionLayout(this.unlockKey);

        return (
            `<div class="sideToolbarBlock first">
                <button id="addParticipantsBtn" 
                         data-i18n="${key}" 
                         class="${classes}"></button>
                <div>
                    ${lockedHtml}
                    ${unlockedHtml}
                </div>
            </div>`);
    },
    /**
     * Adds layout for lock description
     */
    getLockDescriptionLayout(key) {
        let classes = "form-control__hint form-control_full-width";
        let padlockSuffix = '';
        if (key === this.lockKey) {
            padlockSuffix = '-locked';
        }

        return `<p id="contactList${key}" class="${classes}">
                    <span class="icon-security${padlockSuffix}"></span>
                    <span data-i18n="${key}"></span>
                </p>`;
    },
    /**
     * Setup listeners
     */
    registerListeners() {
        let removeContact = this.onRemoveContact.bind(this);
        let changeAvatar = this.changeUserAvatar.bind(this);
        let displayNameChange = this.onDisplayNameChange.bind(this);

        APP.UI.addListener( UIEvents.TOGGLE_ROOM_LOCK,
                            this.toggleLock.bind(this));
        APP.UI.addListener( UIEvents.CONTACT_ADDED,
                            this.onAddContact.bind(this));

        APP.UI.addListener(UIEvents.CONTACT_REMOVED, removeContact);
        APP.UI.addListener(UIEvents.USER_AVATAR_CHANGED, changeAvatar);
        APP.UI.addListener(UIEvents.DISPLAY_NAME_CHANGED, displayNameChange);
    },
    /**
     * Updating the view according the model
     * @param type {String} type of change
     * @returns {Promise}
     */
    toggleLock() {
        let isLocked = this.model.isLocked();
        let showKey = isLocked ? this.lockKey : this.unlockKey;
        let hideKey = !isLocked ? this.lockKey : this.unlockKey;
        let showId = `contactList${showKey}`;
        let hideId = `contactList${hideKey}`;

        $(`#${showId}`).show();
        $(`#${hideId}`).hide();
    },
    /**
     * Indicates if the chat is currently visible.
     *
     * @return <tt>true</tt> if the chat is currently visible, <tt>false</tt> -
     * otherwise
     */
    isVisible () {
        return UIUtil.isVisible(document.getElementById("contactlist"));
    },

    /**
     * Handler for Adding a contact for the given id.
     * @param isLocal is an id for the local user.
     */
    onAddContact (data) {
        let { id, isLocal } = data;
        let contactlist = $('#contacts');
        let newContact = document.createElement('li');
        newContact.id = id;
        newContact.className = "clickable";
        newContact.onclick = (event) => {
            if (event.currentTarget.className === "clickable") {
                APP.UI.emitEvent(UIEvents.CONTACT_CLICKED, id);
            }
        };

        if (interfaceConfig.SHOW_CONTACTLIST_AVATARS)
            newContact.appendChild(createAvatar(id));

        newContact.appendChild(
            createDisplayNameParagraph(
                isLocal ? interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME : null,
                isLocal ? null : interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME));
        APP.translation.translateElement($(newContact));

        if (APP.conference.isLocalId(id)) {
            contactlist.prepend(newContact);
        } else {
            contactlist.append(newContact);
        }
        updateNumberOfParticipants(1);
    },

    /**
     * Handler for removing
     * a contact for the given id.
     */
    onRemoveContact (data) {
        let { id } = data;
        let contact = getContactEl(id);

        if (contact.length > 0) {
            contact.remove();
            updateNumberOfParticipants(-1);
        }
    },

    setClickable (id, isClickable) {
        getContactEl(id).toggleClass('clickable', isClickable);
    },

    /**
     * Changes display name of the user
     * defined by its id
     * @param data
     */
    onDisplayNameChange (data) {
        let { id, name } = data;
        if(!name)
            return;
        if (id === 'localVideoContainer') {
            id = APP.conference.getMyUserId();
        }
        let contactName = $(`#contacts #${id}>p`);

        if (contactName.text() !== name) {
            contactName.text(name);
        }
    },

    /**
     * Changes user avatar
     * @param data
     */
    changeUserAvatar (data) {
        let { id, avatar } = data;
        // set the avatar in the contact list
        let contact = $(`#${id}>img`);
        if (contact.length > 0) {
            contact.attr('src', avatar);
        }
    }
};

export default ContactListView;