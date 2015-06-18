/* global Strophe, focusedVideoSrc*/

// cache datachannels to avoid garbage collection
// https://code.google.com/p/chromium/issues/detail?id=405545
var RTCEvents = require("../../service/RTC/RTCEvents");

var _dataChannels = [];
var eventEmitter = null;




var DataChannels =
{

    /**
     * Callback triggered by PeerConnection when new data channel is opened
     * on the bridge.
     * @param event the event info object.
     */

    onDataChannel: function (event)
    {
        var dataChannel = event.channel;

        dataChannel.onopen = function () {
            console.info("Data channel opened by the Videobridge!", dataChannel);

            // Code sample for sending string and/or binary data
            // Sends String message to the bridge
            //dataChannel.send("Hello bridge!");
            // Sends 12 bytes binary message to the bridge
            //dataChannel.send(new ArrayBuffer(12));

            // when the data channel becomes available, tell the bridge about video
            // selections so that it can do adaptive simulcast,
            // we want the notification to trigger even if userJid is undefined,
            // or null.
            var userJid = APP.UI.getLargeVideoState().userResourceJid;
            // we want the notification to trigger even if userJid is undefined,
            // or null.
            onSelectedEndpointChanged(userJid);
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
                else if ("InLastNChangeEvent" === colibriClass)
                {
                    var oldValue = obj.oldValue;
                    var newValue = obj.newValue;
                    // Make sure that oldValue and newValue are of type boolean.
                    var type;

                    if ((type = typeof oldValue) !== 'boolean') {
                        if (type === 'string') {
                            oldValue = (oldValue == "true");
                        } else {
                            oldValue = new Boolean(oldValue).valueOf();
                        }
                    }
                    if ((type = typeof newValue) !== 'boolean') {
                        if (type === 'string') {
                            newValue = (newValue == "true");
                        } else {
                            newValue = new Boolean(newValue).valueOf();
                        }
                    }

                    eventEmitter.emit(RTCEvents.LASTN_CHANGED, oldValue, newValue);
                }
                else if ("LastNEndpointsChangeEvent" === colibriClass)
                {
                    // The new/latest list of last-n endpoint IDs.
                    var lastNEndpoints = obj.lastNEndpoints;
                    // The list of endpoint IDs which are entering the list of
                    // last-n at this time i.e. were not in the old list of last-n
                    // endpoint IDs.
                    var endpointsEnteringLastN = obj.endpointsEnteringLastN;
                    var stream = obj.stream;

                    console.log(
                        "Data channel new last-n event: ",
                        lastNEndpoints, endpointsEnteringLastN, obj);
                    eventEmitter.emit(RTCEvents.LASTN_ENDPOINT_CHANGED,
                        lastNEndpoints, endpointsEnteringLastN, obj);
                }
                else
                {
                    console.debug("Data channel JSON-formatted message: ", obj);
                }
            }
        };

        dataChannel.onclose = function ()
        {
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
    handleSelectedEndpointEvent: onSelectedEndpointChanged,
    handlePinnedEndpointEvent: onPinnedEndpointChanged

};

function onSelectedEndpointChanged(userResource)
{
    console.log('selected endpoint changed: ', userResource);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                console.log('sending selected endpoint changed ' 
                    + 'notification to the bridge: ', userResource);
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'SelectedEndpointChangedEvent',
                    'selectedEndpoint':
                        (!userResource || userResource === null)?
                            null : userResource
                }));

                return true;
            }
        });
    }
}

function onPinnedEndpointChanged(userResource)
{
    console.log('pinned endpoint changed: ', userResource);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'PinnedEndpointChangedEvent',
                    'pinnedEndpoint':
                        (!userResource || userResource == null)?
                            null : userResource
                }));

                return true;
            }
        });
    }
}

module.exports = DataChannels;

