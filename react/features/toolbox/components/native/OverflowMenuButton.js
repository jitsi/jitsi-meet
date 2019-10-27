// @flow

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconMenuThumb } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import OverflowMenu from './OverflowMenu';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for showing the {@code OverflowMenu}.
 */
class OverflowMenuButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    icon = IconMenuThumb;
    label = 'toolbar.moreActions';

    /**
     * Handles clicking / pressing this {@code OverflowMenuButton}.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(OverflowMenu));
    }
}

export default translate(connect()(OverflowMenuButton));
