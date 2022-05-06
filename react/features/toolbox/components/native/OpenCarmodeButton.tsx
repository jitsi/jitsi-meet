import { CAR_MODE_ENABLED, getFeatureFlag } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconCar } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

/**
 * Implements an {@link AbstractButton} to open the carmode.
 */
class OpenCarmodeButton extends AbstractButton<AbstractButtonProps, any, any> {
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
 * @param {Object} state - The Redux state.
 * @param {AbstractButtonProps} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Object}
 */
 function _mapStateToProps(state: Object, ownProps: AbstractButtonProps): Object {
    const enabled = getFeatureFlag(state, CAR_MODE_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        visible
    };
}

export default translate(connect(_mapStateToProps)(OpenCarmodeButton));
