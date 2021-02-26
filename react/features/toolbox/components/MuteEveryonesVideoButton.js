// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconMuteVideoEveryone } from '../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { MuteEveryonesVideoDialog } from '../../remote-video-menu/components';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /*
     ** Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string
};

/**
 * Implements a React {@link Component} which displays a button for disabling the camera of
 * every participant (except the local one)
 */
class MuteEveryonesVideoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryonesVideo';
    icon = IconMuteVideoEveryone;
    label = 'toolbar.muteEveryonesVideo';
    tooltip = 'toolbar.muteVideoEveryone';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, localParticipantId } = this.props;

        sendAnalytics(createToolbarEvent('mute.everyone.pressed'));
        dispatch(openDialog(MuteEveryonesVideoDialog, {
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
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;
    const { visible } = ownProps;
    const { disableRemoteMute } = state['features/base/config'];

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        visible: visible && isModerator && !disableRemoteMute
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryonesVideoButton));
