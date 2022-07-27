/* eslint-disable lines-around-comment */
// @ts-ignore
import { CAR_MODE_ENABLED, getFeatureFlag } from '../../../base/flags';
// @ts-ignore
import { translate } from '../../../base/i18n';
import { IconCar } from '../../../base/icons/svg/index';
import { connect } from '../../../base/redux/functions';
// @ts-ignore
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { navigate }
// @ts-ignore
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
// @ts-ignore
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
// @ts-ignore
export default translate(connect(_mapStateToProps)(OpenCarmodeButton));
