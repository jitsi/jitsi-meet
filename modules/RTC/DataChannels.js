/* global config, APP, Strophe */
/* jshint -W101 */

// cache datachannels to avoid garbage collection
// https://code.google.com/p/chromium/issues/detail?id=405545
var RTCEvents = require("../../service/RTC/RTCEvents");

var _dataChannels = [];
var eventEmitter = null;

var DataChannels = {
    /**
     * Callback triggered by PeerConnection when new data channel is opened
     * on the bridge.
     * @param event the event info object.
     */
    onDataChannel: function (event) {
        var dataChannel = event.channel;

        dataChannel.onopen = function () {
            console.info("Data channel opened by the Videobridge!", dataChannel);

            // Code sample for sending string and/or binary data
            // Sends String message to the bridge
            //dataChannel.send("Hello bridge!");
            // Sends 12 bytes binary message to the bridge
            //dataChannel.send(new ArrayBuffer(12));

            eventEmitter.emit(RTCEvents.DATA_CHANNEL_OPEN);
        };

        dataChannel.onerror = function (error) {
            console.error("Data Channel Error:", error, dataChannel);
        };

        dataChannel.onmessage = function (event) {
            var data = event.data;
            // JSON
            var obj;

            try {
                obj = JSON.parse(data);
            }
            catch (e) {
                console.error(
                    "Failed to parse data channel message as JSON: ",
                    data,
                    dataChannel);
            }
            if (('undefined' !== typeof(obj)) && (null !== obj)) {
                var colibriClass = obj.colibriClass;

                if ("DominantSpeakerEndpointChangeEvent" === colibriClass) {
                    // Endpoint ID from the Videobridge.
                    var dominantSpeakerEndpoint = obj.dominantSpeakerEndpoint;

                    console.info(
                        "Data channel new dominant speaker event: ",
                        dominantSpeakerEndpoint);
                    eventEmitter.emit(RTCEvents.DOMINANTSPEAKER_CHANGED, dominantSpeakerEndpoint);
                }
                else if ("InLastNChangeEvent" === colibriClass) {
                    var oldValue = obj.oldValue;
                    var newValue = obj.newValue;
                    // Make sure that oldValue and newValue are of type boolean.
                    var type;

                    if ((type = typeof oldValue) !== 'boolean') {
                        if (type === 'string') {
                            oldValue = (oldValue == "true");
                        } else {
                            oldValue = Boolean(oldValue).valueOf();
                        }
                    }
                    if ((type = typeof newValue) !== 'boolean') {
                        if (type === 'string') {
                            newValue = (newValue == "true");
                        } else {
                            newValue = Boolean(newValue).valueOf();
                        }
                    }

                    eventEmitter.emit(RTCEvents.LASTN_CHANGED, oldValue, newValue);
                }
                else if ("LastNEndpointsChangeEvent" === colibriClass) {
                    // The new/latest list of last-n endpoint IDs.
                    var lastNEndpoints = obj.lastNEndpoints;
                    // The list of endpoint IDs which are entering the list of
                    // last-n at this time i.e. were not in the old list of last-n
                    // endpoint IDs.
                    var endpointsEnteringLastN = obj.endpointsEnteringLastN;

                    console.info(
                        "Data channel new last-n event: ",
                        lastNEndpoints, endpointsEnteringLastN, obj);
                    eventEmitter.emit(RTCEvents.LASTN_ENDPOINT_CHANGED,
                        lastNEndpoints, endpointsEnteringLastN, obj);
                }
                else {
                    console.debug("Data channel JSON-formatted message: ", obj);
                    // The received message appears to be appropriately
                    // formatted (i.e. is a JSON object which assigns a value to
                    // the mandatory property colibriClass) so don't just
                    // swallow it, expose it to public consumption.
                    eventEmitter.emit("rtc.datachannel." + colibriClass, obj);
                }
            }
        };

        dataChannel.onclose = function () {
            console.info("The Data Channel closed", dataChannel);
            var idx = _dataChannels.indexOf(dataChannel);
            if (idx > -1)
                _dataChannels = _dataChannels.splice(idx, 1);
        };
        _dataChannels.push(dataChannel);
    },

    /**
     * Binds "ondatachannel" event listener to given PeerConnection instance.
     * @param peerConnection WebRTC peer connection instance.
     */
    init: function (peerConnection, emitter) {
        if(!config.openSctp)
            return;

        peerConnection.ondatachannel = this.onDataChannel;
        eventEmitter = emitter;

        // Sample code for opening new data channel from Jitsi Meet to the bridge.
        // Although it's not a requirement to open separate channels from both bridge
        // and peer as single channel can be used for sending and receiving data.
        // So either channel opened by the bridge or the one opened here is enough
        // for communication with the bridge.
        /*var dataChannelOptions =
         {
         reliable: true
         };
         var dataChannel
         = peerConnection.createDataChannel("myChannel", dataChannelOptions);

         // Can be used only when is in open state
         dataChannel.onopen = function ()
         {
         dataChannel.send("My channel !!!");
         };
         dataChannel.onmessage = function (event)
         {
         var msgData = event.data;
         console.info("Got My Data Channel Message:", msgData, dataChannel);
         };*/
    },

    handleSelectedEndpointEvent: function (userResource) {
        onXXXEndpointChanged("selected", userResource);
    },
    handlePinnedEndpointEvent: function (userResource) {
        onXXXEndpointChanged("pinned", userResource);
    },

    some: function (callback, thisArg) {
        if (_dataChannels && _dataChannels.length !== 0) {
            if (thisArg)
                return _dataChannels.some(callback, thisArg);
            else
                return _dataChannels.some(callback);
        } else {
            return false;
        }
    }
};

/**
 * Notifies Videobridge about a change in the value of a specific
 * endpoint-related property such as selected endpoint and pinnned endpoint.
 *
 * @param xxx the name of the endpoint-related property whose value changed
 * @param userResource the new value of the endpoint-related property after the
 * change
 */
function onXXXEndpointChanged(xxx, userResource) {
    // Derive the correct words from xxx such as selected and Selected, pinned
    // and Pinned.
    var head = xxx.charAt(0);
    var tail = xxx.substring(1);
    var lower = head.toLowerCase() + tail;
    var upper = head.toUpperCase() + tail;

    // Notify Videobridge about the specified endpoint change.
    console.log(lower + ' endpoint changed: ', userResource);
    DataChannels.some(function (dataChannel) {
        if (dataChannel.readyState == 'open') {
            console.log(
                    'sending ' + lower
                        + ' endpoint changed notification to the bridge: ',
                    userResource);

            var jsonObject = {};

            jsonObject.colibriClass = (upper + 'EndpointChangedEvent');
            jsonObject[lower + "Endpoint"]
                = (userResource ? userResource : null);
            dataChannel.send(JSON.stringify(jsonObject));

            return true;
        }
    });
}

module.exports = DataChannels;

