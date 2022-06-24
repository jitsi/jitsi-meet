// @flow

import {createToolbarEvent, sendAnalytics} from '../../analytics';
import {translate} from '../../base/i18n';
import {connect} from '../../base/redux';
import type {AbstractButtonProps} from '../../base/toolbox/components';
import {AbstractSelfieButton} from "../../base/toolbox/components";
import _ from "lodash";

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
        const video = document.querySelector('#largeVideo');
        let canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;

        this._selfie = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            let dataURL = canvas.toDataURL("image/png");
            saveBase64AsFile(dataURL, "sample.png");
        };

        function saveBase64AsFile(base64, fileName) {
            let link = document.createElement("a");
            document.body.appendChild(link); // for Firefox
            link.setAttribute("href", base64);
            link.setAttribute("download", fileName);
            link.click();
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
