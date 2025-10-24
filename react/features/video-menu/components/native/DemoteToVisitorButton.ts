import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

import DemoteToVisitorDialog from './DemoteToVisitorDialog';

interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant that this button is supposed to kick.
     */
    participantID: string;
}

/**
 * Implements a React {@link Component} which displays a button for demoting a participant to visitor.
 */
class DemoteToVisitorButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'videothumbnail.demote';
    override icon = IconUsers;
    override label = 'videothumbnail.demote';

    /**
     * Handles clicking / pressing the button, and demoting the participant.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(DemoteToVisitorDialog, { participantID }));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        visible: state['features/visitors'].supported
    };
}

export default translate(connect(_mapStateToProps)(DemoteToVisitorButton));
