import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { translate } from '../../../base/i18n/functions';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';


/**
 * The type of the React {@code Component} props of {@link OverflowToggleButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether the more options menu is open.
     */
    isOpen: boolean;

    /**
     * External handler for key down action.
     */
    onKeyDown: Function;
}

/**
 * Implementation of a button for toggling the overflow menu.
 */
class OverflowToggleButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeMoreActions';
    override icon = IconDotsHorizontal; // Uses dots-horizontal.svg
    override label = 'toolbar.moreActions';
    override toggledLabel = 'toolbar.moreActions';
    override tooltip = 'toolbar.moreActions';

    /**
     * Overrides AbstractButton's_className to apply new styles.
     *
     * @override
     * @protected
     * @returns {string}
     */
    override get _className() {
        // @ts-ignore
        const classes = withStyles.getClasses(this.props);
        let className = `dribbble-toolbox-button ${classes.button_override}`;

        if (this._isToggled()) {
            className += ` ${classes.toggledButton}`;
        }

        // No specific disabled state styling for this button in this context,
        // as it's generally always enabled if visible.
        // if (this._isDisabled()) {
        // className += ' disabled';
        // }

        return className;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props.isOpen;
    }

    /**
     * Indicates whether a key was pressed.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _onKeyDown() {
        this.props.onKeyDown();
    }
}

// Define styles similar to other Dribbble-styled buttons
// TODO: Ideally, these should come from a theme provider or imported from SCSS variables
// For now, hardcoding based on _variables.scss
const themeColors = {
    backgroundColorDark: '#1A1E2D',
    textColorPrimary: '#FFFFFF',
    primaryColor: '#7B61FF',
    // disabledColor: '#5E6272', // Not typically disabled
    hoverColor: '#252A3A'
};

// @ts-ignore
const styles = _theme => {
    return {
        button_override: {
            backgroundColor: themeColors.backgroundColorDark,
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 4px',
            border: 'none',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',

            '&:hover': { // No disabled check needed here usually
                backgroundColor: themeColors.hoverColor,
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            },
            '& .jitsi-icon svg': {
                fill: themeColors.textColorPrimary,
                width: '24px',
                height: '24px',
            },
        },
        toggledButton: { // Specifically for when the overflow menu is "open"
            '& .jitsi-icon svg': {
                fill: themeColors.primaryColor, // Purple icon when menu is open
            }
        }
    };
};

// Apply withStyles HOC
// @ts-ignore
export default connect()(translate(withStyles(OverflowToggleButton, styles)));
