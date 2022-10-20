// @flow

import { translate } from '../../../base/i18n';
import { IconDotsHorizontal } from '../../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';


/**
 * The type of the React {@code Component} props of {@link OverflowToggleButton}.
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
 * Implementation of a button for toggling the overflow menu.
 */
class OverflowToggleButton extends AbstractButton<Props, *> {
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


export default translate(OverflowToggleButton);
