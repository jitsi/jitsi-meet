// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
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
