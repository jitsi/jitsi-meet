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
     */
    my.ensureAddContact = function(peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (!contact || contact.length <= 0)
            ContactList.addContact(peerJid);
    };

    /**
     * Adds a contact for the given peer jid.
     *
     * @param peerJid the jid of the contact to add
     */
    my.addContact = function(peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactlist = $('#contactlist>ul');

        var newContact = document.createElement('li');
        newContact.id = resourceJid;
        newContact.className = "clickable";
        newContact.onclick = function(event) {
            if(event.currentTarget.className === "clickable") {
                var jid = event.currentTarget.id;
                var videoContainer = $("#participant_" + jid);
                if (videoContainer.length > 0) {
                    videoContainer.click();
                } else if (jid == Strophe.getResourceFromJid(connection.emuc.myroomjid)) {
                    $("#localVideoContainer").click();
                }
            }
        };

        newContact.appendChild(createAvatar());
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

    /**
     * Opens / closes the contact list area.
     */
    my.toggleContactList = function () {
        var contactlist = $('#contactlist');
        var videospace = $('#videospace');

        var chatSize = (ContactList.isVisible()) ? [0, 0] : Chat.getChatSize();
        var videospaceWidth = window.innerWidth - chatSize[0];
        var videospaceHeight = window.innerHeight;
        var videoSize
            = getVideoSize(null, null, videospaceWidth, videospaceHeight);
        var videoWidth = videoSize[0];
        var videoHeight = videoSize[1];
        var videoPosition = getVideoPosition(videoWidth,
                                             videoHeight,
                                             videospaceWidth,
                                             videospaceHeight);
        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videospaceWidth);
        var thumbnailsWidth = thumbnailSize[0];
        var thumbnailsHeight = thumbnailSize[1];
        var completeFunction = ContactList.isVisible() ?
            function() {} : function () { contactlist.trigger('shown');};

        videospace.animate({right: chatSize[0],
                            width: videospaceWidth,
                            height: videospaceHeight},
                            {queue: false,
                            duration: 500,
                            complete: completeFunction
                            });

        $('#remoteVideos').animate({height: thumbnailsHeight},
                                    {queue: false,
                                    duration: 500});

        $('#remoteVideos>span').animate({height: thumbnailsHeight,
                                        width: thumbnailsWidth},
                                        {queue: false,
                                        duration: 500,
                                        complete: function() {
                                            $(document).trigger(
                                                    "remotevideo.resized",
                                                    [thumbnailsWidth,
                                                     thumbnailsHeight]);
                                        }});

        $('#largeVideoContainer').animate({ width: videospaceWidth,
                                            height: videospaceHeight},
                                            {queue: false,
                                             duration: 500
                                            });

        $('#largeVideo').animate({  width: videoWidth,
                                    height: videoHeight,
                                    top: verticalIndent,
                                    bottom: verticalIndent,
                                    left: horizontalIndent,
                                    right: horizontalIndent},
                                    {   queue: false,
                                        duration: 500
                                    });

        if (ContactList.isVisible()) {
            $("#toast-container").animate({right: '12px'},
                {queue: false,
                    duration: 500});
            $('#contactlist').hide("slide", { direction: "right",
                                            queue: false,
                                            duration: 500});
        } else {
            // Undock the toolbar when the chat is shown and if we're in a 
            // video mode.
            if (VideoLayout.isLargeVideoVisible())
                ToolbarToggler.dockToolbar(false);


            $("#toast-container").animate({right: '212px'},
                {queue: false,
                    duration: 500});
            $('#contactlist').show("slide", { direction: "right",
                                            queue: false,
                                            duration: 500});

            //stop the glowing of the contact list icon
            setVisualNotification(false);
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
            setVisualNotification(true);
            numberOfContacts += delta;
            $("#numberOfParticipants").text(numberOfContacts);
        }
    };

    /**
     * Creates the avatar element.
     * 
     * @return the newly created avatar element
     */
    function createAvatar() {
        var avatar = document.createElement('i');
        avatar.className = "icon-avatar avatar";

        return avatar;
    }

    /**
     * Creates the display name paragraph.
     *
     * @param displayName the display name to set
     */
    function createDisplayNameParagraph(displayName) {
        var p = document.createElement('p');
        p.innerHTML = displayName;

        return p;
    }

    /**
     * Shows/hides a visual notification, indicating that a new user has joined
     * the conference.
     */
    function setVisualNotification(show, stopGlowingIn) {
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
            contactName.html(displayName);
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
