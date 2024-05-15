import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconSites } from '../../base/icons/svg';
import { isLocalParticipantModerator } from '../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { goLive } from '../actions';
import { isGoLiveButtonEnabled } from '../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractLiveStreamButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * True if the button needs to be disabled.
     */
    _disabled?: boolean;
}

/**
 * Implements an {@link AbstractButton} to set the meeting to live and to invite all visitors.
 */
class GoLiveButton<P extends IProps> extends AbstractButton<P> {
    accessibilityLabel = 'toolbar.accessibilityLabel.golive';
    icon = IconSites;
    label = 'toolbar.golive';
    tooltip = 'toolbar.golive';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('golive.pressed'));

        dispatch(goLive());
    }

    /**
     * Returns a boolean value indicating if this button is disabled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled || false;
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    const isModerator = isLocalParticipantModerator(state);
    const { supported } = state['features/visitors'];
    const { enableGoLive } = state['features/base/config'];
    const { metadata } = state['features/base/conference'];
    const enabled = isGoLiveButtonEnabled(state);
    const visible = (isModerator && supported && enabled && enableGoLive) || false;

    return {
        _disabled: metadata?.visitorsLive, // once the meeting is live, the button is disabled
        visible
    };
}

export default translate(connect(_mapStateToProps)(GoLiveButton));
