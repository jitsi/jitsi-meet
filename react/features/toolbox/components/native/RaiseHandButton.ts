import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { RAISE_HAND_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconRaiseHand } from '../../../base/icons/svg';
import { raiseHand } from '../../../base/participants/actions';
import {
    getLocalParticipant,
    hasRaisedHand
} from '../../../base/participants/functions';
import { ILocalParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The local participant.
     */
    _localParticipant?: ILocalParticipant;

    /**
     * Whether the participant raised their hand or not.
     */
    _raisedHand: boolean;
}

/**
 * An implementation of a button to raise or lower hand.
 */
class RaiseHandButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    icon = IconRaiseHand;
    label = 'toolbar.raiseYourHand';
    toggledLabel = 'toolbar.lowerYourHand';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._toggleRaisedHand();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._raisedHand;
    }

    /**
     * Toggles the rased hand status of the local participant.
     *
     * @returns {void}
     */
    _toggleRaisedHand() {
        const enable = !this.props._raisedHand;

        sendAnalytics(createToolbarEvent('raise.hand', { enable }));

        this.props.dispatch(raiseHand(enable));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const _localParticipant = getLocalParticipant(state);
    const enabled = getFeatureFlag(state, RAISE_HAND_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _localParticipant,
        _raisedHand: hasRaisedHand(_localParticipant),
        visible
    };
}

export default translate(connect(_mapStateToProps)(RaiseHandButton));
