import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconScreenshare } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions.web';
import { togglePiP } from '../actions';

/**
 * The type of the React {@code Component} props of {@link PiPButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether Picture-in-Picture is currently active.
     */
    _pipActive: boolean;
}

/**
 * Toolbar button that toggles the floating Picture-in-Picture window.
 * The initial click provides the user gesture browsers require to enter PiP.
 *
 * @augments AbstractButton
 */
class PiPButton<P extends IProps> extends AbstractButton<P> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    override icon = IconScreenshare;
    override label = 'toolbar.pip';
    override toggledLabel = 'toolbar.exitPip';
    override tooltip = 'toolbar.pip';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { _pipActive, dispatch } = this.props;

        sendAnalytics(createToolbarEvent('pip.button', { 'is_enabled': !_pipActive }));

        dispatch(togglePiP());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._pipActive;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code PiPButton} component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _pipActive: Boolean(state['features/pip']?.isPiPActive)
    };
}

export default translate(connect(_mapStateToProps)(PiPButton));
