var RTCBrowserType = require("../../service/RTC/RTCBrowserType.js");
var Resolutions = require("../../service/RTC/Resolutions");

var currentResolution = null;

function getPreviousResolution(resolution) {
    if(!Resolutions[resolution])
        return null;
    var order = Resolutions[resolution].order;
    var res = null;
    var resName = null;
    for(var i in Resolutions)
    {
        var tmp = Resolutions[i];
        if(res == null || (res.order < tmp.order && tmp.order < order))
        {
            resName = i;
            res = tmp;
        }
    }
    return resName;
}

function setResolutionConstraints(constraints, resolution, isAndroid)
{
    if (resolution && !constraints.video || isAndroid) {
        constraints.video = { mandatory: {}, optional: [] };// same behaviour as true
    }

    if(Resolutions[resolution])
    {
        constraints.video.mandatory.minWidth = Resolutions[resolution].width;
        constraints.video.mandatory.minHeight = Resolutions[resolution].height;
    }
    else
    {
        if (isAndroid) {
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 240;
            constraints.video.mandatory.maxFrameRate = 15;
        }
    }

    if (constraints.video.mandatory.minWidth)
        constraints.video.mandatory.maxWidth = constraints.video.mandatory.minWidth;
    if (constraints.video.mandatory.minHeight)
        constraints.video.mandatory.maxHeight = constraints.video.mandatory.minHeight;
}

function getConstraints(um, resolution, bandwidth, fps, desktopStream, isAndroid)
{
    var constraints = {audio: false, video: false};

    if (um.indexOf('video') >= 0) {
        constraints.video = { mandatory: {}, optional: [] };// same behaviour as true
    }
    if (um.indexOf('audio') >= 0) {
        constraints.audio = { mandatory: {}, optional: []};// same behaviour as true
    }
    if (um.indexOf('screen') >= 0) {
        constraints.video = {
            mandatory: {
                chromeMediaSource: "screen",
                googLeakyBucket: true,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height,
                maxFrameRate: 3
            },
            optional: []
        };
    }
    if (um.indexOf('desktop') >= 0) {
        constraints.video = {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: desktopStream,
                googLeakyBucket: true,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height,
                maxFrameRate: 3
            },
            optional: []
        };
    }

    if (constraints.audio) {
        // if it is good enough for hangouts...
        constraints.audio.optional.push(
            {googEchoCancellation: true},
            {googAutoGainControl: true},
            {googNoiseSupression: true},
            {googHighpassFilter: true},
            {googNoisesuppression2: true},
            {googEchoCancellation2: true},
            {googAutoGainControl2: true}
        );
    }
    if (constraints.video) {
        constraints.video.optional.push(
            {googNoiseReduction: false} // chrome 37 workaround for issue 3807, reenable in M38
        );
        if (um.indexOf('video') >= 0) {
            constraints.video.optional.push(
                {googLeakyBucket: true}
            );
        }
    }

    if (um.indexOf('video') >= 0) {
        setResolutionConstraints(constraints, resolution, isAndroid);
    }

    if (bandwidth) { // doesn't work currently, see webrtc issue 1846
        if (!constraints.video) constraints.video = {mandatory: {}, optional: []};//same behaviour as true
        constraints.video.optional.push({bandwidth: bandwidth});
    }
    if (fps) { // for some cameras it might be necessary to request 30fps
        // so they choose 30fps mjpg over 10fps yuy2
        if (!constraints.video) constraints.video = {mandatory: {}, optional: []};// same behaviour as true;
        constraints.video.mandatory.minFrameRate = fps;
    }

    return constraints;
}


function RTCUtils(RTCService)
{
    this.service = RTCService;
    if (navigator.mozGetUserMedia) {
        console.log('This appears to be Firefox');
        var version = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
        if (version >= 40
            && config.useBundle && config.useRtcpMux) {
            this.peerconnection = mozRTCPeerConnection;
            this.browser = RTCBrowserType.RTC_BROWSER_FIREFOX;
            this.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
            this.pc_constraints = {};
            this.attachMediaStream =  function (element, stream) {
                //  srcObject is being standardized and FF will eventually
                //  support that unprefixed. FF also supports the
                //  "element.src = URL.createObjectURL(...)" combo, but that
                //  will be deprecated in favour of srcObject.
                //
                // https://groups.google.com/forum/#!topic/mozilla.dev.media/pKOiioXonJg
                // https://github.com/webrtc/samples/issues/302
                if(!element[0])
                    return;
                element[0].mozSrcObject = stream;
                element[0].play();
            };
            this.getStreamID =  function (stream) {
                var tracks = stream.getVideoTracks();
                if(!tracks || tracks.length == 0)
                {
                    tracks = stream.getAudioTracks();
                }
                return tracks[0].id.replace(/[\{,\}]/g,"");
            };
            this.getVideoSrc = function (element) {
                if(!element)
                    return null;
                return element.mozSrcObject;
            };
            this.setVideoSrc = function (element, src) {
                if(element)
                    element.mozSrcObject = src;
            };
            RTCSessionDescription = mozRTCSessionDescription;
            RTCIceCandidate = mozRTCIceCandidate;
        } else {
            window.location.href = 'unsupported_browser.html';
            return;
        }

    } else if (navigator.webkitGetUserMedia) {
        console.log('This appears to be Chrome');
        this.peerconnection = webkitRTCPeerConnection;
        this.browser = RTCBrowserType.RTC_BROWSER_CHROME;
        this.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
        this.attachMediaStream = function (element, stream) {
            element.attr('src', webkitURL.createObjectURL(stream));
        };
        this.getStreamID = function (stream) {
            // streams from FF endpoints have the characters '{' and '}'
            // that make jQuery choke.
            return stream.id.replace(/[\{,\}]/g,"");
        };
        this.getVideoSrc = function (element) {
            if(!element)
                return null;
            return element.getAttribute("src");
        };
        this.setVideoSrc = function (element, src) {
            if(element)
                element.setAttribute("src", src);
        };
        // DTLS should now be enabled by default but..
        this.pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': 'true'}]};
        if (navigator.userAgent.indexOf('Android') != -1) {
            this.pc_constraints = {}; // disable DTLS on Android
        }
        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks = function () {
                return this.videoTracks;
            };
        }
        if (!webkitMediaStream.prototype.getAudioTracks) {
            webkitMediaStream.prototype.getAudioTracks = function () {
                return this.audioTracks;
            };
        }
    }
    else
    {
        try { console.log('Browser does not appear to be WebRTC-capable'); } catch (e) { }

        window.location.href = 'unsupported_browser.html';
        return;
    }
}


RTCUtils.prototype.getUserMediaWithConstraints = function(
    um, success_callback, failure_callback, resolution,bandwidth, fps,
    desktopStream)
{
    currentResolution = resolution;
    // Check if we are running on Android device
    var isAndroid = navigator.userAgent.indexOf('Android') != -1;

    var constraints = getConstraints(
        um, resolution, bandwidth, fps, desktopStream, isAndroid);

    var isFF = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    var self = this;

    try {
        this.getUserMedia(constraints,
            function (stream) {
                console.log('onUserMediaSuccess');
                self.setAvailableDevices(um, true);
                success_callback(stream);
            },
            function (error) {
                self.setAvailableDevices(um, false);
                console.warn('Failed to get access to local media. Error ',
                    error, constraints);
                if (failure_callback) {
                    failure_callback(error);
                }
            });
    } catch (e) {
        console.error('GUM failed: ', e);
        if(failure_callback) {
            failure_callback(e);
        }
    }
};

RTCUtils.prototype.setAvailableDevices = function (um, available) {
    var devices = {};
    if(um.indexOf("video") != -1)
    {
        devices.video = available;
    }
    if(um.indexOf("audio") != -1)
    {
        devices.audio = available;
    }
    this.service.setDeviceAvailability(devices);
}

/**
 * We ask for audio and video combined stream in order to get permissions and
 * not to ask twice.
 */
RTCUtils.prototype.obtainAudioAndVideoPermissions =
    function(devices, callback, usageOptions)
{
    var self = this;
    // Get AV

    var successCallback = function (stream) {
        if(callback)
            callback(stream, usageOptions);
        else
            self.successCallback(stream, usageOptions);
    };

    if(!devices)
        devices = ['audio', 'video'];

    var newDevices = [];


    if(usageOptions)
        for(var i = 0; i < devices.length; i++)
        {
            var device = devices[i];
            if(usageOptions[device] === true)
                newDevices.push(device);
        }
    else
        newDevices = devices;

    if(newDevices.length === 0)
    {
        successCallback();
        return;
    }

    if (navigator.mozGetUserMedia) {

        // With FF we can't split the stream into audio and video because FF
        // doesn't support media stream constructors. So, we need to get the
        // audio stream separately from the video stream using two distinct GUM
        // calls. Not very user friendly :-( but we don't have many other
        // options neither.
        //
        // Note that we pack those 2 streams in a single object and pass it to
        // the successCallback method.

        self.getUserMediaWithConstraints(
            ['audio'],
            function (audioStream) {
                self.getUserMediaWithConstraints(
                    ['video'],
                    function (videoStream) {
                        return self.successCallback({
                            audioStream: audioStream,
                            videoStream: videoStream
                        });
                    },
                    function (error) {
                        console.error('failed to obtain video stream - stop',
                            error);
                        return self.successCallback(null);
                    },
                    config.resolution || '360');
            },
            function (error) {
                console.error('failed to obtain audio stream - stop',
                        error);
                return self.successCallback(null);
            }
        );
    } else {
        this.getUserMediaWithConstraints(
        newDevices,
        function (stream) {
            successCallback(stream);
        },
        function (error) {
            self.errorCallback(error);
        },
        config.resolution || '360');
    }

}

RTCUtils.prototype.successCallback = function (stream, usageOptions) {
    // If this is FF, the stream parameter is *not* a MediaStream object, it's
    // an object with two properties: audioStream, videoStream.
    if(stream && !navigator.mozGetUserMedia)
        console.log('got', stream, stream.getAudioTracks().length,
            stream.getVideoTracks().length);
    this.handleLocalStream(stream, usageOptions);
};

RTCUtils.prototype.errorCallback = function (error) {
    var self = this;
    console.error('failed to obtain audio/video stream - trying audio only', error);
    var resolution = getPreviousResolution(currentResolution);
    if(typeof error == "object" && error.constraintName && error.name
        && (error.name == "ConstraintNotSatisfiedError" ||
            error.name == "OverconstrainedError") &&
        (error.constraintName == "minWidth" || error.constraintName == "maxWidth" ||
            error.constraintName == "minHeight" || error.constraintName == "maxHeight")
        && resolution != null)
    {
        self.getUserMediaWithConstraints(['audio', 'video'],
            function (stream) {
                return self.successCallback(stream);
            }, function (error) {
                return self.errorCallback(error);
            }, resolution);
    }
    else
    {
        self.getUserMediaWithConstraints(
            ['audio'],
            function (stream) {
                return self.successCallback(stream);
            },
            function (error) {
                console.error('failed to obtain audio/video stream - stop',
                    error);
                return self.successCallback(null);
            }
        );
    }

}

RTCUtils.prototype.handleLocalStream = function(stream, usageOptions)
{
    // If this is FF, the stream parameter is *not* a MediaStream object, it's
    // an object with two properties: audioStream, videoStream.
    var audioStream, videoStream;
    if(window.webkitMediaStream)
    {
        audioStream = new webkitMediaStream();
        videoStream = new webkitMediaStream();
        if(stream) {
            var audioTracks = stream.getAudioTracks();

            for (var i = 0; i < audioTracks.length; i++) {
                audioStream.addTrack(audioTracks[i]);
            }

            var videoTracks = stream.getVideoTracks();

            for (i = 0; i < videoTracks.length; i++) {
                videoStream.addTrack(videoTracks[i]);
            }
        }
    }
    else
    {//firefox
        audioStream = stream.audioStream;
        videoStream = stream.videoStream;
    }

    var audioMuted = (usageOptions && usageOptions.audio === false),
        videoMuted = (usageOptions && usageOptions.video === false);

    var audioGUM = (!usageOptions || usageOptions.audio !== false),
        videoGUM = (!usageOptions || usageOptions.video !== false);


    this.service.createLocalStream(audioStream, "audio", null, null,
        audioMuted, audioGUM);

    this.service.createLocalStream(videoStream, "video", null, null,
        videoMuted, videoGUM);
};

RTCUtils.prototype.createStream = function(stream, isVideo)
{
    var newStream = null;
    if(window.webkitMediaStream)
    {
        newStream = new webkitMediaStream();
        if(newStream)
        {
            var tracks = (isVideo? stream.getVideoTracks() : stream.getAudioTracks());

            for (i = 0; i < tracks.length; i++) {
                newStream.addTrack(tracks[i]);
            }
        }

    }
    else
        newStream = stream;

    return newStream;
};

module.exports = RTCUtils;
