import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconRaiseHand } from '../../../base/icons/svg';
import { raiseHand } from '../../../base/participants/actions';
import { getLocalParticipant, hasRaisedHand } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';


/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the hand is raised.
     */
    raisedHand: boolean;
}

/**
 * Implementation of a button for raising hand.
 */
class RaiseHandButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.lowerHand';
    icon = IconRaiseHand;
    label = 'toolbar.raiseHand';
    toggledLabel = 'toolbar.lowerYourHand';
    tooltip = 'toolbar.raiseHand';
    toggledTooltip = 'toolbar.lowerYourHand';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.raisedHand;
    }

    /**
     * Handles clicking the button, and toggles the raise hand.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, raisedHand } = this.props;

        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !raisedHand }));

        dispatch(raiseHand(!raisedHand));
    }
}


/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    const localParticipant = getLocalParticipant(state);

    return {
        raisedHand: hasRaisedHand(localParticipant)
    };
};

export default translate(connect(mapStateToProps)(RaiseHandButton));
