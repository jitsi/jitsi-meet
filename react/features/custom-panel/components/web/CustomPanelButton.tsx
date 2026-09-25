import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.web';
import { IconAI } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { closeOverflowMenuIfOpen } from '../../../toolbox/actions.web';
import {
    close as closeCustomPanel,
    open as openCustomPanel
} from '../../actions.web';
import { getCustomPanelOpen } from '../../functions.web';

/**
 * The type of the React {@code Component} props of {@link CustomPanelButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether the custom panel is currently open.
     */
    _isOpen: boolean;
}

/**
 * Implementation of a button for toggling the custom panel.
 */
class CustomPanelButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.copilot';
    override icon = IconAI;
    override label = 'toolbar.copilot';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeCustomPanel';
    override toggledTooltip = 'toolbar.closeCustomPanel';
    override tooltip = 'toolbar.copilot';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean} True if the button is toggled, false otherwise.
     */
    override _isToggled() {
        return this.props._isOpen;
    }

    /**
     * Handles clicking the button and toggles the custom panel.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _isOpen } = this.props;

        dispatch(closeOverflowMenuIfOpen());
        if (_isOpen) {
            dispatch(closeCustomPanel());
        } else {
            dispatch(openCustomPanel());
        }
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Object} The props derived from state.
 */
function mapStateToProps(state: IReduxState) {
    return {
        _isOpen: getCustomPanelOpen(state)
    };
}

export default translate(connect(mapStateToProps)(CustomPanelButton));
