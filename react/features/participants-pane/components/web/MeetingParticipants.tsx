/* eslint-disable lines-around-comment */

import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IState } from '../../../app/types';
// @ts-ignore
import { rejectParticipantAudio } from '../../../av-moderation/actions';
// @ts-ignore
import useContextMenu from '../../../base/components/context-menu/useContextMenu';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
// @ts-ignore
import { isToolbarButtonEnabled } from '../../../base/config/functions.web';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getParticipantById } from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Input from '../../../base/ui/components/web/Input';
import { normalizeAccents } from '../../../base/util/strings.web';
// @ts-ignore
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
// @ts-ignore
import { showOverflowDrawer } from '../../../toolbox/functions';
// @ts-ignore
import { muteRemote } from '../../../video-menu/actions.any';
// @ts-ignore
import { getSortedParticipantIds, shouldRenderInviteButton } from '../../functions';
// @ts-ignore
import { useParticipantDrawer } from '../../hooks';

import { InviteButton } from './InviteButton';
// @ts-ignore
import MeetingParticipantContextMenu from './MeetingParticipantContextMenu';
// @ts-ignore
import MeetingParticipantItems from './MeetingParticipantItems';

const useStyles = makeStyles()((theme: Theme) => {
    return {
        heading: {
            color: theme.palette.text02,
            // @ts-ignore
            ...withPixelLineHeight(theme.typography.labelButton),
            margin: `8px 0 ${participantsPaneTheme.panePadding}px`,

            [`@media(max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                // @ts-ignore
                ...withPixelLineHeight(theme.typography.labelButtonLarge)
            }
        },

        search: {
            '& input': {
                textAlign: 'center',
                paddingRight: '16px'
            }
        }
    };
});

type Props = {
    currentRoom?: { name: string; };
    overflowDrawer?: boolean;
    participantsCount?: number;
    searchString: string;
    setSearchString: (newValue: string) => void;
    showInviteButton?: boolean;
    sortedParticipantIds?: Array<string>;
};

/**
 * Renders the MeetingParticipantList component.
 * NOTE: This component is not using useSelector on purpose. The child components MeetingParticipantItem
 * and MeetingParticipantContextMenu are using connect. Having those mixed leads to problems.
 * When this one was using useSelector and the other two were not -the other two were re-rendered before this one was
 * re-rendered, so when participant is leaving, we first re-render the item and menu components,
 * throwing errors (closing the page) before removing those components for the participant that left.
 *
 * @returns {ReactNode} - The component.
 */
function MeetingParticipants({
    currentRoom,
    overflowDrawer,
    participantsCount,
    searchString,
    setSearchString,
    showInviteButton,
    sortedParticipantIds = []
}: Props) {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [ lowerMenu, , toggleMenu, menuEnter, menuLeave, raiseContext ] = useContextMenu();

    const muteAudio = useCallback(id => () => {
        dispatch(muteRemote(id, MEDIA_TYPE.AUDIO));
        dispatch(rejectParticipantAudio(id));
    }, [ dispatch ]);
    const [ drawerParticipant, closeDrawer, openDrawerForParticipant ] = useParticipantDrawer();

    // FIXME:
    // It seems that useTranslation is not very scalable. Unmount 500 components that have the useTranslation hook is
    // taking more than 10s. To workaround the issue we need to pass the texts as props. This is temporary and dirty
    // solution!!!
    // One potential proper fix would be to use react-window component in order to lower the number of components
    // mounted.
    const participantActionEllipsisLabel = t('participantsPane.actions.moreParticipantOptions');
    const youText = t('chat.you');
    const askUnmuteText = t('participantsPane.actions.askUnmute');
    const muteParticipantButtonText = t('dialog.muteParticipantButton');
    const isBreakoutRoom = useSelector(isInBreakoutRoom);

    const { classes: styles } = useStyles();

    return (
        <>
            <div className = { styles.heading }>
                {currentRoom?.name
                    ? `${currentRoom.name} (${participantsCount})`
                    : t('participantsPane.headings.participantsList', { count: participantsCount })}
            </div>
            {showInviteButton && <InviteButton />}
            <Input
                className = { styles.search }
                clearable = { true }
                onChange = { setSearchString }
                placeholder = { t('participantsPane.search') }
                value = { searchString } />
            <div>
                <MeetingParticipantItems
                    askUnmuteText = { askUnmuteText }
                    isInBreakoutRoom = { isBreakoutRoom }
                    lowerMenu = { lowerMenu }
                    muteAudio = { muteAudio }
                    muteParticipantButtonText = { muteParticipantButtonText }
                    openDrawerForParticipant = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participantActionEllipsisLabel = { participantActionEllipsisLabel }
                    participantIds = { sortedParticipantIds }
                    participantsCount = { participantsCount }
                    raiseContextId = { raiseContext.entity }
                    searchString = { normalizeAccents(searchString) }
                    toggleMenu = { toggleMenu }
                    youText = { youText } />
            </div>
            <MeetingParticipantContextMenu
                closeDrawer = { closeDrawer }
                drawerParticipant = { drawerParticipant }
                muteAudio = { muteAudio }
                offsetTarget = { raiseContext?.offsetTarget }
                onEnter = { menuEnter }
                onLeave = { menuLeave }
                onSelect = { lowerMenu }
                overflowDrawer = { overflowDrawer }
                participantID = { raiseContext?.entity } />
        </>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IState): Object {
    let sortedParticipantIds: any = getSortedParticipantIds(state);

    // Filter out the virtual screenshare participants since we do not want them to be displayed as separate
    // participants in the participants pane.
    sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
        const participant = getParticipantById(state, id);

        return !participant?.isVirtualScreenshareParticipant;
    });

    const participantsCount = sortedParticipantIds.length;
    const showInviteButton = shouldRenderInviteButton(state) && isToolbarButtonEnabled('invite', state);
    const overflowDrawer = showOverflowDrawer(state);
    const currentRoomId = getCurrentRoomId(state);
    const currentRoom = getBreakoutRooms(state)[currentRoomId];

    return {
        currentRoom,
        overflowDrawer,
        participantsCount,
        showInviteButton,
        sortedParticipantIds
    };
}

export default connect(_mapStateToProps)(MeetingParticipants);
