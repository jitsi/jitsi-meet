import React, { ReactElement } from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { ACTION_SHORTCUT_TRIGGERED, VIDEO_MUTE, createShortcutEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IGUMPendingState } from '../../../base/media/types';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import Spinner from '../../../base/ui/components/web/Spinner';
import { registerShortcut, unregisterShortcut } from '../../../keyboard-shortcuts/actions';
import { SPINNER_COLOR } from '../../constants';
import AbstractVideoMuteButton, {
    IProps as AbstractVideoMuteButtonProps,
    mapStateToProps as abstractMapStateToProps
} from '../AbstractVideoMuteButton';

const styles = () => {
    return {
        pendingContainer: {
            position: 'absolute' as const,
            bottom: '3px',
            right: '3px'
        }
// TODO: Ideally, these should come from a theme provider or imported from SCSS variables
// For now, hardcoding based on _variables.scss
const themeColors = {
    backgroundColorDark: '#1A1E2D',
    textColorPrimary: '#FFFFFF',
    primaryColor: '#7B61FF',
    disabledColor: '#5E6272', // A dimmer color for disabled state
    hoverColor: '#252A3A' // Slightly lighter than backgroundColorDark for hover
};

const styles = ()_theme => { // tss-react can take theme as an argument
    return {
        button_override: { // Class to apply to the AbstractButton
            backgroundColor: themeColors.backgroundColorDark,
            borderRadius: '50%',
            width: '44px', // Adjust size as needed
            height: '44px',
            padding: 0, // Remove default padding if any from AbstractButton
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 4px', // Minimal margin between buttons
            border: 'none', // Remove any default border
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)', // Subtle shadow

            '&.disabled': {
                backgroundColor: themeColors.disabledColor,
                boxShadow: 'none',
                cursor: 'not-allowed',

                '& .jitsi-icon svg': {
                    fill: themeColors.textColorPrimary + '80', // Dim the icon
                }
            },

            '&:not(.disabled):hover': {
                backgroundColor: themeColors.hoverColor,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            },

            // Style for the icon itself if needed, though currentColor should work
            '& .jitsi-icon svg': {
                fill: themeColors.textColorPrimary, // Default icon color
                width: '24px', // Adjust icon size
                height: '24px',
            },
        },
        toggledButton: { // Specifically for when the video is "off" (muted)
            // The Dribbble design shows the main action buttons (mic, cam) having a purple icon when "active" / "warning"
            // For video mute button, "video off" is the "active" state of being muted.
            '& .jitsi-icon svg': {
                fill: themeColors.primaryColor, // Purple icon when video is off
                // The video-off.svg includes a line-through, so this color change is the primary indicator
            }
        },
        pendingContainer: {
            position: 'absolute' as const,
            bottom: '3px',
            right: '3px'
        }
    };
};

/**
 * The type of the React {@code Component} props of {@link VideoMuteButton}.
 */
export interface IProps extends AbstractVideoMuteButtonProps {

    /**
     * The gumPending state from redux.
     */
    _gumPending: IGUMPendingState;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments AbstractVideoMuteButton
 */
class VideoMuteButton extends AbstractVideoMuteButton<IProps> {
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
            character: 'V',
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
        this.props.dispatch(unregisterShortcut('V'));
    }

    /**
     * Gets the current accessibility label, taking the toggled and GUM pending state into account. If no toggled label
     * is provided, the regular accessibility label will also be used in the toggled state.
     *
     * The accessibility label is not visible in the UI, it is meant to be used by assistive technologies, mainly screen
     * readers.
     *
     * @private
     * @returns {string}
     */
    override _getAccessibilityLabel() {
        const { _gumPending } = this.props;

        if (_gumPending === IGUMPendingState.NONE) {
            return super._getAccessibilityLabel();
        }

        return 'toolbar.accessibilityLabel.videomuteGUMPending';
    }

    /**
     * Gets the current label, taking the toggled and GUM pending state into account. If no
     * toggled label is provided, the regular label will also be used in the toggled state.
     *
     * @private
     * @returns {string}
     */
    override _getLabel() {
        const { _gumPending } = this.props;

        if (_gumPending === IGUMPendingState.NONE) {
            return super._getLabel();
        }

        return 'toolbar.videomuteGUMPending';
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isVideoMuted() {
        if (this.props._gumPending === IGUMPendingState.PENDING_UNMUTE) {
            return false;
        }

        return super._isVideoMuted();
    }

    /**
     * Returns a spinner if there is pending GUM.
     *
     * @returns {ReactElement | null}
     */
    override _getElementAfter(): ReactElement | null {
        const { _gumPending } = this.props;
        const classes = withStyles.getClasses(this.props);

        if (_gumPending !== IGUMPendingState.NONE) {
            return (
                <div className = { classes.pendingContainer }>
                    <Spinner
                        color = { SPINNER_COLOR } // May need to be themeColors.textColorPrimary
                        size = 'small' />
                </div>
            );
        }

        return null;
    }

    /**
     * Overrides AbstractButton's_className to apply new styles.
     *
     * @override
     * @protected
     * @returns {string}
     */
    override get _className() {
        const classes = withStyles.getClasses(this.props);
        let className = `dribbble-toolbox-button ${classes.button_override}`;

        if (this._isVideoMuted()) {
            className += ` ${classes.toggledButton}`; // Apply special style if video is muted
        }

        if (this._isDisabled()) {
            className += ' disabled';
        }

        return className;
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
                VIDEO_MUTE,
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
    const { gumPending } = state['features/base/media'].video;

    return {
        ...abstractMapStateToProps(state),
        _gumPending: gumPending
    };
}

export default withStyles(translate(connect(_mapStateToProps)(VideoMuteButton)), styles);
