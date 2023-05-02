import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openSheet } from '../../../base/dialog/actions';
import { OVERFLOW_MENU_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

import OverflowMenu from './OverflowMenu';

/**
 * An implementation of a button for showing the {@code OverflowMenu}.
 */
class OverflowMenuButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    icon = IconDotsHorizontal;
    label = 'toolbar.moreActions';

    /**
     * Handles clicking / pressing this {@code OverflowMenuButton}.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openSheet(OverflowMenu));
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
function _mapStateToProps(state: IReduxState) {
    const enabledFlag = getFeatureFlag(state, OVERFLOW_MENU_ENABLED, true);

    return {
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(OverflowMenuButton));
