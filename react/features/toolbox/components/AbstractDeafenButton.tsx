import { IReduxState } from '../../app/types';
import { DEAFEN_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setDeafened } from '../../base/media/actions';
import BaseDeafenButton from '../../base/toolbox/components/BaseDeafenButton';

/**
 * The type of the React {@code Component} props of {@link AbstractDeafenButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * Whether the user is currently deafened or not.
     */
    _deafened: boolean;

    /**
     * Whether the button is disabled.
     */
    _disabled: boolean;
}

/**
 * Component that renders a toolbar button for toggling deafen.
 *
 * @augments BaseAudioMuteButton
 */
export default class AbstractDeafenButton<P extends IProps> extends BaseDeafenButton<P> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.deafen';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.undeafen';
    override label = 'toolbar.deafen';
    override toggledLabel = 'toolbar.undeafen';
    override tooltip = 'toolbar.deafen';
    override toggledTooltip = 'toolbar.undeafen';

    /**
     * Indicates if the user is currently deafened or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isDeafened() {
        return this.props._deafened;
    }

    /**
     * Changes the deafened state.
     *
     * @param {boolean} deafened - Whether the user should be deafened or not.
     * @protected
     * @returns {void}
     */
    override _setDeafened(deafened: boolean) {
        this.props.dispatch(setDeafened(deafened));
    }

    /**
     * Return a boolean value indicating if this button is disabled or not.
     *
     * @returns {boolean}
     */
    override _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractDeafenButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _deafened: boolean,
 *     _disabled: boolean
 * }}
 */
export function mapStateToProps(state: IReduxState) {
    const deafen = state['features/base/media'].deafen;
    const _deafened = deafen?.deafened;
    const _disabled = false;
    const enabledFlag = getFeatureFlag(state, DEAFEN_BUTTON_ENABLED, true);

    return {
        _deafened,
        _disabled,
        visible: enabledFlag
    };
}
