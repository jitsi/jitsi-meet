import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    BREAKOUT_ROOMS_BUTTON_ENABLED
} from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconRingGroup } from '../../../base/icons/svg';
import AbstractButton,
{
    IProps as AbstractButtonProps
} from '../../../base/toolbox/components/AbstractButton';
import {
    navigate
} from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';


/**
 * Implements an {@link AbstractButton} to open the breakout room screen.
 */
class BreakoutRoomsButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.breakoutRooms';
    icon = IconRingGroup;
    label = 'breakoutRooms.buttonLabel';

    /**
     * Handles clicking / pressing the button and opens the breakout rooms screen.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        return navigate(screen.conference.breakoutRooms);
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    const enabled = getFeatureFlag(state, BREAKOUT_ROOMS_BUTTON_ENABLED, true);

    return {
        visible: enabled
    };
}

export default translate(connect(_mapStateToProps)(BreakoutRoomsButton));
