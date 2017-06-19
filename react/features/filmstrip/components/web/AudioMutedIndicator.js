import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing an audio muted icon with a tooltip.
 *
 * @extends BaseIndicator
 */
class AudioMutedIndicator extends BaseIndicator {
    /**
     * Initializes a new AudioMutedIcon instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._classNames = 'audioMuted toolbar-icon';
        this._iconClass = 'icon-mic-disabled';
        this._tooltipKey = 'videothumbnail.mute';
    }
}

export default AudioMutedIndicator;
