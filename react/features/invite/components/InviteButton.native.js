// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { beginShareRoom } from '../../share-room';

import { setAddPeopleDialogVisible } from '../actions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../functions';

type Props = AbstractButtonProps & {

    /**
     * Whether or not the feature to invite people to join the
     * conference is available.
     */
    _addPeopleEnabled: boolean,

    /**
     * Opens the add people dialog.
     */
    _onOpenAddPeopleDialog: Function,

    /**
     * Begins the UI procedure to share the conference/room URL.
     */
    _onShareRoom: Function
};

/**
 * Implements an {@link AbstractButton} to enter add/invite people to the
 * current call/conference/meeting.
 */
class InviteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareRoom';
    iconName = 'icon-link';
    label = 'toolbar.shareRoom';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const {
            _addPeopleEnabled,
            _onOpenAddPeopleDialog,
            _onShareRoom
        } = this.props;

        if (_addPeopleEnabled) {
            _onOpenAddPeopleDialog();
        } else {
            _onShareRoom();
        }
    }
}

/**
 * Maps redux actions to {@link InviteButton}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onOpenAddPeopleDialog,
 *     _onShareRoom
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Dispatch<any>) {
    return {

        /**
         * Opens the add people dialog.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onOpenAddPeopleDialog() {
            dispatch(setAddPeopleDialogVisible(true));
        },

        /**
         * Begins the UI procedure to share the conference/room URL.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onShareRoom() {
            dispatch(beginShareRoom());
        }
    };
}

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *   _addPeopleEnabled: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _addPeopleEnabled: isAddPeopleEnabled(state) || isDialOutEnabled(state)
    };
}

export default translate(
    connect(_mapStateToProps, _mapDispatchToProps)(InviteButton));
