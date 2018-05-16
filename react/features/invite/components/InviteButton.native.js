// @flow

import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { ShareMeetingMenu } from '../../mobile/share-meeting';

import { beginAddPeople } from '../actions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../functions';

type Props = AbstractButtonProps & {

    /**
     * Whether or not the feature to directly invite people into the
     * conference (via an external service or a phone number) is available.
     */
    _addPeopleEnabled: boolean,

    /**
     * Launches native invite dialog.
     *
     * @protected
     */
    _onAddPeople: Function,

    /**
     * Begins the UI procedure to share the meeting dial-in information.
     */
    _onShareMeeting: Function
};

/**
 * The indicator which determines (at bundle time) whether there should be a
 * button in {@code Toolbox} to expose the functionality of the feature
 * share-room in the user interface of the app.
 *
 * @private
 * @type {boolean}
 */
const _SHARE_MEETING_TOOLBAR_BUTTON = true;

/**
 * Implements an {@link AbstractButton} to enter add/invite people to the
 * current call/conference/meeting.
 */
class InviteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Share room';
    iconName = 'icon-link';
    label = 'toolbar.shareRoom';

    /**
     * XXX Export this constant so other features can check it. It cannot be a
     * static attribute because it's lost when connect()-ing with redux.
     *
     * @private
     * @returns {boolean}
     */
    static get _SHARE_MEETING_TOOLBAR_BUTTON() {
        return _SHARE_MEETING_TOOLBAR_BUTTON;
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const {
            _addPeopleEnabled,
            _onAddPeople,
            _onShareMeeting
        } = this.props;

        if (_SHARE_MEETING_TOOLBAR_BUTTON) {
            _onShareMeeting();
        } else if (_addPeopleEnabled) {
            _onAddPeople();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        const { _addPeopleEnabled } = this.props;

        return (
            _SHARE_MEETING_TOOLBAR_BUTTON || _addPeopleEnabled
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
 *     _onShareMeeting
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
        _onShareMeeting() {
            dispatch(openDialog(ShareMeetingMenu));
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
         * conference (via an external service or a phone number) is available.
         *
         * @type {boolean}
         */
        _addPeopleEnabled: isAddPeopleEnabled(state) || isDialOutEnabled(state)
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(InviteButton);
