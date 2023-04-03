// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractKickButton from '../AbstractKickButton';

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        visible: isLocalParticipantModerator(state)
    };
}

export default translate(connect(_mapStateToProps)(AbstractKickButton));
