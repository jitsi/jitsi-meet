// @flow

import { translate } from '../../../base/i18n';
import { IconExitFullScreen, IconFullScreen } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

type Props = AbstractButtonProps & {

  /**
   * Whether or not the app is currently in full screen.
   */
   _fullScreen: boolean,

    /**
     * External handler for click action.
     */
    handleClick: Function
};

/**
 * Implementation of a button for toggling fullscreen state.
 */
class FullscreenButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.fullScreen';
    label = 'toolbar.enterFullScreen';
    toggledLabel = 'toolbar.exitFullScreen'

    /**
     * Retrieves icon dynamically.
     */
    get icon() {
        if (this._isToggled()) {
            return IconExitFullScreen;
        }

        return IconFullScreen;
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} value - The value.
     */
    set icon(value) {
        return value;
    }

    /**
     * Retrieves icon dynamically.
     */
    get tooltip() {
        if (this._isToggled()) {
            return 'toolbar.exitFullScreen';
        }

        return 'toolbar.enterFullScreen';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} value - The value.
     */
    set tooltip(value) {
        return value;
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.handleClick();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._fullScreen;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = state => {
    return {
        _fullScreen: state['features/toolbox'].fullScreen
    };
};

export default translate(connect(mapStateToProps)(FullscreenButton));
