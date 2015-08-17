/* global config, require, attachMediaStream, getUserMedia */
var RTCBrowserType = require("./RTCBrowserType");
var Resolutions = require("../../service/RTC/Resolutions");
var AdapterJS = require("./adapter.screenshare");
var SDPUtil = require("../xmpp/SDPUtil");
var EventEmitter = require("events");

function DummyMediaStream(id) {
    this.id = id;
    this.label = id;
    this.stop = function() { };
    this.getAudioTracks = function() { return []; };
    this.getVideoTracks = function() { return []; };
}

function getPreviousResolution(resolution) {
    if(!Resolutions[resolution])
        return null;
    var order = Resolutions[resolution].order;
    var res = null;
    var resName = null;
    for(var i in Resolutions) {
        var tmp = Resolutions[i];
        if(res == null || (res.order < tmp.order && tmp.order < order)) {
            resName = i;
            res = tmp;
        }
    }
    return resName;
}

function setResolutionConstraints(constraints, resolution) {
    var isAndroid = RTCBrowserType.isAndroid();

    if (Resolutions[resolution]) {
        constraints.video.mandatory.minWidth = Resolutions[resolution].width;
        constraints.video.mandatory.minHeight = Resolutions[resolution].height;
    }
    else if (isAndroid) {
        // FIXME can't remember if the purpose of this was to always request
        //       low resolution on Android ? if yes it should be moved up front
        constraints.video.mandatory.minWidth = 320;
        constraints.video.mandatory.minHeight = 240;
        constraints.video.mandatory.maxFrameRate = 15;
    }

    if (constraints.video.mandatory.minWidth)
        constraints.video.mandatory.maxWidth =
            constraints.video.mandatory.minWidth;
    if (constraints.video.mandatory.minHeight)
        constraints.video.mandatory.maxHeight =
            constraints.video.mandatory.minHeight;
}

function getConstraints(um, resolution, bandwidth, fps, desktopStream) {
    var constraints = {audio: false, video: false};

    if (um.indexOf('video') >= 0) {
        // same behaviour as true
        constraints.video = { mandatory: {}, optional: [] };

        constraints.video.optional.push({ googLeakyBucket: true });

        setResolutionConstraints(constraints, resolution);
    }
    if (um.indexOf('audio') >= 0) {
        if (!RTCBrowserType.isFirefox()) {
            // same behaviour as true
            constraints.audio = { mandatory: {}, optional: []};
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
        } else {
            constraints.audio = true;
        }
    }
    if (um.indexOf('screen') >= 0) {
        if (RTCBrowserType.isChrome()) {
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
        } else if (RTCBrowserType.isTemasysPluginUsed()) {
            constraints.video = {
                optional: [
                    {
                        sourceId: AdapterJS.WebRTCPlugin.plugin.screensharingKey
                    }
                ]
            };
        } else {
            console.error(
                "'screen' WebRTC media source is supported only in Chrome" +
                " and with Temasys plugin");
        }
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

    if (bandwidth) {
        if (!constraints.video) {
            //same behaviour as true
            constraints.video = {mandatory: {}, optional: []};
        }
        constraints.video.optional.push({bandwidth: bandwidth});
    }
    if (fps) {
        // for some cameras it might be necessary to request 30fps
        // so they choose 30fps mjpg over 10fps yuy2
        if (!constraints.video) {
            // same behaviour as true;
            constraints.video = {mandatory: {}, optional: []};
        }
        constraints.video.mandatory.minFrameRate = fps;
    }

    return constraints;
}

//Options parameter is to pass config options. Currently uses only "useIPv6".
var RTCUtils = {
    eventEmitter: new EventEmitter(),
    init: function (onTemasysPluginReady, options) {
        var self = this;
        if (RTCBrowserType.isFirefox()) {
            var FFversion = RTCBrowserType.getFirefoxVersion();
            if (FFversion >= 40) {
                this.peerconnection = mozRTCPeerConnection;
                this.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
                this.pc_constraints = {};
                this.attachMediaStream = function (element, stream) {
                    //  srcObject is being standardized and FF will eventually
                    //  support that unprefixed. FF also supports the
                    //  "element.src = URL.createObjectURL(...)" combo, but that
                    //  will be deprecated in favour of srcObject.
                    //
                    // https://groups.google.com/forum/#!topic/mozilla.dev.media/pKOiioXonJg
                    // https://github.com/webrtc/samples/issues/302
                    if (!element[0])
                        return;
                    element[0].mozSrcObject = stream;
                    element[0].play();
                };
                this.getStreamID = function (stream) {
                    var id = stream.id;
                    if (!id) {
                        var tracks = stream.getVideoTracks();
                        if (!tracks || tracks.length === 0) {
                            tracks = stream.getAudioTracks();
                        }
                        id = tracks[0].id;
                    }
                    return SDPUtil.filter_special_chars(id);
                };
                this.getVideoSrc = function (element) {
                    if (!element)
                        return null;
                    return element.mozSrcObject;
                };
                this.setVideoSrc = function (element, src) {
                    if (element)
                        element.mozSrcObject = src;
                };
                RTCSessionDescription = mozRTCSessionDescription;
                RTCIceCandidate = mozRTCIceCandidate;
            } else {
                console.error(
                        "Firefox version too old: " + FFversion + ". Required >= 40.");
                window.location.href = 'unsupported_browser.html';
                return;
            }

        } else if (RTCBrowserType.isChrome() || RTCBrowserType.isOpera()) {
            this.peerconnection = webkitRTCPeerConnection;
            this.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
            this.attachMediaStream = function (element, stream) {
                element.attr('src', webkitURL.createObjectURL(stream));
            };
            this.getStreamID = function (stream) {
                // streams from FF endpoints have the characters '{' and '}'
                // that make jQuery choke.
                return SDPUtil.filter_special_chars(stream.id);
            };
            this.getVideoSrc = function (element) {
                if (!element)
                    return null;
                return element.getAttribute("src");
            };
            this.setVideoSrc = function (element, src) {
                if (element)
                    element.setAttribute("src", src);
            };
            // DTLS should now be enabled by default but..
            this.pc_constraints = {'optional': [
                {'DtlsSrtpKeyAgreement': 'true'}
            ]};
            if (options.useIPv6) {
                // https://code.google.com/p/webrtc/issues/detail?id=2828
                this.pc_constraints.optional.push({googIPv6: true});
            }
            if (RTCBrowserType.isAndroid()) {
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
        // Detect IE/Safari
        else if (RTCBrowserType.isTemasysPluginUsed()) {

            //AdapterJS.WebRTCPlugin.setLogLevel(
            //    AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS.VERBOSE);

            AdapterJS.webRTCReady(function (isPlugin) {

                self.peerconnection = RTCPeerConnection;
                self.getUserMedia = getUserMedia;
                self.attachMediaStream = function (elSel, stream) {

                    if (stream.id === "dummyAudio" || stream.id === "dummyVideo") {
                        return;
                    }

                    attachMediaStream(elSel[0], stream);
                };
                self.getStreamID = function (stream) {
                    var id = SDPUtil.filter_special_chars(stream.label);
                    return id;
                };
                self.getVideoSrc = function (element) {
                    if (!element) {
                        console.warn("Attempt to get video SRC of null element");
                        return null;
                    }
                    var children = element.children;
                    for (var i = 0; i !== children.length; ++i) {
                        if (children[i].name === 'streamId') {
                            return children[i].value;
                        }
                    }
                    //console.info(element.id + " SRC: " + src);
                    return null;
                };
                self.setVideoSrc = function (element, src) {
                    //console.info("Set video src: ", element, src);
                    if (!src) {
                        console.warn("Not attaching video stream, 'src' is null");
                        return;
                    }
                    AdapterJS.WebRTCPlugin.WaitForPluginReady();
                    var stream = AdapterJS.WebRTCPlugin.plugin
                        .getStreamWithId(AdapterJS.WebRTCPlugin.pageId, src);
                    attachMediaStream(element, stream);
                };

                onTemasysPluginReady(isPlugin);
            });
        } else {
            try {
                console.error('Browser does not appear to be WebRTC-capable');
            } catch (e) {
            }
            return;
        }

    },


    getUserMediaWithConstraints: function (RTC, um, success_callback, failure_callback, resolution, bandwidth, fps, desktopStream) {
        var constraints = getConstraints(
            um, resolution, bandwidth, fps, desktopStream);

        console.info("Get media constraints", constraints);

        var self = this;

        try {
            this.getUserMedia(constraints,
                function (stream) {
                    console.log('onUserMediaSuccess');
                    self.setAvailableDevices(RTC, um, true);
                    success_callback(stream);
                },
                function (error) {
                    self.setAvailableDevices(RTC, um, false);
                    console.warn('Failed to get access to local media. Error ',
                        error, constraints);
                    if (failure_callback) {
                        failure_callback(error, resolution);
                    }
                });
        } catch (e) {
            console.error('GUM failed: ', e);
            if (failure_callback) {
                failure_callback(e);
            }
        }
    },

    setAvailableDevices: function (RTC, um, available) {
        var devices = {};
        if (um.indexOf("video") != -1) {
            devices.video = available;
        }
        if (um.indexOf("audio") != -1) {
            devices.audio = available;
        }
        RTC.setDeviceAvailability(devices);
    },

    /**
     * Creates the local MediaStreams.
     * @param RTC the rtc service.
     * @param devices the devices that will be requested
     * @param usageOptions object with devices that should be requested.
     * @param resolution resolution constraints
     * @param dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
     * type: "audio" or "video", isMuted: true/false, videoType: "camera" or "desktop"}
     * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
     * @returns {*} Promise object that will receive the new JitsiTracks
     */
    obtainAudioAndVideoPermissions: function (RTC, devices, usageOptions, resolution, dontCreateJitsiTracks) {
        var self = this;
        // Get AV

        return new Promise(function (resolve, reject) {
            var successCallback = function (stream) {
                var streams = self.successCallback(RTC , stream, usageOptions, resolution);
                resolve(dontCreateJitsiTracks? streams: RTC.createLocalStreams(streams));
            };

            if (!devices)
                devices = ['audio', 'video'];

            var newDevices = [];


            if (usageOptions)
                for (var i = 0; i < devices.length; i++) {
                    var device = devices[i];
                    if (usageOptions[device] === true)
                        newDevices.push(device);
                }
            else
                newDevices = devices;

            if (newDevices.length === 0) {
                successCallback();
                return;
            }

            if (RTCBrowserType.isFirefox() || RTCBrowserType.isTemasysPluginUsed()) {

                // With FF/IE we can't split the stream into audio and video because FF
                // doesn't support media stream constructors. So, we need to get the
                // audio stream separately from the video stream using two distinct GUM
                // calls. Not very user friendly :-( but we don't have many other
                // options neither.
                //
                // Note that we pack those 2 streams in a single object and pass it to
                // the successCallback method.
                var obtainVideo = function (audioStream) {
                    self.getUserMediaWithConstraints(
                        RTC,
                        ['video'],
                        function (videoStream) {
                            return successCallback({
                                audioStream: audioStream,
                                videoStream: videoStream
                            });
                        },
                        function (error, resolution) {
                            console.error(
                                'failed to obtain video stream - stop', error);
                            self.errorCallback(error, resolve, RTC, resolution, dontCreateJitsiTracks);
                        },
                            resolution || '360');
                };
                var obtainAudio = function () {
                    self.getUserMediaWithConstraints(
                        RTC,
                        ['audio'],
                        function (audioStream) {
                            if (newDevices.indexOf('video') !== -1)
                                obtainVideo(audioStream);
                        },
                        function (error) {
                            console.error(
                                'failed to obtain audio stream - stop', error);
                            self.errorCallback(error, resolve, RTC, null, dontCreateJitsiTracks);
                        }
                    );
                };
                if (newDevices.indexOf('audio') !== -1) {
                    obtainAudio();
                } else {
                    obtainVideo(null);
                }
            } else {
                this.getUserMediaWithConstraints(
                    RTC,
                    newDevices,
                    function (stream) {
                        successCallback(stream);
                    },
                    function (error, resolution) {
                        self.errorCallback(error, resolve, RTC, resolution, dontCreateJitsiTracks);
                    },
                        resolution || '360');
            }
        }.bind(this));
    },

    /**
     * Successful callback called from GUM.
     * @param RTC the rtc service
     * @param stream the new MediaStream
     * @param usageOptions the list of the devices that should be queried.
     * @param resolution the resolution of the video stream.
     * @returns {*}
     */
    successCallback: function (RTC, stream, usageOptions, resolution) {
        // If this is FF or IE, the stream parameter is *not* a MediaStream object,
        // it's an object with two properties: audioStream, videoStream.
        if (stream && stream.getAudioTracks && stream.getVideoTracks)
            console.log('got', stream, stream.getAudioTracks().length,
                stream.getVideoTracks().length);
        return this.handleLocalStream(RTC, stream, usageOptions, resolution);
    },

    /**
     * Error callback called from GUM. Retries the GUM call with different resolutions.
     * @param error the error
     * @param resolve the resolve funtion that will be called on success.
     * @param RTC the rtc service
     * @param currentResolution the last resolution used for GUM.
     * @param dontCreateJitsiTracks if <tt>true</tt> objects with the following structure {stream: the Media Stream,
     * type: "audio" or "video", isMuted: true/false, videoType: "camera" or "desktop"}
     * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
     */
    errorCallback: function (error, resolve, RTC, currentResolution, dontCreateJitsiTracks) {
        var self = this;
        console.error('failed to obtain audio/video stream - trying audio only', error);
        var resolution = getPreviousResolution(currentResolution);
        if (typeof error == "object" && error.constraintName && error.name
            && (error.name == "ConstraintNotSatisfiedError" ||
                error.name == "OverconstrainedError") &&
            (error.constraintName == "minWidth" || error.constraintName == "maxWidth" ||
                error.constraintName == "minHeight" || error.constraintName == "maxHeight")
            && resolution != null) {
            self.getUserMediaWithConstraints(RTC, ['audio', 'video'],
                function (stream) {
                    var streams = self.successCallback(RTC, stream, resolution);
                    resolve(dontCreateJitsiTracks? streams: RTC.createLocalStreams(streams));
                }, function (error, resolution) {
                    return self.errorCallback(error, resolve, RTC, resolution, dontCreateJitsiTracks);
                }, resolution);
        }
        else {
            self.getUserMediaWithConstraints(
                RTC,
                ['audio'],
                function (stream) {
                    var streams = self.successCallback(RTC, stream, resolution);
                    resolve(dontCreateJitsiTracks? streams: RTC.createLocalStreams(streams));
                },
                function (error) {
                    console.error('failed to obtain audio/video stream - stop',
                        error);
                    var streams = self.successCallback(RTC, null);
                    resolve(dontCreateJitsiTracks? streams: RTC.createLocalStreams(streams));
                }
            );
        }
    },

    /**
     * Handles the newly created Media Streams.
     * @param service the rtc service
     * @param stream the new Media Streams
     * @param usageOptions the list of the devices that should be queried.
     * @param resolution the resolution of the video stream.
     * @returns {*[]} Promise object with the new Media Streams.
     */
    handleLocalStream: function (service, stream, usageOptions, resolution) {
        var audioStream, videoStream;
        // If this is FF, the stream parameter is *not* a MediaStream object, it's
        // an object with two properties: audioStream, videoStream.
        if (window.webkitMediaStream) {
            audioStream = new webkitMediaStream();
            videoStream = new webkitMediaStream();
            if (stream) {
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
        else if (RTCBrowserType.isFirefox() || RTCBrowserType.isTemasysPluginUsed()) {   // Firefox and Temasys plugin
            if (stream && stream.audioStream)
                audioStream = stream.audioStream;
            else
                audioStream = new DummyMediaStream("dummyAudio");

            if (stream && stream.videoStream)
                videoStream = stream.videoStream;
            else
                videoStream = new DummyMediaStream("dummyVideo");
        }

        var audioMuted = (usageOptions && usageOptions.audio === false),
            videoMuted = (usageOptions && usageOptions.video === false);

        var audioGUM = (!usageOptions || usageOptions.audio !== false),
            videoGUM = (!usageOptions || usageOptions.video !== false);

        return [
                {stream: audioStream, type: "audio", isMuted: audioMuted,
                  isGUMStream: audioGUM, videoType: null},
                {stream: videoStream, type: "video", isMuted: videoMuted,
                  isGUMStream: videoGUM, videoType: "camera",
                  resolution: resolution}
            ];
    },

    createStream: function (stream, isVideo) {
        var newStream = null;
        if (window.webkitMediaStream) {
            newStream = new webkitMediaStream();
            if (newStream) {
                var tracks = (isVideo ? stream.getVideoTracks() : stream.getAudioTracks());

                for (var i = 0; i < tracks.length; i++) {
                    newStream.addTrack(tracks[i]);
                }
            }

        } else {
            // FIXME: this is duplicated with 'handleLocalStream' !!!
            if (stream) {
                newStream = stream;
            } else {
                newStream =
                    new DummyMediaStream(isVideo ? "dummyVideo" : "dummyAudio");
            }
        }

        return newStream;
    }
}

module.exports = RTCUtils;
