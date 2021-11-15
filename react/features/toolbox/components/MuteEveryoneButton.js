// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconMuteEveryone } from '../../base/icons';
import { getLocalParticipant, isLocalParticipantModerator } from '../../base/participants';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { MuteEveryoneDialog } from '../../video-menu/components';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string
};

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant (except the local one).
 */
class MuteEveryoneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryone';
    icon = IconMuteEveryone;
    label = 'toolbar.muteEveryone';
    tooltip = 'toolbar.muteEveryone';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, localParticipantId, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent('mute.everyone.pressed'));
        dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ localParticipantId ]
        }));
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Props} ownProps - The component's own props.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const localParticipant = getLocalParticipant(state);
    const { disableRemoteMute } = state['features/base/config'];
    const { visible = isLocalParticipantModerator(state) && !disableRemoteMute } = ownProps;

    return {
        localParticipantId: localParticipant.id,
        visible
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryoneButton));
