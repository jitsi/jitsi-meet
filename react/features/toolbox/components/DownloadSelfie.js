// @flow

import {translate} from '../../base/i18n';
import {connect} from '../../base/redux';
import type {AbstractButtonProps} from '../../base/toolbox/components';
import {AbstractSelfieButton} from "../../base/toolbox/components";

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
class DownloadSelfie extends AbstractSelfieButton<Props, *> {
    _selfie: Function;
    accessibilityLabel = 'toolbar.accessibilityLabel.selfie';
    label = 'toolbar.selfie';
    tooltip = 'selfie';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    constructor(props: Props) {
        super(props);
        let link;

        this._selfie = () => {
            console.log('HIIIIIIIIIIIIII')
            const videos = document.getElementsByTagName('video');

            console.log('HIIIIIIIIIIIIII1', videos.length);

            let canvas = document.createElement('canvas');

           if(videos.length>0){
               canvas.width = videos[0].videoWidth;
               canvas.height = videos[0].videoHeight;

               link = document.createElement("a");
               document.body.appendChild(link); // for Firefox
               for (let i = 0; i < videos.length; i++) {
                   selfieTogether(videos[i], canvas);
               }
               console.log('HIIIIIIIIIIIIII2', videos.length);
           }

            // this._selfieTogether(video, canvas);
            // this._selfieTogether(video1);
        };

        function saveBase64AsFile(base64, fileName) {
            console.log('HIIIIIIIIIIIIII3')

            link.setAttribute("href", base64);
            link.setAttribute("download", fileName);
            link.click();
        }

        function selfieTogether(videoReceiver, canvas) {
            console.log('HIIIIIIIIIIIIII4')

            canvas.getContext('2d').drawImage(videoReceiver, 0, 0, canvas.width, canvas.height);
            let dataURL = canvas.toDataURL("image/png");
            saveBase64AsFile(dataURL, "sample.png");
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
