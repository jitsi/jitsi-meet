// @flow

import {translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import type { AbstractButtonProps } from '../../../base/toolbox/components';
import { AbstractSelfieButton } from '../../../base/toolbox/components';
import jwt_decode from 'jwt-decode';
import React from 'react';
import { toggleRecordTimer } from '../../actions.any';
import { isMobileBrowser } from '../../../base/environment/utils';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID,
    showNotification
} from '../../../notifications';

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
    tooltip = 'Selfie';

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
        let recordedChunks = [];


        let videoFormatSupport;
        let userAgent = navigator.userAgent;
        if (userAgent.match(/chrome/i)) {
            videoFormatSupport = 'webm';
        } else if (userAgent.match(/safari/i)) {
            videoFormatSupport = 'mp4';
        } else {
            videoFormatSupport = 'webm';
        }

        // this.tooltip = decodeJwt.selfie === 'A' ? 'Audio Recorder' : decodeJwt.selfie === 'V' ? 'Video Recorder' : 'Selfie';

        this._selfie = () => {
            ///Audio recorder
/*             if (decodeJwt.selfie === 'A') {
                let audioStreams = getStreamFromTracks();
                if (audioStreams.length > 1) {
                    if (!boolRecording) {
                        this.props.dispatch(toggleRecordTimer());
                        boolRecording = true;
                        // get Stream from Tracks
                        startRecording(audioStreams);
                    } else { // Stop Recording
                        boolRecording = false;
                        this.props.dispatch(toggleRecordTimer());
                        saveRecording();
                    }
                } else {
                    props.dispatch(showNotification({
                        titleKey: 'There is no other participants to record audio',
                        uid: SALESFORCE_LINK_NOTIFICATION_ID,
                        appearance: NOTIFICATION_TYPE.NORMAL
                    }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
                }
            } */  if (decodeJwt.selfie === 'V') {
                ///Video recorder
                let arrayAudioStreams = getVideoStreamFromTracks('audio');
                if (arrayAudioStreams.length > 1) {
                    if (!boolRecording) {
                        canvas = document.createElement('canvas');
                        canvas.width = 1080;
                        canvas.height = 720;
                        const videos = document.getElementsByTagName('video');
                        if (videos.length > 0) {
                            // get Stream from Tracks
                            if (arrayAudioStreams.length > 0) {
                                this.props.dispatch(toggleRecordTimer());
                                boolRecording = true;
                                startVideoRecording(videos, canvas, arrayAudioStreams);
                            } else { // warn user - participants must be 2

                            }
                        }
                    } else {
                        boolRecording = false;
                        this.props.dispatch(toggleRecordTimer());
                        saveVideoRecording();
                    }
                } else {
                    props.dispatch(showNotification({
                        titleKey: 'There is no other participants to record video',
                        uid: SALESFORCE_LINK_NOTIFICATION_ID,
                        appearance: NOTIFICATION_TYPE.NORMAL
                    }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
                }
            } else if(decodeJwt.selfie === 'P') {
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
            console.log('audioStreams11', audioStreams);
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
        function startVideoRecording(videoReceiver, canvas, audioStreams) {

            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function attachAudioSources() {
                function createAudioNodes(stream) {
                    audCtx.createMediaStreamSource(stream)
                        .connect(audioDestinationNode);
                }

                audioStreams.forEach(createAudioNodes);
                console.log('AudioDestinationNode Stream Tracks ', audioDestinationNode.stream.getTracks());
                return audioDestinationNode.stream.getTracks();
            }

            let audioStreamTracks = attachAudioSources();
            console.log(`audioStreamTracks ${audioStreamTracks}`);

            let toArr = Array.prototype.slice.call(videoReceiver, 0);
            let participantVideo;

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


            function arrayRemove(arr, value) {
                return arr.filter(function(ele) {
                    console.log('Ele Id ', ele.id);
                    return ele.id !== value;
                });
            }

            function paintCanvas(filtered, context2D) {
                for (let i = 0; i < filtered.length; i++) {
                    context2D.drawImage(filtered[i], (i) * (canvas.width / filtered.length), 0, canvas.width / filtered.length, canvas.height);
                }
            }

            let filtered = arrayRemove(toArr, 'largeVideo');
            console.log('Filtered ', filtered);

            let context2D = canvas.getContext('2d');
            setIntervalID = setInterval(() => {
                paintCanvas(filtered, context2D);
            }, 30);


            let clubbedStream = canvas.captureStream();
            audioStreamTracks.forEach((track) => clubbedStream.addTrack(track));

            console.log(clubbedStream.getTracks());
            console.log(clubbedStream.getAudioTracks());
            console.log(clubbedStream.getVideoTracks());


            const options = { mimeType: `video/${videoFormatSupport}` };
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(clubbedStream, options);

            function handleDataAvailable(event) {
                console.log('data-available ', event);
                console.log('data-available ', event.data);
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                    console.log(recordedChunks);
                    // download();
                } else {
                    // …
                    console.log('event.data.size is ', event.data.size);
                }
            }

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

            const download = () => {
                console.log('Playing stopped ', recordedChunks);

                const blob = new Blob(recordedChunks, { type: `video/${videoFormatSupport}` });
                const videoObjectURL = URL.createObjectURL(blob);
                console.log('VideoUrl, ', videoObjectURL);

                const a = document.createElement('a');
                a.style = 'display: none';
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
            };
            mediaRecorder.ondataavailable = handleDataAvailable;

            mediaRecorder.addEventListener('stop', download);
            mediaRecorder.start();

        }

        function saveVideoRecording() {
            mediaRecorder.stop();
        }

        function filterVideoStreamsByMediaType(arr, value) {
            return arr.filter(function(ele) {
                console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} and is ${ele.jitsiTrack} `);
                return ele.jitsiTrack.type === value;
            })
                .map(function(ele) {
                    return ele.jitsiTrack.stream;
                });
        }

        function getVideoStreamFromTracks(mediaType) {
            let tracks = APP.store.getState()['features/base/tracks'];

            let arrayMediaStreams = filterVideoStreamsByMediaType(tracks, mediaType);
            console.log(`${mediaType} streams length ${arrayMediaStreams.length}`);
            return arrayMediaStreams;
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
        this._selfie();

    }
}

export default translate(connect()(DownloadSelfie));
