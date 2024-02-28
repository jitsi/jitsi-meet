import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import { getParticipantCount } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import DemoteToVisitorDialog from '../../../video-menu/components/native/DemoteToVisitorDialog';

/**
 * The type of the React {@code Component} props of {@link DemoteToVisitorButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string;
}

/**
 * An implementation of a button for demoting self to visitor.
 */
class DemoteToVisitorButton extends AbstractButton<IProps> {
    accessibilityLabel = 'videothumbnail.demote';
    icon = IconUsers;
    label = 'videothumbnail.demote';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(DemoteToVisitorDialog, { participantID }));
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
    const visitorsSupported = state['features/visitors'].supported;

    return {
        visible: getParticipantCount(state) > 1 && visitorsSupported
    };
}

export default translate(connect(_mapStateToProps)(DemoteToVisitorButton));
