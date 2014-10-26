/* global connection, Strophe, updateLargeVideo, focusedVideoSrc*/

// cache datachannels to avoid garbage collection
// https://code.google.com/p/chromium/issues/detail?id=405545
var _dataChannels = [];

/**
 * Callback triggered by PeerConnection when new data channel is opened
 * on the bridge.
 * @param event the event info object.
 */

function onDataChannel(event)
{
    var dataChannel = event.channel;

    dataChannel.onopen = function ()
    {
        console.info("Data channel opened by the Videobridge!", dataChannel);

        // Code sample for sending string and/or binary data
        // Sends String message to the bridge
        //dataChannel.send("Hello bridge!");
        // Sends 12 bytes binary message to the bridge
        //dataChannel.send(new ArrayBuffer(12));

        // when the data channel becomes available, tell the bridge about video
        // selections so that it can do adaptive simulcast,
        var largeVideoSrc = $('#largeVideo').attr('src');
        var userJid = getJidFromVideoSrc(largeVideoSrc);
        // we want the notification to trigger even if userJid is undefined,
        // or null.
        onSelectedEndpointChanged(userJid);
    };

    dataChannel.onerror = function (error)
    {
        console.error("Data Channel Error:", error, dataChannel);
    };

    dataChannel.onmessage = function (event)
    {
        var data = event.data;
        // JSON
        var obj;

        try
        {
            obj = JSON.parse(data);
        }
        catch (e)
        {
            console.error(
                "Failed to parse data channel message as JSON: ",
                data,
                dataChannel);
        }
        if (('undefined' !== typeof(obj)) && (null !== obj))
        {
            var colibriClass = obj.colibriClass;

            if ("DominantSpeakerEndpointChangeEvent" === colibriClass)
            {
                // Endpoint ID from the Videobridge.
                var dominantSpeakerEndpoint = obj.dominantSpeakerEndpoint;

                console.info(
                    "Data channel new dominant speaker event: ",
                    dominantSpeakerEndpoint);
                $(document).trigger(
                    'dominantspeakerchanged',
                    [dominantSpeakerEndpoint]);
            }
            else if ("LastNEndpointsChangeEvent" === colibriClass)
            {
                // The new/latest list of last-n endpoint IDs.
                var lastNEndpoints = obj.lastNEndpoints;
                /*
                 * The list of endpoint IDs which are entering the list of
                 * last-n at this time i.e. were not in the old list of last-n
                 * endpoint IDs.
                 */
                var endpointsEnteringLastN = obj.endpointsEnteringLastN;

                var stream = obj.stream;

                console.log(
                    "Data channel new last-n event: ",
                    lastNEndpoints, endpointsEnteringLastN, obj);

                $(document).trigger(
                        'lastnchanged',
                        [lastNEndpoints, endpointsEnteringLastN, stream]);
            }
            else if ("SimulcastLayersChangedEvent" === colibriClass)
            {
                var endpointSimulcastLayers = obj.endpointSimulcastLayers;
                $(document).trigger('simulcastlayerschanged', [endpointSimulcastLayers]);
            }
            else if ("SimulcastLayersChangingEvent" === colibriClass)
            {
                var endpointSimulcastLayers = obj.endpointSimulcastLayers;
                $(document).trigger('simulcastlayerschanging', [endpointSimulcastLayers]);
            }
            else if ("StartSimulcastLayerEvent" === colibriClass)
            {
                var simulcastLayer = obj.simulcastLayer;
                $(document).trigger('startsimulcastlayer', simulcastLayer);
            }
            else if ("StopSimulcastLayerEvent" === colibriClass)
            {
                var simulcastLayer = obj.simulcastLayer;
                $(document).trigger('stopsimulcastlayer', simulcastLayer);
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
}

/**
 * Binds "ondatachannel" event listener to given PeerConnection instance.
 * @param peerConnection WebRTC peer connection instance.
 */
function bindDataChannelListener(peerConnection)
{
    peerConnection.ondatachannel = onDataChannel;

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
}

