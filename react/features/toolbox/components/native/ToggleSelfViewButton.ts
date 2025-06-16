import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconAudioOnlyOff } from '../../../base/icons/svg';
import { updateSettings } from '../../../base/settings/actions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

/**
 * The type of the React {@code Component} props of {@link ToggleSelfViewButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether the self view is disabled or not.
     */
    _disableSelfView: boolean;
}

/**
 * An implementation of a button for toggling the self view.
 */
class ToggleSelfViewButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.selfView';
    icon = IconAudioOnlyOff;
    label = 'videothumbnail.hideSelfView';
    toggledLabel = 'videothumbnail.showSelfView';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _disableSelfView, dispatch } = this.props;

        dispatch(updateSettings({
            disableSelfView: !_disableSelfView
        }));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._disableSelfView;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ToggleSelfViewButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _disableSelfView: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const { disableSelfView } = state['features/base/settings'];

    return {
        _disableSelfView: Boolean(disableSelfView)
    };
}

export default translate(connect(_mapStateToProps)(ToggleSelfViewButton));
