import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconPip } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { togglePip } from '../../actions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether Picture-in-Picture is active.
     */
    _isPiPActive: boolean;
}

/**
 * Opens or closes Picture-in-Picture using the implementation supported by the browser.
 */
class PiPTriggerButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.pipClose';
    override label = 'toolbar.pip';
    override toggledLabel = 'toolbar.pipClose';
    override tooltip = 'toolbar.pip';
    override toggledTooltip = 'toolbar.pipClose';
    override icon = IconPip;

    /**
     * Indicates whether the button is toggled.
     *
     * @returns {boolean}
     */
    override _isToggled(): boolean {
        return Boolean(this.props._isPiPActive);
    }

    /**
     * Handles toggling Picture-in-Picture.
     *
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('toggle.pip', { enable: !this._isToggled() }));
        dispatch(togglePip());
    }
}

/**
 * Maps Redux state to component props.
 *
 * @param {IReduxState} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    return {
        _isPiPActive: Boolean(state['features/pip']?.isPiPActive)
    };
}

export default translate(connect(mapStateToProps)(PiPTriggerButton));
