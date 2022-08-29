/* eslint-disable lines-around-comment */
// @ts-ignore
import { translate } from '../../../base/i18n';
// @ts-ignore
import { IconClose, IconHangup } from '../../../base/icons';
// @ts-ignore
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

/**
 * The type of the React {@code Component} props of {@link HangupToggleButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the more options menu is open.
     */
    isOpen: boolean,

    /**
     * External handler for key down action.
     */
    onKeyDown: Function,
};

/**
 * Implementation of a button for toggling the hangup menu.
 */
class HangupToggleButton extends AbstractButton<Props, any, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    icon = IconHangup;
    label = 'toolbar.hangup';
    toggledIcon = IconClose;
    toggledLabel = 'toolbar.hangup';
    props: Props;

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        return 'toolbar.hangup';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.isOpen;
    }

    /**
     * Indicates whether a key was pressed.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _onKeyDown() {
        this.props.onKeyDown();
    }
}

export default translate(HangupToggleButton);
