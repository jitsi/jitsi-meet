/* global APP */

/**
 * This module is meant to (eventually) contain and manage all information
 * about members/participants of the conference, so that other modules don't
 * have to do it on their own, and so that other modules can access members'
 * information from a single place.
 *
 * Currently this module only manages information about the support of jingle
 * DTMF of the members. Other fields, as well as accessor methods are meant to
 * be added as needed.
 */

var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Events = require("../../service/members/Events");
var EventEmitter = require("events");

var eventEmitter = new EventEmitter();

/**
 * The actual container.
 */
var members = {};

/**
 * There is at least one member that supports DTMF (i.e. is jigasi).
 */
var atLeastOneDtmf = false;


function registerListeners() {
    APP.xmpp.addListener(XMPPEvents.MUC_MEMBER_JOINED, onMucMemberJoined);
    APP.xmpp.addListener(XMPPEvents.MUC_MEMBER_LEFT, onMucMemberLeft);
}

/**
 * Handles a new member joining the MUC.
 */
function onMucMemberJoined(jid, id, displayName) {
    var member = {
        displayName: displayName
    };

    APP.xmpp.getConnection().disco.info(
        jid, "" /* node */, function(iq) { onDiscoInfoReceived(jid, iq); });

    members[jid] = member;
}

/**
 * Handles a member leaving the MUC.
 */
function onMucMemberLeft(jid) {
    delete members[jid];
    updateAtLeastOneDtmf();
}

/**
 * Handles the reception of a disco#info packet from a particular JID.
 * @param jid the JID sending the packet.
 * @param iq the packet.
 */
function onDiscoInfoReceived(jid, iq) {
    if (!members[jid])
        return;

    var supportsDtmf
        = $(iq).find('>query>feature[var="urn:xmpp:jingle:dtmf:0"]').length > 0;
    updateDtmf(jid, supportsDtmf);
}

/**
 * Updates the 'supportsDtmf' field for a member.
 * @param jid the jid of the member.
 * @param newValue the new value for the 'supportsDtmf' field.
 */
function updateDtmf(jid, newValue) {
    var oldValue = members[jid].supportsDtmf;
    members[jid].supportsDtmf = newValue;

    if (newValue != oldValue) {
        updateAtLeastOneDtmf();
    }
}

/**
 * Checks each member's 'supportsDtmf' field and updates
 * 'atLastOneSupportsDtmf'.
 */
function updateAtLeastOneDtmf(){
    var newAtLeastOneDtmf = false;
    for (var key in members) {
        if (typeof members[key].supportsDtmf !== 'undefined'
            && members[key].supportsDtmf) {
            newAtLeastOneDtmf= true;
            break;
        }
    }

    if (atLeastOneDtmf != newAtLeastOneDtmf) {
        atLeastOneDtmf = newAtLeastOneDtmf;
        eventEmitter.emit(Events.DTMF_SUPPORT_CHANGED, atLeastOneDtmf);
    }
}


/**
 * Exported interface.
 */
var Members = {
    start: function(){
        registerListeners();
    },
    addListener: function(type, listener)
    {
        eventEmitter.on(type, listener);
    },
    removeListener: function (type, listener) {
        eventEmitter.removeListener(type, listener);
    },
    size: function () {
        return Object.keys(members).length;
    },
    getMembers: function () {
        return members;
    }
};

module.exports = Members;
