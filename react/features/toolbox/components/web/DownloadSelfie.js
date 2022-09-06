// @flow

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import type { AbstractButtonProps } from '../../../base/toolbox/components';
import { AbstractSelfieButton } from '../../../base/toolbox/components';
import jwt_decode from 'jwt-decode';
import React from 'react';

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
    ///This class is used download selfie
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


        this._selfie = () => {
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
        };

        ///Picture selfie functions
        function saveBase64AsFile(base64, fileName) {
            link.setAttribute('href', base64);
            link.setAttribute('download', fileName);
            link.click();
        }

        function selfieTogether(videoReceiver, canvas) {
            let toArr = Array.prototype.slice.call(videoReceiver, 0);

            function getFilename() {
                const now = new Date();
                const timestamp = now.toISOString();
                const room = new RegExp(/(^.+)\s\|/).exec(document.title);
                if (room && room[1] !== '') {
                    return `${room[1]}_${timestamp}`;
                } else {
                    return `polytok_${timestamp}`;
                }
            }

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
                saveBase64AsFile(dataURL, `${getFilename()}.png`);

            } else {
                //alert
            }

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
