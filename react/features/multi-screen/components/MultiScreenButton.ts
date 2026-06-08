import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconEnlarge } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { toggleMultiScreen } from '../actions';
import { isMultiScreenActive } from '../functions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not multi-screen is currently active.
     */
    _isActive: boolean;
}

/**
 * Implementation of a button for toggling multi-screen mode.
 * Opens/closes a secondary browser window for displaying an
 * independent conference layout.
 */
class MultiScreenButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.multiScreen';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeMultiScreen';
    override label = 'toolbar.multiScreen';
    override toggledLabel = 'toolbar.closeMultiScreen';
    override tooltip = 'toolbar.multiScreen';
    override toggledTooltip = 'toolbar.closeMultiScreen';
    override icon = IconEnlarge;

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._isActive;
    }

    /**
     * Handles clicking the button, toggling the secondary window.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _isActive } = this.props;

        sendAnalytics(createToolbarEvent(
            'toggle.multi-screen',
            {
                enable: !_isActive
            }));

        dispatch(toggleMultiScreen());
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    return {
        _isActive: isMultiScreenActive(state)
    };
};

export default translate(connect(mapStateToProps)(MultiScreenButton));
