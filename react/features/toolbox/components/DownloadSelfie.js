// @flow

import { getLocalizedDurationFormatter, translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import type { AbstractButtonProps } from '../../base/toolbox/components';
import { AbstractSelfieButton } from '../../base/toolbox/components';
import jwt_decode from 'jwt-decode';
import React from 'react';
import { toggleRecordTimer } from '../actions.any';
import { isMobileBrowser } from '../../base/environment/utils';

/**
 * The type of the React {@code Component} props of {@link DownloadButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implements an {@link AbstractSelfieButton} to open the user documentation in a new window.
 */
    ///This class is used download selfie, audio recorder and video recorder
class DownloadSelfie extends AbstractSelfieButton<Props, *> {
    _selfie: Function;
    accessibilityLabel = 'toolbar.accessibilityLabel.selfie';
    label = 'toolbar.selfie';
    tooltip;

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    constructor(props: Props) {
        super(props);
        const jwt = APP.store.getState()['features/base/jwt'];
        console.log('JWTToken', jwt.jwt);
        const decodeJwt = jwt_decode(jwt.jwt);
        console.log('decodeJwt', decodeJwt);
        let link;
        let boolRecording = false;
        let mediaRecorder;
        let setIntervalID;
        let canvas;

        let videoFormatSupport;
        let userAgent = navigator.userAgent;

        if (userAgent.match(/chrome/i)) {
            videoFormatSupport = 'webm';
        } else {
            videoFormatSupport = 'mp4';
        }

        this.tooltip = decodeJwt.selfie === 'A' ? 'Audio Recorder' : decodeJwt.selfie === 'V' ? 'Video Recorder' : 'Selfie';

        this._selfie = () => {
            ///Audio recorder
            if (decodeJwt.selfie === 'A') {
                if (!boolRecording) {
                    this.props.dispatch(toggleRecordTimer());
                    boolRecording = true;
                    // get Stream from Tracks
                    let audioStreams = getStreamFromTracks();
                    startRecording(audioStreams);
                } else { // Stop Recording
                    boolRecording = false;
                    this.props.dispatch(toggleRecordTimer());
                    saveRecording();
                }
            } else if (decodeJwt.selfie === 'V') {
                ///Video recorder
                if (!boolRecording) {
                    canvas = document.createElement('canvas');
                    // get Stream from Tracks
                    let arrayAudioStreams = getVideoStreamFromTracks('audio');
                    getVideoStreamFromCanvas();
                    if (arrayAudioStreams.length > 0) {
                        this.props.dispatch(toggleRecordTimer());
                        boolRecording = true;
                        startVideoRecording(arrayAudioStreams);
                    } else { // warn user - participants must be 2

                    }
                } else { // Stop Recording
                    boolRecording = false;
                    this.props.dispatch(toggleRecordTimer());
                    saveVideoRecording();
                }
            } else {
                ///Picture Selfie
                const videos = document.getElementsByTagName('video');
                let canvas = document.createElement('canvas');
                if (videos.length > 0) {
                    canvas.width = 1080;
                    canvas.height = 720;

                    link = document.createElement('a');
                    document.body.appendChild(link); // for Firefox
                    selfieTogether(videos, canvas);
                }
            }
        };

        ///Picture selfie functions
        function saveBase64AsFile(base64, fileName) {
            link.setAttribute('href', base64);
            link.setAttribute('download', fileName);
            link.click();
        }

        function selfieTogether(videoReceiver, canvas) {
            let toArr = Array.prototype.slice.call(videoReceiver, 0);

            function arrayRemove(arr, value) {
                return arr.filter(function(ele) {
                    return ele.id !== value;
                });
            }

            let participantVideo = null;

            function getParticipantVideo() {

                toArr.some((obj) => {
                    if (obj.id.includes('remote')) {
                        participantVideo = obj;
                        return true;
                    }
                    return false;
                });
            }

            getParticipantVideo();

            if (participantVideo) {
                let filtered = arrayRemove(toArr, 'largeVideo');
                for (let i = 0; i < filtered.length; i++) {
                    canvas.getContext('2d')
                        .drawImage(filtered[i], (i) * ((canvas.width) / filtered.length), 0, (canvas.width) / filtered.length, canvas.height);
                }
                let dataURL = canvas.toDataURL('image/png');
                saveBase64AsFile(dataURL, 'sample.png');

            } else {
                //alert
            }

        }


        ///Audio recording functions
        function startRecording(audioStreams) {
            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function createAudioNodes(stream) {
                audCtx.createMediaStreamSource(stream)
                    .connect(audioDestinationNode);
            }

            audioStreams.forEach(createAudioNodes);

            let audioChunks = [];

            mediaRecorder = new MediaRecorder(audioDestinationNode.stream);

            mediaRecorder.addEventListener('dataavailable', event => {
                console.log('Data Available ', event);
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                console.log('Playing stooped ', audioChunks);
                const audioBlob = new Blob(audioChunks, { 'type': 'audio/mp4; codecs=opus' });
                const audioUrl = URL.createObjectURL(audioBlob);
                console.log('AudioUrl, ', audioUrl);

                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = audioUrl;
                if (isMobileBrowser()) {
                    a.download = `${getFilename()}`;
                    document.body.appendChild(a);
                } else {
                    a.download = `${getFilename()}.webm`;
                    document.body.appendChild(a);
                }

                a.onclick = () => {
                    console.log(`${a.download} save option shown`);
                    setTimeout(() => {
                        console.log('SetTimeOut Called');
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(audioUrl);
                    }, 2000);
                };
                a.click();
            });

            /**
             * Returns a filename based ono the Jitsi room name in the URL and timestamp
             * */
            function getFilename() {
                const now = new Date();
                const timestamp = now.toISOString();
                const room = new RegExp(/(^.+)\s\|/).exec(document.title);

                if (room && room[1] !== '') {
                    console.log('timestamp11', `${room[1]}_${timestamp}`);
                    return `${room[1]}_${timestamp}`;
                } else {
                    return `polytokRecording_${timestamp}`;
                }
            }

            mediaRecorder.start();
        }

        function saveRecording() {
            mediaRecorder.stop();
        }

        function filterStreamsByMediaType(arr, value) {
            return arr.filter(function(ele) {
                console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} `);
                return ele.jitsiTrack.type === value;
            })
                .map(function(ele) {
                    return ele.jitsiTrack.stream;
                });
        }

        function getStreamFromTracks() {
            let tracks = APP.store.getState()['features/base/tracks'];

            let valueToFilter = 'audio';
            let audioStreams = filterStreamsByMediaType(tracks, valueToFilter);

            console.log(`${valueToFilter} streams length ${audioStreams.length}`);

            return audioStreams;

        }


        ///Video recording functions
        function getVideoStreamFromCanvas() {
            const videosElementsCollection = document.getElementsByTagName('video');
            let videoElementsArray = Array.prototype.slice.call(videosElementsCollection, 0);

            function arrayRemove(arr, value) {
                return arr.filter(function(ele) {
                    return ele.id !== value;
                });
            }

            let filteredVideo = arrayRemove(videoElementsArray, 'largeVideo');
            console.log(`Filtered Videos ${filteredVideo}`);

            function clubVideos() {
                function paintCanvas() {
                    for (let i = 0; i < filteredVideo.length; i++) {
                        canvas.getContext('2d')
                            .drawImage(filteredVideo[i], (i) * ((canvas.width) / filteredVideo.length), 0, (canvas.width) / filteredVideo.length, canvas.height);
                    }
                }

                setIntervalID = setInterval(paintCanvas, 30);
            }

            clubVideos();

        }

        function startVideoRecording(audioStreams) {
            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function attachAudioSources() {
                function createAudioNodes(stream) {
                    audCtx.createMediaStreamSource(stream)
                        .connect(audioDestinationNode);
                }

                audioStreams.forEach(createAudioNodes);
                return audioDestinationNode.stream.getTracks();
            }

            function prepareRecorder() {
                let recorderChunks = [];

                let audioStreamTracks = attachAudioSources();
                console.log(`audioStreamTracks ${audioStreamTracks}`);
                let videoStreamTracks = canvas.captureStream()
                    .getTracks();
                console.log(`videoStreamTracks ${videoStreamTracks}`);
                let mediaStreamToRecord =
                    new MediaStream(audioStreamTracks.concat(videoStreamTracks));
                console.log(`MediaStreamToRecord ${mediaStreamToRecord}`);


                /**
                 * Returns a filename based ono the Jitsi room name in the URL and timestamp
                 * */
                function getFilename() {
                    const now = new Date();
                    const timestamp = now.toISOString();
                    const room = new RegExp(/(^.+)\s\|/).exec(document.title);
                    if (room && room[1] !== '') {
                        return `${room[1]}_${timestamp}`;
                    } else {
                        return `polytokRecording_${timestamp}`;
                    }
                }

                mediaRecorder = new MediaRecorder(mediaStreamToRecord, { mimeType: `video/${videoFormatSupport}` });

                mediaRecorder.addEventListener('dataavailable', event => {
                    console.log('Data Available ', event);
                    recorderChunks.push(event.data);
                });

                mediaRecorder.addEventListener('stop', () => {
                    console.log('Playing stooped ', recorderChunks);
                    const videoBlob = new Blob(recorderChunks, { type: `video/${videoFormatSupport}` });
                    const videoObjectURL = URL.createObjectURL(videoBlob);
                    console.log('VideoUrl, ', videoObjectURL);

                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = videoObjectURL;
                    a.download = `${getFilename()}.${videoFormatSupport}`;
                    document.body.appendChild(a);

                    a.onclick = () => {
                        console.log(`${a.download} save option shown`);
                        setTimeout(() => {
                            console.log('SetTimeOut Called');
                            document.body.removeChild(a);
                            clearInterval(setIntervalID);
                            window.URL.revokeObjectURL(videoObjectURL);
                        }, 7000);
                    };
                    a.click();
                });
            }

            prepareRecorder();
            mediaRecorder.start();

        }

        function getVideoStreamFromTracks(mediaType) {
            let tracks = APP.store.getState()['features/base/tracks'];

            function filterStreamsByMediaType(arr, value) {
                return arr.filter(function(ele) {
                    console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} `);
                    return ele.jitsiTrack.type === value;
                })
                    .map(function(ele) {
                        return ele.jitsiTrack.stream;
                    });
            }

            let arrayMediaStreams = filterStreamsByMediaType(tracks, mediaType);
            console.log(`${mediaType} streams length ${arrayMediaStreams.length}`);
            return arrayMediaStreams;
        }

        function saveVideoRecording() {
            mediaRecorder.stop();
        }
    }

    /**
     * Helper function to perform the download action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _downloadSelfie() {
        this._selfie()

    }
}

export default translate(connect()(DownloadSelfie));
