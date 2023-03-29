import { connect } from 'react-redux';

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
    accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeMoreActions';
    icon = IconDotsHorizontal;
    label = 'toolbar.moreActions';
    toggledLabel = 'toolbar.moreActions';
    tooltip = 'toolbar.moreActions';

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


export default connect()(translate(OverflowToggleButton));
