// @flow

import { type Dispatch } from 'redux';

import { isDialogOpen, openDialog } from '../../../base/dialog';
import { RAISE_HAND_ENABLED, getFeatureFlag } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconRaisedHand } from '../../../base/icons';
import {
    getLocalParticipant
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

import ReactionMenuDialog from './ReactionMenuDialog';

/**
 * The type of the React {@code Component} props of {@link ReactionsMenuButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the participant raised their hand or not.
     */
    _raisedHand: boolean,

    /**
     * Whether or not the reactions menu is open.
     */
    _reactionsOpen: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * An implementation of a button to raise or lower hand.
 */
class ReactionsMenuButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.reactionsMenu';
    icon = IconRaisedHand;
    label = 'toolbar.openReactionsMenu';
    toggledLabel = 'toolbar.closeReactionsMenu';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(ReactionMenuDialog));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._raisedHand || this.props._reactionsOpen;
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
    const enabled = getFeatureFlag(state, RAISE_HAND_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _raisedHand: _localParticipant.raisedHand,
        _reactionsOpen: isDialogOpen(state, ReactionMenuDialog),
        visible
    };
}

export default translate(connect(_mapStateToProps)(ReactionsMenuButton));
