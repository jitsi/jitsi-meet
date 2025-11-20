import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import { ILocalParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { openSettingsDialog } from '../../../settings/actions';
import { SETTINGS_TABS } from '../../../settings/constants';

import ProfileButtonAvatar from './ProfileButtonAvatar';

/**
 * The type of the React {@code Component} props of {@link ProfileButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Default displayed name for local participant.
     */
    _defaultLocalDisplayName: string;

    /**
     * The redux representation of the local participant.
     */
    _localParticipant?: ILocalParticipant;

    /**
      * Whether the button support clicking or not.
      */
    _unclickable: boolean;
}

/**
 * Implementation of a button for opening profile dialog.
 */
class ProfileButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.profile';
    override icon = ProfileButtonAvatar;

    /**
     * Retrieves the label.
     *
     * @returns {string}
     */
    override _getLabel() {
        const {
            _defaultLocalDisplayName,
            _localParticipant
        } = this.props;
        let displayName;

        if (_localParticipant?.name) {
            displayName = _localParticipant.name;
        } else {
            displayName = _defaultLocalDisplayName;
        }

        return displayName;
    }

    /**
     * Retrieves the tooltip.
     *
     * @returns {string}
     */
    override _getTooltip() {
        return this._getLabel();
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _unclickable } = this.props;

        if (!_unclickable) {
            sendAnalytics(createToolbarEvent('profile'));
            dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE));
        }
    }

    /**
     * Indicates whether the button should be disabled or not.
     *
     * @protected
     * @returns {void}
     */
    override _isDisabled() {
        return this.props._unclickable;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    const { defaultLocalDisplayName } = state['features/base/config'];

    return {
        _defaultLocalDisplayName: defaultLocalDisplayName ?? '',
        _localParticipant: getLocalParticipant(state),
        _unclickable: !interfaceConfig.SETTINGS_SECTIONS.includes('profile'),
        customClass: 'profile-button-avatar'
    };
};

export default translate(connect(mapStateToProps)(ProfileButton));
