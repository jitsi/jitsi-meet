/* global Strophe, $, $pres, $iq, $msg */
/* jshint -W101,-W069 */
var logger = require("jitsi-meet-logger").getLogger(__filename);
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Moderator = require("./moderator");
var EventEmitter = require("events");
var Recorder = require("./recording");
var JIBRI_XMLNS = 'http://jitsi.org/protocol/jibri';

var parser = {
    packet2JSON: function (packet, nodes) {
        var self = this;
        $(packet).children().each(function (index) {
            var tagName = $(this).prop("tagName");
            var node = {
                tagName: tagName
            };
            node.attributes = {};
            $($(this)[0].attributes).each(function( index, attr ) {
                node.attributes[ attr.name ] = attr.value;
            });
            var text = Strophe.getText($(this)[0]);
            if (text) {
                node.value = text;
            }
            node.children = [];
            nodes.push(node);
            self.packet2JSON($(this), node.children);
        });
    },
    JSON2packet: function (nodes, packet) {
        for(var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if(!node || node === null){
                continue;
            }
            packet.c(node.tagName, node.attributes);
            if(node.value)
                packet.t(node.value);
            if(node.children)
                this.JSON2packet(node.children, packet);
            packet.up();
        }
        // packet.up();
    }
};

/**
 * Returns array of JS objects from the presence JSON associated with the passed nodeName
 * @param pres the presence JSON
 * @param nodeName the name of the node (videomuted, audiomuted, etc)
 */
function filterNodeFromPresenceJSON(pres, nodeName){
    var res = [];
    for(var i = 0; i < pres.length; i++)
        if(pres[i].tagName === nodeName)
            res.push(pres[i]);

    return res;
}

function ChatRoom(connection, jid, password, XMPP, options) {
    this.eventEmitter = new EventEmitter();
    this.xmpp = XMPP;
    this.connection = connection;
    this.roomjid = Strophe.getBareJidFromJid(jid);
    this.myroomjid = jid;
    this.password = password;
    logger.info("Joined MUC as " + this.myroomjid);
    this.members = {};
    this.presMap = {};
    this.presHandlers = {};
    this.joined = false;
    this.role = 'none';
    this.focusMucJid = null;
    this.bridgeIsDown = false;
    this.options = options || {};
    this.moderator = new Moderator(this.roomjid, this.xmpp, this.eventEmitter);
    this.initPresenceMap();
    this.session = null;
    var self = this;
    this.lastPresences = {};
    this.phoneNumber = null;
    this.phonePin = null;
}

ChatRoom.prototype.initPresenceMap = function () {
    this.presMap['to'] = this.myroomjid;
    this.presMap['xns'] = 'http://jabber.org/protocol/muc';
    this.presMap["nodes"] = [];
    this.presMap["nodes"].push( {
        "tagName": "user-agent",
        "value": navigator.userAgent,
        "attributes": {xmlns: 'http://jitsi.org/jitmeet/user-agent'}
    });

};

ChatRoom.prototype.updateDeviceAvailability = function (devices) {
    this.presMap["nodes"].push( {
        "tagName": "devices",
        "children": [
            {
                "tagName": "audio",
                "value": devices.audio,
            },
            {
                "tagName": "video",
                "value": devices.video,
            }
        ]
    });
};

ChatRoom.prototype.join = function (password) {
    if(password)
        this.password = password;
    var self = this;
    this.moderator.allocateConferenceFocus(function()
    {
        self.sendPresence(true);
    }.bind(this));
};

ChatRoom.prototype.sendPresence = function (fromJoin) {
    if (!this.presMap['to'] || (!this.joined && !fromJoin)) {
        // Too early to send presence - not initialized
        return;
    }

    var pres = $pres({to: this.presMap['to'] });
    pres.c('x', {xmlns: this.presMap['xns']});

    if (this.password) {
        pres.c('password').t(this.password).up();
    }

    pres.up();

    // Send XEP-0115 'c' stanza that contains our capabilities info
    if (this.connection.caps) {
        this.connection.caps.node = this.xmpp.options.clientNode;
        pres.c('c', this.connection.caps.generateCapsAttrs()).up();
    }

    parser.JSON2packet(this.presMap.nodes, pres);
    this.connection.send(pres);
};


ChatRoom.prototype.doLeave = function () {
    logger.log("do leave", this.myroomjid);
    var pres = $pres({to: this.myroomjid, type: 'unavailable' });
    this.presMap.length = 0;
    this.connection.send(pres);
};


ChatRoom.prototype.createNonAnonymousRoom = function () {
    // http://xmpp.org/extensions/xep-0045.html#createroom-reserved

    var getForm = $iq({type: 'get', to: this.roomjid})
        .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'})
        .c('x', {xmlns: 'jabber:x:data', type: 'submit'});

    var self = this;

    this.connection.sendIQ(getForm, function (form) {

        if (!$(form).find(
                '>query>x[xmlns="jabber:x:data"]' +
                '>field[var="muc#roomconfig_whois"]').length) {

            logger.error('non-anonymous rooms not supported');
            return;
        }

        var formSubmit = $iq({to: this.roomjid, type: 'set'})
            .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});

        formSubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});

        formSubmit.c('field', {'var': 'FORM_TYPE'})
            .c('value')
            .t('http://jabber.org/protocol/muc#roomconfig').up().up();

        formSubmit.c('field', {'var': 'muc#roomconfig_whois'})
            .c('value').t('anyone').up().up();

        self.connection.sendIQ(formSubmit);

    }, function (error) {
        logger.error("Error getting room configuration form");
    });
};

ChatRoom.prototype.onPresence = function (pres) {
    var from = pres.getAttribute('from');
    // Parse roles.
    var member = {};
    member.show = $(pres).find('>show').text();
    member.status = $(pres).find('>status').text();
    var tmp = $(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>item');
    member.affiliation = tmp.attr('affiliation');
    member.role = tmp.attr('role');

    // Focus recognition
    member.jid = tmp.attr('jid');
    member.isFocus = false;
    if (member.jid
        && member.jid.indexOf(this.moderator.getFocusUserJid() + "/") === 0) {
        member.isFocus = true;
    }

    $(pres).find(">x").remove();
    var nodes = [];
    parser.packet2JSON(pres, nodes);
    this.lastPresences[from] = nodes;
    var jibri = null;
    for(var i = 0; i < nodes.length; i++)
    {
        var node = nodes[i];
        switch(node.tagName)
        {
            case "nick":
                member.nick = node.value;
                if(!member.isFocus) {
                    var displayName = !this.xmpp.options.displayJids
                        ? member.nick : Strophe.getResourceFromJid(from);

                    if (displayName && displayName.length > 0) {
                        this.eventEmitter.emit(XMPPEvents.DISPLAY_NAME_CHANGED, from, displayName);
                    }
                }
                break;
            case "userId":
                member.id = node.value;
                break;
            case "email":
                member.email = node.value;
                break;
            case "bridgeIsDown":
                if(!this.bridgeIsDown) {
                    this.bridgeIsDown = true;
                    this.eventEmitter.emit(XMPPEvents.BRIDGE_DOWN);
                }
                break;
            case "jibri-recording-status":
                var jibri = node;
                break;
            case "call-control":
                var att = node.attributes;
                if(!att)
                    break;
                this.phoneNumber = att.phone || null;
                this.phonePin = att.pin || null;
                this.eventEmitter.emit(XMPPEvents.PHONE_NUMBER_CHANGED);
                break;
            default :
                this.processNode(node, from);
        }

    }

    if (from == this.myroomjid) {
        if (member.affiliation == 'owner')

            if (this.role !== member.role) {
                this.role = member.role;

                this.eventEmitter.emit(XMPPEvents.LOCAL_ROLE_CHANGED, this.role);
            }
        if (!this.joined) {
            this.joined = true;
            console.log("(TIME) MUC joined:\t", window.performance.now());
            this.eventEmitter.emit(XMPPEvents.MUC_JOINED, from, member);
        }
    } else if (this.members[from] === undefined) {
        // new participant
        this.members[from] = member;
        logger.log('entered', from, member);
        if (member.isFocus) {
            this.focusMucJid = from;
            if(!this.recording) {
                this.recording = new Recorder(this.options.recordingType,
                    this.eventEmitter, this.connection, this.focusMucJid,
                    this.options.jirecon, this.roomjid);
                if(this.lastJibri)
                    this.recording.handleJibriPresence(this.lastJibri);
            }
            logger.info("Ignore focus: " + from + ", real JID: " + member.jid);
        }
        else {
            this.eventEmitter.emit(XMPPEvents.MUC_MEMBER_JOINED, from, member.id || member.email, member.nick);
        }
    } else {
        // Presence update for existing participant
        // Watch role change:
        if (this.members[from].role != member.role) {
            this.members[from].role = member.role;
            this.eventEmitter.emit(XMPPEvents.MUC_ROLE_CHANGED, from, member.role);
        }

        // store the new display name
        if(member.displayName)
            this.members[from].displayName = member.displayName;
    }



    if(!member.isFocus)
        this.eventEmitter.emit(XMPPEvents.USER_ID_CHANGED, from, member.id || member.email);

    // Trigger status message update
    if (member.status) {
        this.eventEmitter.emit(XMPPEvents.PRESENCE_STATUS, from, member);
    }

    if(jibri)
    {
        this.lastJibri = jibri;
        if(this.recording)
            this.recording.handleJibriPresence(jibri);
    }

};

ChatRoom.prototype.processNode = function (node, from) {
    if(this.presHandlers[node.tagName])
        this.presHandlers[node.tagName](node, Strophe.getResourceFromJid(from));
};

ChatRoom.prototype.sendMessage = function (body, nickname) {
    var msg = $msg({to: this.roomjid, type: 'groupchat'});
    msg.c('body', body).up();
    if (nickname) {
        msg.c('nick', {xmlns: 'http://jabber.org/protocol/nick'}).t(nickname).up().up();
    }
    this.connection.send(msg);
    this.eventEmitter.emit(XMPPEvents.SENDING_CHAT_MESSAGE, body);
};

ChatRoom.prototype.setSubject = function (subject) {
    var msg = $msg({to: this.roomjid, type: 'groupchat'});
    msg.c('subject', subject);
    this.connection.send(msg);
    logger.log("topic changed to " + subject);
};


ChatRoom.prototype.onParticipantLeft = function (jid) {

    delete this.lastPresences[jid];
    this.eventEmitter.emit(XMPPEvents.MUC_MEMBER_LEFT, jid);

    this.moderator.onMucMemberLeft(jid);
};

ChatRoom.prototype.onPresenceUnavailable = function (pres, from) {
    // room destroyed ?
    if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]' +
        '>destroy').length) {
        var reason;
        var reasonSelect = $(pres).find(
                '>x[xmlns="http://jabber.org/protocol/muc#user"]' +
                '>destroy>reason');
        if (reasonSelect.length) {
            reason = reasonSelect.text();
        }

        this.xmpp.leaveRoom(this.roomjid);

        this.eventEmitter.emit(XMPPEvents.MUC_DESTROYED, reason);
        delete this.connection.emuc.rooms[Strophe.getBareJidFromJid(from)];
        return true;
    }

    // Status code 110 indicates that this notification is "self-presence".
    if (!$(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="110"]').length) {
        delete this.members[from];
        this.onParticipantLeft(from);
    }
    // If the status code is 110 this means we're leaving and we would like
    // to remove everyone else from our view, so we trigger the event.
    else if (Object.keys(this.members).length > 1) {
        for (var i in this.members) {
            var member = this.members[i];
            delete this.members[i];
            this.onParticipantLeft(member);
        }
    }
    if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="307"]').length) {
        if (this.myroomjid === from) {
            this.xmpp.leaveRoom(this.roomjid);
            this.eventEmitter.emit(XMPPEvents.KICKED);
        }
    }
};

ChatRoom.prototype.onMessage = function (msg, from) {
    var nick =
        $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]')
            .text() ||
        Strophe.getResourceFromJid(from);

    var txt = $(msg).find('>body').text();
    var type = msg.getAttribute("type");
    if (type == "error") {
        this.eventEmitter.emit(XMPPEvents.CHAT_ERROR_RECEIVED,
            $(msg).find('>text').text(), txt);
        return true;
    }

    var subject = $(msg).find('>subject');
    if (subject.length) {
        var subjectText = subject.text();
        if (subjectText || subjectText === "") {
            this.eventEmitter.emit(XMPPEvents.SUBJECT_CHANGED, subjectText);
            logger.log("Subject is changed to " + subjectText);
        }
    }

    // xep-0203 delay
    var stamp = $(msg).find('>delay').attr('stamp');

    if (!stamp) {
        // or xep-0091 delay, UTC timestamp
        stamp = $(msg).find('>[xmlns="jabber:x:delay"]').attr('stamp');

        if (stamp) {
            // the format is CCYYMMDDThh:mm:ss
            var dateParts = stamp.match(/(\d{4})(\d{2})(\d{2}T\d{2}:\d{2}:\d{2})/);
            stamp = dateParts[1] + "-" + dateParts[2] + "-" + dateParts[3] + "Z";
        }
    }

    if (txt) {
        logger.log('chat', nick, txt);
        this.eventEmitter.emit(XMPPEvents.MESSAGE_RECEIVED,
            from, nick, txt, this.myroomjid, stamp);
    }
};

ChatRoom.prototype.onPresenceError = function (pres, from) {
    if ($(pres).find('>error[type="auth"]>not-authorized[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
        logger.log('on password required', from);
        this.eventEmitter.emit(XMPPEvents.PASSWORD_REQUIRED);
    } else if ($(pres).find(
        '>error[type="cancel"]>not-allowed[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
        var toDomain = Strophe.getDomainFromJid(pres.getAttribute('to'));
        if (toDomain === this.xmpp.options.hosts.anonymousdomain) {
            // enter the room by replying with 'not-authorized'. This would
            // result in reconnection from authorized domain.
            // We're either missing Jicofo/Prosody config for anonymous
            // domains or something is wrong.
            this.eventEmitter.emit(XMPPEvents.ROOM_JOIN_ERROR, pres);

        } else {
            logger.warn('onPresError ', pres);
            this.eventEmitter.emit(XMPPEvents.ROOM_CONNECT_ERROR, pres);
        }
    } else {
        logger.warn('onPresError ', pres);
        this.eventEmitter.emit(XMPPEvents.ROOM_CONNECT_ERROR, pres);
    }
};

ChatRoom.prototype.kick = function (jid) {
    var kickIQ = $iq({to: this.roomjid, type: 'set'})
        .c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'})
        .c('item', {nick: Strophe.getResourceFromJid(jid), role: 'none'})
        .c('reason').t('You have been kicked.').up().up().up();

    this.connection.sendIQ(
        kickIQ,
        function (result) {
            logger.log('Kick participant with jid: ', jid, result);
        },
        function (error) {
            logger.log('Kick participant error: ', error);
        });
};

ChatRoom.prototype.lockRoom = function (key, onSuccess, onError, onNotSupported) {
    //http://xmpp.org/extensions/xep-0045.html#roomconfig
    var ob = this;
    this.connection.sendIQ($iq({to: this.roomjid, type: 'get'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'}),
        function (res) {
            if ($(res).find('>query>x[xmlns="jabber:x:data"]>field[var="muc#roomconfig_roomsecret"]').length) {
                var formsubmit = $iq({to: ob.roomjid, type: 'set'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});
                formsubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});
                formsubmit.c('field', {'var': 'FORM_TYPE'}).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up();
                formsubmit.c('field', {'var': 'muc#roomconfig_roomsecret'}).c('value').t(key).up().up();
                // Fixes a bug in prosody 0.9.+ https://code.google.com/p/lxmppd/issues/detail?id=373
                formsubmit.c('field', {'var': 'muc#roomconfig_whois'}).c('value').t('anyone').up().up();
                // FIXME: is muc#roomconfig_passwordprotectedroom required?
                ob.connection.sendIQ(formsubmit,
                    onSuccess,
                    onError);
            } else {
                onNotSupported();
            }
        }, onError);
};

ChatRoom.prototype.addToPresence = function (key, values) {
    values.tagName = key;
    this.presMap["nodes"].push(values);
};

ChatRoom.prototype.removeFromPresence = function (key) {
    for(var i = 0; i < this.presMap.nodes.length; i++)
    {
        if(key === this.presMap.nodes[i].tagName)
            this.presMap.nodes.splice(i, 1);
    }
};

ChatRoom.prototype.addPresenceListener = function (name, handler) {
    this.presHandlers[name] = handler;
};

ChatRoom.prototype.removePresenceListener = function (name) {
    delete this.presHandlers[name];
};

ChatRoom.prototype.isModerator = function () {
    return this.role === 'moderator';
};

ChatRoom.prototype.getMemberRole = function (peerJid) {
    if (this.members[peerJid]) {
        return this.members[peerJid].role;
    }
    return null;
};

ChatRoom.prototype.setJingleSession = function(session){
    this.session = session;
    this.session.room = this;
};


ChatRoom.prototype.removeStream = function (stream, callback) {
    if(!this.session)
        return;
    this.session.removeStream(stream, callback);
};

ChatRoom.prototype.switchStreams = function (stream, oldStream, callback, isAudio) {
    if(this.session) {
        // FIXME: will block switchInProgress on true value in case of exception
        this.session.switchStreams(stream, oldStream, callback, isAudio);
    } else {
        // We are done immediately
        logger.warn("No conference handler or conference not started yet");
        callback();
    }
};

ChatRoom.prototype.addStream = function (stream, callback) {
    if(this.session) {
        // FIXME: will block switchInProgress on true value in case of exception
        this.session.addStream(stream, callback);
    } else {
        // We are done immediately
        logger.warn("No conference handler or conference not started yet");
        callback();
    }
};

ChatRoom.prototype.setVideoMute = function (mute, callback, options) {
    var self = this;
    var localCallback = function (mute) {
        self.sendVideoInfoPresence(mute);
        if(callback)
            callback(mute);
    };

    if(this.session)
    {
        this.session.setVideoMute(
            mute, localCallback, options);
    }
    else {
        localCallback(mute);
    }

};

ChatRoom.prototype.setAudioMute = function (mute, callback) {
    //This will be for remote streams only
//    if (this.forceMuted && !mute) {
//        logger.info("Asking focus for unmute");
//        this.connection.moderate.setMute(this.connection.emuc.myroomjid, mute);
//        // FIXME: wait for result before resetting muted status
//        this.forceMuted = false;
//    }


    return this.sendAudioInfoPresence(mute, callback);
};

ChatRoom.prototype.addAudioInfoToPresence = function (mute) {
    this.removeFromPresence("audiomuted");
    this.addToPresence("audiomuted",
        {attributes:
        {"audions": "http://jitsi.org/jitmeet/audio"},
            value: mute.toString()});
};

ChatRoom.prototype.sendAudioInfoPresence = function(mute, callback) {
    this.addAudioInfoToPresence(mute);
    if(this.connection) {
        this.sendPresence();
    }
    if(callback)
        callback();
};

ChatRoom.prototype.addVideoInfoToPresence = function (mute) {
    this.removeFromPresence("videomuted");
    this.addToPresence("videomuted",
        {attributes:
        {"videons": "http://jitsi.org/jitmeet/video"},
            value: mute.toString()});
};


ChatRoom.prototype.sendVideoInfoPresence = function (mute) {
    this.addVideoInfoToPresence(mute);
    if(!this.connection)
        return;
    this.sendPresence();
};

ChatRoom.prototype.addListener = function(type, listener) {
    this.eventEmitter.on(type, listener);
};

ChatRoom.prototype.removeListener = function (type, listener) {
    this.eventEmitter.removeListener(type, listener);
};

ChatRoom.prototype.remoteStreamAdded = function(data, sid, thessrc) {
    if(this.lastPresences[data.peerjid])
    {
        var pres = this.lastPresences[data.peerjid];
        var audiomuted = filterNodeFromPresenceJSON(pres, "audiomuted");
        var videomuted = filterNodeFromPresenceJSON(pres, "videomuted");
        data.videomuted = ((videomuted.length > 0
            && videomuted[0]
            && videomuted[0]["value"] === "true")? true : false);
        data.audiomuted = ((audiomuted.length > 0
            && audiomuted[0]
            && audiomuted[0]["value"] === "true")? true : false);
    }

    this.eventEmitter.emit(XMPPEvents.REMOTE_STREAM_RECEIVED, data, sid, thessrc);
};

ChatRoom.prototype.getJidBySSRC = function (ssrc) {
    if (!this.session)
        return null;
    return this.session.getSsrcOwner(ssrc);
};

/**
 * Returns true if the recording is supproted and false if not.
 */
ChatRoom.prototype.isRecordingSupported = function () {
    if(this.recording)
        return this.recording.isSupported();
    return false;
};

/**
 * Returns null if the recording is not supported, "on" if the recording started
 * and "off" if the recording is not started.
 */
ChatRoom.prototype.getRecordingState = function () {
    if(this.recording)
        return this.recording.getState();
    return "off";
}

/**
 * Returns the url of the recorded video.
 */
ChatRoom.prototype.getRecordingURL = function () {
    if(this.recording)
        return this.recording.getURL();
    return null;
}

/**
 * Starts/stops the recording
 * @param token token for authentication
 * @param statusChangeHandler {function} receives the new status as argument.
 */
ChatRoom.prototype.toggleRecording = function (options, statusChangeHandler) {
    if(this.recording)
        return this.recording.toggleRecording(options, statusChangeHandler);

    return statusChangeHandler("error",
        new Error("The conference is not created yet!"));
}

/**
 * Returns true if the SIP calls are supported and false otherwise
 */
ChatRoom.prototype.isSIPCallingSupported = function () {
    if(this.moderator)
        return this.moderator.isSipGatewayEnabled();
    return false;
}

/**
 * Dials a number.
 * @param number the number
 */
ChatRoom.prototype.dial = function (number) {
    return this.connection.rayo.dial(number, "fromnumber",
        Strophe.getNodeFromJid(this.myroomjid), this.password,
        this.focusMucJid);
}

/**
 * Hangup an existing call
 */
ChatRoom.prototype.hangup = function () {
    return this.connection.rayo.hangup();
}

/**
 * Returns the phone number for joining the conference.
 */
ChatRoom.prototype.getPhoneNumber = function () {
    return this.phoneNumber;
}

/**
 * Returns the pin for joining the conference with phone.
 */
ChatRoom.prototype.getPhonePin = function () {
    return this.phonePin;
}

/**
 * Returns the connection state for the current session.
 */
ChatRoom.prototype.getConnectionState = function () {
    if(!this.session)
        return null;
    return this.session.getIceConnectionState();
}

/**
 * Mutes remote participant.
 * @param jid of the participant
 * @param mute
 */
ChatRoom.prototype.muteParticipant = function (jid, mute) {
    logger.info("set mute", mute);
    var iqToFocus = $iq(
        {to: this.focusMucJid, type: 'set'})
        .c('mute', {
            xmlns: 'http://jitsi.org/jitmeet/audio',
            jid: jid
        })
        .t(mute.toString())
        .up();

    this.connection.sendIQ(
        iqToFocus,
        function (result) {
            logger.log('set mute', result);
        },
        function (error) {
            logger.log('set mute error', error);
        });
}

ChatRoom.prototype.onMute = function (iq) {
    var from = iq.getAttribute('from');
    if (from !== this.focusMucJid) {
        logger.warn("Ignored mute from non focus peer");
        return false;
    }
    var mute = $(iq).find('mute');
    if (mute.length) {
        var doMuteAudio = mute.text() === "true";
        this.eventEmitter.emit(XMPPEvents.AUDIO_MUTED_BY_FOCUS, doMuteAudio);
    }
    return true;
}

module.exports = ChatRoom;
