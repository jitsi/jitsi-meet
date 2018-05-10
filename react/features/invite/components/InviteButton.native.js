// @flow

import { connect } from 'react-redux';

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
 * The indicator which determines (at bundle time) whether there should be a
 * button in {@code Toolbox} to expose the functionality of the feature
 * share-room in the user interface of the app.
 *
 * @private
 * @type {boolean}
 */
const _SHARE_ROOM_TOOLBAR_BUTTON = true;

/**
 * Implements a {@link ToolbarButton} to enter Picture-in-Picture.
 */
class InviteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Share room';
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
            _dialOutEnabled,
            _onAddPeople,
            _onShareRoom
        } = this.props;

        if (_addPeopleEnabled || _dialOutEnabled) {
            _onAddPeople();
        } else if (_SHARE_ROOM_TOOLBAR_BUTTON) {
            _onShareRoom();
        }
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        const { _addPeopleEnabled, _dialOutEnabled } = this.props;

        return (
            _SHARE_ROOM_TOOLBAR_BUTTON
                    || _addPeopleEnabled
                    || _dialOutEnabled
                ? super.render()
                : null);
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
function _mapDispatchToProps(dispatch) {
    return {
        /**
         * Launches native invite dialog.
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

export default connect(_mapStateToProps, _mapDispatchToProps)(InviteButton);
