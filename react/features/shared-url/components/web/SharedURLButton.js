// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
// TODO: Find a better icon for this (perhaps a globe, etc)
import { IconShareDoc } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox/components';
import { showSharedURLDialog } from '../../actions.web';
import { isSharingStatus } from '../../functions';

declare var APP: Object;

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean,

    /**
     * Whether or not the local participant is sharing a URL.
     */
    _sharingURL: boolean
};

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedURLButton extends AbstractButton<Props, *> {
    // TODO: Create these labels
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedurl';
    icon = IconShareDoc;
    label = 'toolbar.sharedurl';
    tooltip = 'toolbar.sharedurl';
    toggledLabel = 'toolbar.stopSharedURL';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedURLDialog();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._sharingURL;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._isDisabled;
    }

    /**
     * Dispatches an action to toggle URL sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedURLDialog() {
        const { dispatch } = this.props;

        return this._isToggled()
            ? APP.UI.stopSharedURLEmitter()
            : dispatch(showSharedURLDialog(sharedURL => APP.UI.startSharedURLEmitter(sharedURL)));
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
    const {
        disabled: sharedURLBtnDisabled,
        status: sharedURLStatus
    } = state['features/shared-url'];

    return {
        _isDisabled: sharedURLBtnDisabled,
        _sharingURL: isSharingStatus(sharedURLStatus)
    };
}


export default translate(connect(_mapStateToProps)(SharedURLButton));
