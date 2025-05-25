import React, { ReactElement } from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { ACTION_SHORTCUT_TRIGGERED, AUDIO_MUTE, createShortcutEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IGUMPendingState } from '../../../base/media/types';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import Spinner from '../../../base/ui/components/web/Spinner';
import { registerShortcut, unregisterShortcut } from '../../../keyboard-shortcuts/actions';
import { SPINNER_COLOR } from '../../constants';
import AbstractAudioMuteButton, {
    IProps as AbstractAudioMuteButtonProps,
    mapStateToProps as abstractMapStateToProps
} from '../AbstractAudioMuteButton';

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

            '&.toggled': { // When button is in "on" or "active" state (e.g., mic is unmuted)
                // For mic, "toggled" often means unmuted (icon changes, not background)
                // The icon itself will change (mic vs mic-disabled)
                // If mic is unmuted (icon is IconMic), and we want to show it as "active"
                // This style might be for when it's explicitly "on" not "off"
            },

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
        toggledButton: { // Specifically for when the mic is "muted" (icon is IconMicDisabled)
            // The Dribbble design shows the main action buttons (mic, cam) having a purple icon when "active" / "warning"
            // For mute button, "muted" is the "active" state of being muted.
            '& .jitsi-icon svg': {
                fill: themeColors.primaryColor, // Purple icon when muted
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
 * The type of the React {@code Component} props of {@link AudioMuteButton}.
 */
interface IProps extends AbstractAudioMuteButtonProps {

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
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @augments AbstractAudioMuteButton
 */
class AudioMuteButton extends AbstractAudioMuteButton<IProps> {
    /**
     * Initializes a new {@code AudioMuteButton} instance.
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
     * Registers the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this.props.dispatch(registerShortcut({
            character: 'M',
            helpDescription: 'keyboardShortcuts.mute',
            handler: this._onKeyboardShortcut
        }));
    }

    /**
     * Unregisters the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        this.props.dispatch(unregisterShortcut('M'));
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

        return 'toolbar.accessibilityLabel.muteGUMPending';
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

        return 'toolbar.muteGUMPending';
    }

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isAudioMuted() {
        if (this.props._gumPending === IGUMPendingState.PENDING_UNMUTE) {
            return false;
        }

        return super._isAudioMuted();
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

        if (this._isAudioMuted()) {
            className += ` ${classes.toggledButton}`; // Apply special style if muted
        }

        if (this._isDisabled()) {
            className += ' disabled';
        }

        return className;
    }

    /**
     * Overrides AbstractButton's icon to adjust for new styling if necessary.
     * For now, we rely on AbstractAudioMuteButton's icon logic.
     *
     * @override
     * @protected
     * @returns {ReactElement}
     */
    // override get _icon() {
    //     // return custom icon component or modify props.icon
    // }


    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the audio muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        // Ignore keyboard shortcuts if the audio button is disabled.
        if (this._isDisabled()) {
            return;
        }

        sendAnalytics(
            createShortcutEvent(
                AUDIO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isAudioMuted() }));

        AbstractButton.prototype._onClick.call(this);
    }

    /**
     * Returns a spinner if there is pending GUM.
     *
     * @returns {ReactElement | null}
     */
    override _getElementAfter(): ReactElement | null {
        const { _gumPending } = this.props;
        const classes = withStyles.getClasses(this.props);

        // Ensure spinner is visible with new button style
        if (_gumPending !== IGUMPendingState.NONE) {
            return (
                <div className = { classes.pendingContainer }>
                    <Spinner
                        color = { SPINNER_COLOR } // This might need to be themeColors.textColorPrimary
                        size = 'small' />
                </div>
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _disabled: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const { gumPending } = state['features/base/media'].audio;

    return {
        ...abstractMapStateToProps(state),
        _gumPending: gumPending
    };
}

export default withStyles(translate(connect(_mapStateToProps)(AudioMuteButton)), styles);
