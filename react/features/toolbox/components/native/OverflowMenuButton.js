// @flow

import { openDialog } from '../../../base/dialog';
import { getFeatureFlag, OVERFLOW_MENU_ENABLED } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconHorizontalPoints } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

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
    icon = IconHorizontalPoints;
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

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code OverflowMenuButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const enabledFlag = getFeatureFlag(state, OVERFLOW_MENU_ENABLED, true);

    return {
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(OverflowMenuButton));
