// @flow

import { translate } from '../../../base/i18n';
import { IconRaisedHand } from '../../../base/icons';
import { getLocalParticipant, hasRaisedHand } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';


/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not the hand is raised.
     */
     raisedHand: boolean,
};

/**
 * Implementation of a button for raising hand.
 */
class RaiseHandButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    icon = IconRaisedHand;
    label = 'toolbar.raiseHand';
    toggledLabel = 'toolbar.raiseHand';

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        return 'toolbar.raiseHand';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }

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
        raisedHand: hasRaisedHand(localParticipant)
    };
};

export default translate(connect(mapStateToProps)(RaiseHandButton));
