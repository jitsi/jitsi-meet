import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { CAR_MODE_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconCar } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

/**
 * Implements an {@link AbstractButton} to open the carmode.
 */
class OpenCarmodeButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.carmode';
    icon = IconCar;
    label = 'carmode.labels.buttonLabel';

    /**
     * Handles clicking / pressing the button, and opens the carmode mode.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        return navigate(screen.conference.carmode);
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {IReduxState} state - The Redux state.
 * @param {AbstractButtonProps} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState, ownProps: AbstractButtonProps): Object {
    const enabled = getFeatureFlag(state, CAR_MODE_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        visible
    };
}

export default translate(connect(_mapStateToProps)(OpenCarmodeButton));
