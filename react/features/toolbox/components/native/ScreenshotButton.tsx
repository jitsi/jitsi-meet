
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconImage } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';


/**
 * The type of the React {@code Component} props of {@link ScreenshotButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function;

    /**
     * Whether screenshots are enabled.
     */
    _screenshotEnabled: boolean;
}

/**
 * An implementation of a button to toggle screenshot mode.
 */
class ScreenshotButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.screenshot';
    icon = IconImage;
    label = 'toolbar.screenshot';
    toggledIcon = IconImage;

    /**
     * Handles clicking / pressing the button.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        // In a real implementation this would call a native module to
        // enable/disable screenshot blocking via FLAG_SECURE (Android)
        // or UIScreen.isCaptured detection (iOS).
        console.log('Screenshot toggle pressed');
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return false;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ScreenshotButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _screenshotEnabled: false,
        visible: true
    };
}

export default translate(connect(_mapStateToProps)(ScreenshotButton));
