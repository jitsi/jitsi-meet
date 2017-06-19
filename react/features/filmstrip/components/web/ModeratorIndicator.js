import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @extends BaseIndicator
 */
class ModeratorIndicator extends BaseIndicator {
    /**
     * Initializes a new ModeratorIndicator instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._classNames = 'focusindicator toolbar-icon right';
        this._iconClass = 'icon-star';
        this._tooltipKey = 'videothumbnail.moderator';
    }
}

export default ModeratorIndicator;
