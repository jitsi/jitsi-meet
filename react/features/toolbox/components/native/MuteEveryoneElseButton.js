// @flow

import { type Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { IconMicDisabled } from '../../../base/icons';
import {
    getLocalParticipant,
    participantUpdated
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { muteAllParticipants } from '../../../remote-video-menu/actions';

/**
 * The type of the React {@code Component} props of {@link MuteEveryoneElseButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The local participant.
     */
    _localParticipant: Object,

  
    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * An implementation of a button to Mute Everyone
 */
class MuteEveryoneElseButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryone';
    icon = IconMicDisabled;
    label = 'toolbar.accessibilityLabel.muteEveryone';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._muteEveryoneElse();
    }

  

    /**
     * Toggles the rased hand status of the local participant.
     *
     * @returns {void}
     */
    _muteEveryoneElse() {
        console.log("mute all")
        this.props.dispatch(muteAllParticipants([this.props._localParticipant.id]));

        
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const _localParticipant = getLocalParticipant(state);

    return {
        _localParticipant
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryoneElseButton));
