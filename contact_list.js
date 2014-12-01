/**
 * Contact list.
 */
var ContactList = (function (my) {

    var numberOfContacts = 0;
    var notificationInterval;

    /**
     * Indicates if the chat is currently visible.
     *
     * @return <tt>true</tt> if the chat is currently visible, <tt>false</tt> -
     * otherwise
     */
    my.isVisible = function () {
        return $('#contactlist').is(":visible");
    };

    /**
     * Adds a contact for the given peerJid if such doesn't yet exist.
     *
     * @param peerJid the peerJid corresponding to the contact
     * @param id the user's email or userId used to get the user's avatar
     */
    my.ensureAddContact = function(peerJid, id) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (!contact || contact.length <= 0)
            ContactList.addContact(peerJid,id);
    };

    /**
     * Adds a contact for the given peer jid.
     *
     * @param peerJid the jid of the contact to add
     * @param id the email or userId of the user
     */
    my.addContact = function(peerJid, id) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactlist = $('#contactlist>ul');

        var newContact = document.createElement('li');
        // XXX(gp) contact click event handling is now in videolayout.js. Is the
        // following statement (newContact.id = resourceJid) still relevant?
        newContact.id = resourceJid;
        newContact.className = "clickable";
        newContact.onclick = function(event) {
            if(event.currentTarget.className === "clickable") {
                $(ContactList).trigger('contactclicked', [peerJid]);
            }
        };

        newContact.appendChild(createAvatar(id));
        newContact.appendChild(createDisplayNameParagraph("Participant"));

        var clElement = contactlist.get(0);

        if (resourceJid === Strophe.getResourceFromJid(connection.emuc.myroomjid)
            && $('#contactlist>ul .title')[0].nextSibling.nextSibling)
        {
            clElement.insertBefore(newContact,
                    $('#contactlist>ul .title')[0].nextSibling.nextSibling);
        }
        else {
            clElement.appendChild(newContact);
        }
        updateNumberOfParticipants(1);
    };

    /**
     * Removes a contact for the given peer jid.
     *
     * @param peerJid the peerJid corresponding to the contact to remove
     */
    my.removeContact = function(peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (contact && contact.length > 0) {
            var contactlist = $('#contactlist>ul');

            contactlist.get(0).removeChild(contact.get(0));

            updateNumberOfParticipants(-1);
        }
    };

    my.setVisualNotification = function(show, stopGlowingIn) {
        var glower = $('#contactListButton');
        function stopGlowing() {
            window.clearInterval(notificationInterval);
            notificationInterval = false;
            glower.removeClass('glowing');
            if(!ContactList.isVisible()) {
                glower.removeClass('active');
            }
        }

        if (show && !notificationInterval) {
            notificationInterval = window.setInterval(function () {
                glower.toggleClass('active glowing');
            }, 800);
        }
        else if (!show && notificationInterval) {
            stopGlowing();
        }
        if(stopGlowingIn) {
            setTimeout(stopGlowing, stopGlowingIn);
        }
    };

    /**
     * Updates the number of participants in the contact list button and sets
     * the glow
     * @param delta indicates whether a new user has joined (1) or someone has
     * left(-1)
     */
    function updateNumberOfParticipants(delta) {
        //when the user is alone we don't show the number of participants
        if(numberOfContacts === 0) {
            $("#numberOfParticipants").text('');
            numberOfContacts += delta;
        } else if(numberOfContacts !== 0 && !ContactList.isVisible()) {
            ContactList.setVisualNotification(true);
            numberOfContacts += delta;
            $("#numberOfParticipants").text(numberOfContacts);
        }
    }

    /**
     * Creates the avatar element.
     * 
     * @return the newly created avatar element
     */
    function createAvatar(id) {
        var avatar = document.createElement('img');
        avatar.className = "icon-avatar avatar";
        avatar.src = "https://www.gravatar.com/avatar/" + id + "?d=retro&size=30";

        return avatar;
    }

    /**
     * Creates the display name paragraph.
     *
     * @param displayName the display name to set
     */
    function createDisplayNameParagraph(displayName) {
        var p = document.createElement('p');
        p.innerText = displayName;

        return p;
    }


    /**
     * Indicates that the display name has changed.
     */
    $(document).bind(   'displaynamechanged',
                        function (event, peerJid, displayName) {
        if (peerJid === 'localVideoContainer')
            peerJid = connection.emuc.myroomjid;

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactName = $('#contactlist #' + resourceJid + '>p');

        if (contactName && displayName && displayName.length > 0)
            contactName.text(displayName);
    });

    my.setClickable = function(resourceJid, isClickable) {
        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');
        if(isClickable) {
            contact.addClass('clickable');
        } else {
            contact.removeClass('clickable');
        }
    };

    return my;
}(ContactList || {}));
