import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { setFollowMe } from '../../../base/conference/actions.any';
import { translate } from '../../../base/i18n/functions';
import { IconFollowMeOff, IconFollowMeOn } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isFollowMeActive, isFollowMeRecorderActive } from '../../../follow-me/functions';

/**
 * The type of the React {@code Component} props of {@link FollowMeButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not follow-me is currently active.
     */
    followMeActive: boolean;

    /**
     * Whether or not follow-me is enabled.
     */
    followMeEnabled: boolean;

    /**
     * Whether or not follow-me recorder is active.
     */
    followMeRecorderActive: boolean;

    /**
     * Whether or not follow-me recorder is checked.
     */
    followMeRecorderChecked: boolean;
}

/**
 * Implementation of a button for toggling follow-me.
 */
class FollowMeButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.followMe';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.followMeOff';
    override icon = IconFollowMeOff;
    override toggledIcon = IconFollowMeOn;
    override label = 'settings.followMe';
    override toggledLabel = 'settings.followMeOff';
    override tooltip = 'settings.followMe';
    override toggledTooltip = 'settings.followMeOff';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        const { followMeEnabled, followMeActive, followMeRecorderChecked } = this.props;

        return followMeEnabled && !followMeActive && !followMeRecorderChecked;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isDisabled() {
        const { followMeActive, followMeRecorderActive } = this.props;

        return followMeActive || followMeRecorderActive;
    }

    /**
     * Handles clicking the button, and toggles the follow-me setting.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, followMeEnabled, followMeActive, followMeRecorderChecked } = this.props;

        if (this._isDisabled()) {
            return;
        }

        const newFollowMeEnabled = !(followMeEnabled && !followMeActive && !followMeRecorderChecked);

        dispatch(setFollowMe(newFollowMeEnabled));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const {
        conference,
        followMeEnabled,
        followMeRecorderEnabled
    } = state['features/base/conference'];
    const followMeActive = isFollowMeActive(state);
    const followMeRecorderActive = isFollowMeRecorderActive(state);

    return {
        followMeEnabled: Boolean(conference && followMeEnabled),
        followMeActive: Boolean(conference && followMeActive),
        followMeRecorderActive: Boolean(conference && followMeRecorderActive),
        followMeRecorderChecked: Boolean(conference && followMeRecorderEnabled)
    };
}

export { FollowMeButton };

export default translate(connect(mapStateToProps)(FollowMeButton));
