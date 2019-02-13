// @flow

import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { translate } from '../../base/i18n';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { beginShareRoom } from '../../share-room';

import { beginAddPeople } from '../actions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../functions';

type Props = AbstractButtonProps & {

    /**
     * Whether or not the feature to directly invite people into the
     * conference is available.
     */
    _addPeopleEnabled: boolean,

    /**
     * Whether or not the feature to dial out to number to join the
     * conference is available.
     */
    _dialOutEnabled: boolean,

    /**
     * Launches native invite dialog.
     *
     * @protected
     */
    _onAddPeople: Function,

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
        // FIXME: dispatch _onAddPeople here, when we have a dialog for it.
        const {
            _onShareRoom
        } = this.props;

        _onShareRoom();
    }
}

/**
 * Maps redux actions to {@link InviteButton}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onAddPeople,
 *     _onShareRoom
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Dispatch<*>) {
    return {
        /**
         * Launches the add people dialog.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onAddPeople() {
            dispatch(beginAddPeople());
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
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * Whether or not the feature to directly invite people into the
         * conference is available.
         *
         * @type {boolean}
         */
        _addPeopleEnabled: isAddPeopleEnabled(state),

        /**
         * Whether or not the feature to dial out to number to join the
         * conference is available.
         *
         * @type {boolean}
         */
        _dialOutEnabled: isDialOutEnabled(state)
    };
}

export default translate(
    connect(_mapStateToProps, _mapDispatchToProps)(InviteButton));
