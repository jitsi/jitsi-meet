import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
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
     * Whether or not the click is disabled.
     */
    disableClick?: boolean;

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not the hand is raised.
     */
    raisedHand: boolean;
}

/**
 * Implementation of a button for raising hand.
 */
class RaiseHandButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.lowerHand';
    override icon = IconRaiseHand;
    override label = 'toolbar.raiseHand';
    override toggledLabel = 'toolbar.lowerYourHand';
    override tooltip = 'toolbar.raiseHand';
    override toggledTooltip = 'toolbar.lowerYourHand';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props.raisedHand;
    }

    /**
     * Handles clicking the button, and toggles the raise hand.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { disableClick, dispatch, raisedHand } = this.props;

        if (disableClick) {
            return;
        }

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

export { RaiseHandButton };

export default translate(connect(mapStateToProps)(RaiseHandButton));
