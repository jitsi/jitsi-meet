// @flow

import { translate } from '../../../base/i18n';
import { IconRaisedHand } from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

type Props = AbstractButtonProps & {

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean,

    /**
     * External handler for click action.
     */
    handleClick: Function
};

/**
 * Implementation of a button for toggling raise hand functionality.
 */
class RaiseHandButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    icon = IconRaisedHand
    label = 'toolbar.raiseYourHand';
    toggledLabel = 'toolbar.lowerYourHand'

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        return this.props._raisedHand ? 'toolbar.lowerYourHand' : 'toolbar.raiseYourHand';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} value - The value.
     */
    set tooltip(value) {
        return value;
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.handleClick();
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
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = state => {
    const localParticipant = getLocalParticipant(state);

    return {
        _raisedHand: localParticipant.raisedHand
    };
};

export default translate(connect(mapStateToProps)(RaiseHandButton));
