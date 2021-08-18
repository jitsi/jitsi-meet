// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';


import { Icon, IconInviteMore } from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantCountWithFake,
    getRemoteParticipants
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { doInvitePeople } from '../../../invite/actions.native';
import {
    showConnectionStatus,
    showContextMenuDetails,
    showSharedVideoMenu
} from '../../actions.native';
import { shouldRenderInviteButton } from '../../functions';

import MeetingParticipantItem from './MeetingParticipantItem';
import styles from './styles';

type Props = {

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean
}

const MeetingParticipantList = ({ _localVideoOwner }: Props) => {
    const dispatch = useDispatch();
    const items = [];
    const localParticipant = useSelector(getLocalParticipant);
    const onInvite = useCallback(() => dispatch(doInvitePeople()), [ dispatch ]);
    const participants = useSelector(getRemoteParticipants);
    const participantsCount = useSelector(getParticipantCountWithFake);
    const showInviteButton = useSelector(shouldRenderInviteButton);
    const { t } = useTranslation();

    // eslint-disable-next-line react/no-multi-comp
    const renderParticipant = p => {
        if (p.isFakeParticipant) {
            if (_localVideoOwner) {
                return (
                    <MeetingParticipantItem
                        key = { p.id }
                        /* eslint-disable-next-line react/jsx-no-bind,no-confusing-arrow */
                        onPress = { () => dispatch(showSharedVideoMenu(p)) }
                        participantID = { p.id } />
                );
            }

            return (
                <MeetingParticipantItem
                    key = { p.id }
                    participantID = { p.id } />
            );
        }

        return (
            <MeetingParticipantItem
                key = { p.id }
                /* eslint-disable-next-line react/jsx-no-bind,no-confusing-arrow */
                onPress = { () => p.local
                    ? dispatch(showConnectionStatus(p.id)) : dispatch(showContextMenuDetails(p)) }
                participantID = { p.id } />
        );
    };

    items.push(renderParticipant(localParticipant));

    participants.forEach(p => {
        items.push(renderParticipant(p));
    });

    return (
        <View style = { styles.meetingList }>
            <Text style = { styles.meetingListDescription }>
                {t('participantsPane.headings.participantsList',
                    { count: participantsCount })}
            </Text>
            {
                showInviteButton
                && <Button
                    children = { t('participantsPane.actions.invite') }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    icon = { () =>
                        (<Icon
                            size = { 20 }
                            src = { IconInviteMore } />)
                    }
                    labelStyle = { styles.inviteLabel }
                    mode = 'contained'
                    onPress = { onInvite }
                    style = { styles.inviteButton } />
            }
            { items }
        </View>
    );
};

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    return {
        _localVideoOwner: Boolean(ownerId === localParticipantId)
    };
}

export default connect(_mapStateToProps)(MeetingParticipantList);
