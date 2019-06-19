// @flow

import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';

import AbstractMuteButton, { _mapStateToProps as _abstractMapStateToProps } from '../AbstractMuteButton';

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    return {
        ..._abstractMapStateToProps(state, ownProps),
        visible: isLocalParticipantModerator(state)
    };
}

export default translate(connect(_mapStateToProps)(AbstractMuteButton));
