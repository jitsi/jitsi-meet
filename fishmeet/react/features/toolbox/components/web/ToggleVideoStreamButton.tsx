import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { ACTION_SHORTCUT_TRIGGERED, VIDEO_STREAM_MUTE, createShortcutEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { registerShortcut, unregisterShortcut } from '../../../keyboard-shortcuts/actions';
import AbstractVideoMuteButton, {
    IProps as ToggleVideoStreamButtonProps,
    mapStateToProps as abstractMapStateToProps
} from '../AbstractToggleVideoStreamButton';

const styles = () => {
    return {
        pendingContainer: {
            position: 'absolute' as const,
            bottom: '3px',
            right: '3px'
        }
    };
};

/**
 * The type of the React {@code Component} props of {@link ToggleVideoStreamButtonButton}.
 */
export interface IProps extends ToggleVideoStreamButtonProps {

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
}

/**
 * Component that renders a toolbar button for toggling video stream.
 *
 * @augments AbstractVideoMuteButton
 */
class ToggleVideoStreamButtonButton extends AbstractVideoMuteButton<IProps> {

    /**
     * Initializes a new {@code VideoMuteButton} instance.
     *
     * @param {IProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onKeyboardShortcut = this._onKeyboardShortcut.bind(this);
        this._getTooltip = this._getLabel;
    }

    /**
     * Registers the keyboard shortcut that toggles the video muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this.props.dispatch(registerShortcut({
            character: 'Z',
            helpDescription: 'keyboardShortcuts.videoMute',
            handler: this._onKeyboardShortcut
        }));
    }

    /**
     * Unregisters the keyboard shortcut that toggles the video muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        this.props.dispatch(unregisterShortcut('Z'));
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isVideoMuted() {
        return super._isVideoMuted();
    }

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the video muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        // Ignore keyboard shortcuts if the video button is disabled.
        if (this._isDisabled()) {
            return;
        }

        sendAnalytics(
            createShortcutEvent(
                VIDEO_STREAM_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isVideoMuted() }));

        AbstractButton.prototype._onClick.call(this);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {

    return {
        ...abstractMapStateToProps(state),
    };
}

export default withStyles(translate(connect(_mapStateToProps)(ToggleVideoStreamButtonButton)), styles);
