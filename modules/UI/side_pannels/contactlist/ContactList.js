/* global $, APP */
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

    let buttonIndicatorText = (numberOfContacts === 1) ? '' : numberOfContacts;
    $("#numberOfParticipants").text(buttonIndicatorText);

    let showVisualNotification
        = (numberOfContacts === 1) ? false : !ContactList.isVisible();
    ContactList.setVisualNotification(showVisualNotification);

    $("#contactlist>div.title").text(
        APP.translation.translateString(
            "contactlist", {participants: numberOfContacts}
        ));
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


function stopGlowing(glower) {
    window.clearInterval(notificationInterval);
    notificationInterval = false;
    glower.removeClass('glowing');
    if (!ContactList.isVisible()) {
        glower.removeClass('active');
    }
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
     *
     */
    addContact (id) {
        let contactlist = $('#contacts');

        let newContact = document.createElement('li');
        newContact.id = id;
        newContact.className = "clickable";
        newContact.onclick = (event) => {
            if (event.currentTarget.className === "clickable") {
                this.emitter.emit(UIEvents.CONTACT_CLICKED, id);
            }
        };

        newContact.appendChild(createAvatar(id));
        newContact.appendChild(createDisplayNameParagraph("participant"));

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

    setVisualNotification (show, stopGlowingIn) {
        let glower = $('#contactListButton');

        if (show && !notificationInterval) {
            notificationInterval = window.setInterval(function () {
                glower.toggleClass('active glowing');
            }, 800);
        } else if (!show && notificationInterval) {
            stopGlowing(glower);
        }
        if (stopGlowingIn) {
            setTimeout(function () {
                stopGlowing(glower);
            }, stopGlowingIn);
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
