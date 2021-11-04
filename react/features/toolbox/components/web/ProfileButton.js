// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { openSettingsDialog, SETTINGS_TABS } from '../../../settings';

import ProfileButtonAvatar from './ProfileButtonAvatar';

/**
 * The type of the React {@code Component} props of {@link ProfileButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux representation of the local participant.
     */
     _localParticipant: Object,

     /**
      * Whether the button support clicking or not.
      */
     _unclickable: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

declare var interfaceConfig: Object;

/**
 * Implementation of a button for opening profile dialog.
 */
class ProfileButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.profile';
    icon = ProfileButtonAvatar;

    /**
     * Retrieves the label.
     */
    get label() {
        const { _localParticipant } = this.props;
        let displayName;

        if (_localParticipant && _localParticipant.name) {
            displayName = _localParticipant.name;
        } else {
            displayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
        }

        return displayName;
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set label(_value) {
        // Unused.
    }

    /**
     * Retrieves the tooltip.
     */
    get tooltip() {
        return this.label;
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, _unclickable, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

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
    _isDisabled() {
        return this.props._unclickable;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = state => {
    return {
        _localParticipant: getLocalParticipant(state),
        _unclickable: !interfaceConfig.SETTINGS_SECTIONS.includes('profile'),
        customClass: 'profile-button-avatar'
    };
};

export default translate(connect(mapStateToProps)(ProfileButton));
