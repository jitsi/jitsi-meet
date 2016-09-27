/* global $, APP, interfaceConfig */
import Avatar from '../../avatar/Avatar';
import UIEvents from '../../../../service/UI/UIEvents';
import UIUtil from '../../util/UIUtil';

let numberOfContacts = 0;
let notificationInterval;

/**
 * Updates the number of participants in the contact list button and sets
 * the glow
 * @param delta indicates whether a new user has joined (1) or someone has
 * left(-1)
 */
function updateNumberOfParticipants(delta) {
    numberOfContacts += delta;

    if (numberOfContacts <= 0) {
        console.error("Invalid number of participants: " + numberOfContacts);
        return;
    }

    $("#numberOfParticipants").text(numberOfContacts);

    $("#contacts_container>div.title").text(
        APP.translation.translateString("contactlist")
            + ' (' + numberOfContacts + ')');
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
        p.innerHTML = APP.translation.translateString(key);
    }

    return p;
}

function getContactEl (id) {
    return $(`#contacts>li[id="${id}"]`);
}

function contactElExists (id) {
    return getContactEl(id).length > 0;
}

/**
 * Contact list.
 */
var ContactList = {
    init (emitter) {
        this.emitter = emitter;
        this.addInviteButton();
    },
    /**
     * Adds layout for invite button
     */
    addInviteButton() {
        let container = document.getElementById('contacts_container');
        let title = container.firstElementChild;
        let htmlLayout = this.getInviteButtonLayout();
        title.insertAdjacentHTML('afterend', htmlLayout);
    },
    /**
     *
     */
    getInviteButtonLayout() {
        let classes = 'button-control button-control_primary';
        classes += ' button-control_full-width';
        return (
            `<div class="input-control">
                <div class="input-control__container">
                    <button id="addParticipantsBtn" class="${classes}">
                        Add Participants
                    </button>
                </div>
            </div>`);
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
     * Adds a contact for the given id.
     * @param isLocal is an id for the local user.
     */
    addContact (id, isLocal) {
        let contactlist = $('#contacts');

        let newContact = document.createElement('li');
        newContact.id = id;
        newContact.className = "clickable";
        newContact.onclick = (event) => {
            if (event.currentTarget.className === "clickable") {
                this.emitter.emit(UIEvents.CONTACT_CLICKED, id);
            }
        };

        if (interfaceConfig.SHOW_CONTACTLIST_AVATARS)
            newContact.appendChild(createAvatar(id));

        newContact.appendChild(
            createDisplayNameParagraph(
                isLocal ? interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME : null,
                isLocal ? null : interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME));

        if (APP.conference.isLocalId(id)) {
            contactlist.prepend(newContact);
        } else {
            contactlist.append(newContact);
        }
        updateNumberOfParticipants(1);
    },

    /**
     * Removes a contact for the given id.
     *
     */
    removeContact (id) {
        let contact = getContactEl(id);

        if (contact.length > 0) {
            contact.remove();
            updateNumberOfParticipants(-1);
        }
    },

    setClickable (id, isClickable) {
        getContactEl(id).toggleClass('clickable', isClickable);
    },

    onDisplayNameChange (id, displayName) {
        if(!displayName)
            return;
        if (id === 'localVideoContainer') {
            id = APP.conference.getMyUserId();
        }
        let contactName = $(`#contacts #${id}>p`);

        if (contactName.text() !== displayName) {
            contactName.text(displayName);
        }
    },

    changeUserAvatar (id, avatarUrl) {
        // set the avatar in the contact list
        let contact = $(`#${id}>img`);
        if (contact.length > 0) {
            contact.attr('src', avatarUrl);
        }
    }
};

export default ContactList;
