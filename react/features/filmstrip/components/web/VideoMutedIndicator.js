import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing a video muted icon with a tooltip.
 *
 * @extends BaseIndicator
 */
class VideoMutedIndicator extends BaseIndicator {
    /**
     * Initializes a new VideoMutedIndicator instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._classNames = 'videoMuted toolbar-icon';
        this._iconClass = 'icon-camera-disabled';
        this._tooltipKey = 'videothumbnail.videomute';
    }
}

export default VideoMutedIndicator;
