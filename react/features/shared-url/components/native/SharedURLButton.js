// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, URL_SHARE_BUTTON_ENABLED } from '../../../base/flags';
import { translate } from '../../../base/i18n';
// TODO: Import an icon (for example, globe) for sharing website URL
import { IconShareDoc } from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { toggleSharedURL } from '../../actions.native';
import { isSharingStatus } from '../../functions';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean,

    /**
     * Whether or not the local participant is sharing a URL.
     */
    _sharingURL: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @extends AbstractButton
 */
class SharedURLButton extends AbstractButton<Props, *> {
    // TODO: Create these labels
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedurl';
    icon = IconShareDoc;
    label = 'toolbar.sharedurl';
    toggledLabel = 'toolbar.stopSharedUrl';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._doToggleSharedURL();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._sharingURL;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._isDisabled;
    }

    /**
     * Dispatches an action to toggle video sharing.
     *
     * @private
     * @returns {void}
     */
    _doToggleSharedURL() {
        this.props.dispatch(toggleSharedURL());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { ownerId, status: sharedURLStatus } = state['features/shared-url'];
    const localParticipantId = getLocalParticipant(state).id;
    const enabled = getFeatureFlag(state, URL_SHARE_BUTTON_ENABLED, true);
    const { visible = enabled } = ownProps;

    if (ownerId !== localParticipantId) {
        return {
            _isDisabled: isSharingStatus(sharedURLStatus),
            _sharingURL: false,
            visible
        };
    }

    return {
        _isDisabled: false,
        _sharingURL: isSharingStatus(sharedURLStatus),
        visible
    };
}

export default translate(connect(_mapStateToProps)(SharedURLButton));
