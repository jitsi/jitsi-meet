// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import NotificationWithParticipants from '../../../notifications/components/web/NotificationWithParticipants';
import { approveKnockingParticipant, rejectKnockingParticipant } from '../../actions';
import AbstractKnockingParticipantList, {
    mapStateToProps as abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractKnockingParticipantList';

type Props = AbstractProps & {

    /**
     * True if the toolbox is visible, so we need to adjust the position.
     */
    _toolboxVisible: boolean
};

/**
 * Component to render a list for the actively knocking participants.
 */
class KnockingParticipantList extends AbstractKnockingParticipantList<Props> {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <div id = 'knocking-participant-list'>
                <div className = 'title'>
                    { t('lobby.knockingParticipantList') }
                </div>
                <NotificationWithParticipants
                    approveButtonText = { t('lobby.allow') }
                    onApprove = { approveKnockingParticipant }
                    onReject = { rejectKnockingParticipant }
                    participants = { _participants }
                    rejectButtonText = { t('lobby.reject') }
                    testIdPrefix = 'lobby' />
            </div>
        );
    }

    _onRespondToParticipant: (string, boolean) => Function;
}

export default translate(connect(abstractMapStateToProps)(KnockingParticipantList));
