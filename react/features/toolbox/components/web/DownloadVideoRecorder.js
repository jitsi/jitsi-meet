// @flow

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import type { AbstractButtonProps } from '../../../base/toolbox/components';
import { AbstractSelfieButton } from '../../../base/toolbox/components';
import { toggleRecordTimer } from '../../actions.any';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID,
    showNotification
} from '../../../notifications';
import { getFeatureFlag, VIDEO_MUTE_BUTTON_ENABLED } from '../../../base/flags';
import { isVideoMuteButtonDisabled } from '../../functions';
import {
    getLocalVideoType,
    isLocalCameraTrackMuted
} from '../../../base/tracks';
import { isMobileBrowser } from '../../../base/environment/utils';

/**
 * The type of the React {@code Component} props of {@link DownloadButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean,
};

/**
 * Implements an {@link AbstractSelfieButton} to open the user documentation in a new window.
 */


    ///This class is used download Video Recorder
class DownloadVideoRecorder extends AbstractSelfieButton<Props, *> {
    _videoRecorder: Function;
    accessibilityLabel = 'toolbar.accessibilityLabel.selfie';
    label = 'toolbar.selfie';
    tooltip = 'Video Recorder';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */


    constructor(props: Props) {
        super(props);
        let boolRecording = false;
        let canvas;
        let mediaRecorder;
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

        this._videoRecorder = () => {
            console.log('videoStatus', this._isVideoMuted());
            let arrayAudioStreams = getVideoStreamFromTracks('audio');
            if (arrayAudioStreams.length > 1) {
                if (!boolRecording) {
                    if (this._isVideoMuted() === false) {
                        canvas = document.createElement('canvas');
                        canvas.style.width = 1080;
                        canvas.style.height = 720;
                        const videos = document.getElementsByTagName('video');
                        if (videos.length > 0) {
                            // get Stream from Tracks
                            if (arrayAudioStreams.length > 0) {
                                this.props.dispatch(toggleRecordTimer());
                                boolRecording = true;
                                videoRecorder(videos, canvas, arrayAudioStreams);
                            }
                        }
                    } else {
                        props.dispatch(showNotification({
                            titleKey: 'Turn on video to start recording',
                            uid: SALESFORCE_LINK_NOTIFICATION_ID,
                            appearance: NOTIFICATION_TYPE.NORMAL
                        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
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
        };

        function videoRecorder(videoReceiver, canvas, audioStreams) {

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


            if (participantVideo) {
                let filtered = arrayRemove(toArr, 'largeVideo');
                console.log('Filtered ', filtered);

                let context2D = canvas.getContext('2d');
                let intervalRecord = setInterval(() => {
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

                function download() {
                    console.log('Playing stopped ', recordedChunks);
                    if (isMobileBrowser()) {
                        let videoFileReader = new FileReader();
                        videoFileReader.readAsDataURL(recordedChunks[0]);
                        let base64data;
                        videoFileReader.onloadend = function() {
                            base64data = videoFileReader.result;
                            console.log('base64data', base64data);

                            if (window.flutter_inappwebview) {
                                let args = base64data;
                                console.log('beforeVideoArgs', args);
                                window.flutter_inappwebview.callHandler('handleVideoArgs', args);
                                console.log('afterVideoArgs', args);
                            }
                        };
                    } else {
                        const blob = new Blob(recordedChunks, { 'type': 'video/webm codecs=opus' });
                        const videoObjectURL = URL.createObjectURL(blob);
                        console.log('VideoUrl, ', videoObjectURL);
                        const a = document.createElement('a');
                        a.style = 'display: none';
                        a.href = videoObjectURL;
                        a.download = `${getFilename()}.webm`;
                        document.body.appendChild(a);

                        a.onclick = () => {
                            console.log(`${a.download} save option shown`);
                            setTimeout(() => {
                                console.log('SetTimeOut Called');
                                document.body.removeChild(a);
                                clearInterval(intervalRecord);
                                window.URL.revokeObjectURL(videoObjectURL);
                            }, 7000);
                        };
                        a.click();
                    }
                }


                mediaRecorder.ondataavailable = handleDataAvailable;

                mediaRecorder.addEventListener('stop', download);

                mediaRecorder.start();

            } else {
                //alert
            }

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

        function saveVideoRecording() {
            mediaRecorder.stop();
        }
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.props._videoMuted;
    }

    /**
     * Helper function to perform the download action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _downloadVideoRecorder() {
        this._videoRecorder();

    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const tracks = state['features/base/tracks'];
    const enabledFlag = getFeatureFlag(state, VIDEO_MUTE_BUTTON_ENABLED, true);

    return {
        _audioOnly: Boolean(audioOnly),
        _videoDisabled: isVideoMuteButtonDisabled(state),
        _videoMediaType: getLocalVideoType(tracks),
        _videoMuted: isLocalCameraTrackMuted(tracks),
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(DownloadVideoRecorder));
