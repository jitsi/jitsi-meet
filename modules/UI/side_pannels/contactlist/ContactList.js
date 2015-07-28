/* global $, APP, Strophe */
var Avatar = require('../../avatar/Avatar');

var numberOfContacts = 0;
var notificationInterval;

/**
 * Updates the number of participants in the contact list button and sets
 * the glow
 * @param delta indicates whether a new user has joined (1) or someone has
 * left(-1)
 */
function updateNumberOfParticipants(delta) {
    numberOfContacts += delta;
    if (numberOfContacts === 1) {
        // when the user is alone we don't show the number of participants
        $("#numberOfParticipants").text('');
        ContactList.setVisualNotification(false);
    } else if (numberOfContacts > 1) {
        ContactList.setVisualNotification(!ContactList.isVisible());
        $("#numberOfParticipants").text(numberOfContacts);
    } else {
        console.error("Invalid number of participants: " + numberOfContacts);
    }
}

/**
 * Creates the avatar element.
 *
 * @return {object} the newly created avatar element
 */
function createAvatar(jid) {
    var avatar = document.createElement('img');
    avatar.className = "icon-avatar avatar";
    avatar.src = Avatar.getContactListUrl(jid);

    return avatar;
}

/**
 * Creates the display name paragraph.
 *
 * @param displayName the display name to set
 */
function createDisplayNameParagraph(key, displayName) {
    var p = document.createElement('p');
    if(displayName)
        p.innerText = displayName;
    else if(key) {
        p.setAttribute("data-i18n",key);
        p.innerText = APP.translation.translateString(key);
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

/**
 * Contact list.
 */
var ContactList = {
    /**
     * Indicates if the chat is currently visible.
     *
     * @return <tt>true</tt> if the chat is currently visible, <tt>false</tt> -
     * otherwise
     */
    isVisible: function () {
        return $('#contactlist').is(":visible");
    },

    /**
     * Adds a contact for the given peerJid if such doesn't yet exist.
     *
     * @param peerJid the peerJid corresponding to the contact
     */
    ensureAddContact: function (peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contacts>li[id="' + resourceJid + '"]');

        if (!contact || contact.length <= 0)
            ContactList.addContact(peerJid);
    },

    /**
     * Adds a contact for the given peer jid.
     *
     * @param peerJid the jid of the contact to add
     */
    addContact: function (peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactlist = $('#contacts');

        var newContact = document.createElement('li');
        newContact.id = resourceJid;
        newContact.className = "clickable";
        newContact.onclick = function (event) {
            if (event.currentTarget.className === "clickable") {
                $(ContactList).trigger('contactclicked', [peerJid]);
            }
        };

        newContact.appendChild(createAvatar(peerJid));
        newContact.appendChild(createDisplayNameParagraph("participant"));

        if (resourceJid === APP.xmpp.myResource()) {
            contactlist.prepend(newContact);
        }
        else {
            contactlist.append(newContact);
        }
        updateNumberOfParticipants(1);
    },

    /**
     * Removes a contact for the given peer jid.
     *
     * @param peerJid the peerJid corresponding to the contact to remove
     */
    removeContact: function (peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contacts>li[id="' + resourceJid + '"]');

        if (contact && contact.length > 0) {
            var contactlist = $('#contactlist>ul');

            contactlist.get(0).removeChild(contact.get(0));

            updateNumberOfParticipants(-1);
        }
    },

    setVisualNotification: function (show, stopGlowingIn) {
        var glower = $('#contactListButton');

        if (show && !notificationInterval) {
            notificationInterval = window.setInterval(function () {
                glower.toggleClass('active glowing');
            }, 800);
        }
        else if (!show && notificationInterval) {
            stopGlowing(glower);
        }
        if (stopGlowingIn) {
            setTimeout(function () {
                stopGlowing(glower);
            }, stopGlowingIn);
        }
    },

    setClickable: function (resourceJid, isClickable) {
        var contact = $('#contacts>li[id="' + resourceJid + '"]');
        if (isClickable) {
            contact.addClass('clickable');
        } else {
            contact.removeClass('clickable');
        }
    },

    onDisplayNameChange: function (peerJid, displayName) {
        if (peerJid === 'localVideoContainer')
            peerJid = APP.xmpp.myJid();

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactName = $('#contacts #' + resourceJid + '>p');

        if (contactName && displayName && displayName.length > 0)
            contactName.html(displayName);
    },

    userAvatarChanged: function (resourceJid, contactListUrl) {
        // set the avatar in the contact list
        var contact = $('#' + resourceJid + '>img');
        if (contact && contact.length > 0) {
            contact.get(0).src = contactListUrl;
        }

    }
};

module.exports = ContactList;