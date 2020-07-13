// @flow

import { type Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { IconKick } from '../../../base/icons';
import {
    getLocalParticipant,
    participantUpdated
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';
import KickEveryoneElsePrompt from './KickEveryoneElsePrompt';
import { openDialog } from '../../../base/dialog';
/**
 * The type of the React {@code Component} props of {@link KickEveryoneElseButton}.
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
 * An implementation of a button to Kick Everyone
 */
class KickEveryoneElseButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.kickEveryone';
    icon = IconKick;
    label = 'toolbar.accessibilityLabel.kickEveryone';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._kickEveryoneElse();
    }

  

    /**
     * Toggles the rased hand status of the local participant.
     *
     * @returns {void}
     */
    _kickEveryoneElse() {
        console.log("kick all")
        exclude= [this.props._localParticipant.id];
        this.props.dispatch(openDialog(KickEveryoneElsePrompt, {
            exclude,
        }));
            

        
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

export default translate(connect(_mapStateToProps)(KickEveryoneElseButton));
