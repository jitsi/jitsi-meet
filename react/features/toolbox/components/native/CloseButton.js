// @flow

import { type Dispatch } from 'redux';

import { hideDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconClose } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * A button for closing any dialog / bottom sheet.
 */
class CloseButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.close';
    icon = IconClose;
    label = 'toolbar.close';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(hideDialog());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const { screenReaderEnabled } = state['features/accessibility-info'];

    return {
        visible: Boolean(screenReaderEnabled)
    };
}

export default translate(connect(_mapStateToProps)(CloseButton));
