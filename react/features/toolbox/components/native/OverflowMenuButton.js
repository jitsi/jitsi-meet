// @flow

import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import OverflowMenu from './OverflowMenu';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * An implementation of a button for showing the {@code OverflowMenu}.
 */
class OverflowMenuButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Overflow menu';
    iconName = 'icon-thumb-menu';
    label = 'toolbar.moreActions';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(OverflowMenu));
    }
}

export default translate(connect()(OverflowMenuButton));
