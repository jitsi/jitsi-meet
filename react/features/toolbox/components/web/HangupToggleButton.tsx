import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconCloseLarge, IconHangup } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

/**
 * The type of the React {@code Component} props of {@link HangupToggleButton}.
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
 * Implementation of a button for toggling the hangup menu.
 */
class HangupToggleButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    override icon = IconHangup;
    override label = 'toolbar.hangup';
    override toggledIcon = IconCloseLarge;
    override toggledLabel = 'toolbar.hangup';
    override tooltip = 'toolbar.hangup';

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

export default connect()(translate(HangupToggleButton));
