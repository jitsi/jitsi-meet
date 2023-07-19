import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { rejectParticipantAudio, rejectParticipantVideo } from '../../../av-moderation/actions';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
import { isToolbarButtonEnabled } from '../../../base/config/functions.web';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getParticipantById, isScreenShareParticipant } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Input from '../../../base/ui/components/web/Input';
import useContextMenu from '../../../base/ui/hooks/useContextMenu.web';
import { normalizeAccents } from '../../../base/util/strings.web';
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { muteRemote } from '../../../video-menu/actions.web';
import { getSortedParticipantIds, isCurrentRoomRenamable, shouldRenderInviteButton } from '../../functions';
import { useParticipantDrawer } from '../../hooks';
import RenameButton from '../breakout-rooms/components/web/RenameButton';

import { InviteButton } from './InviteButton';
import MeetingParticipantContextMenu from './MeetingParticipantContextMenu';
import MeetingParticipantItems from './MeetingParticipantItems';

const useStyles = makeStyles()(theme => {
    return {
        headingW: {
            color: theme.palette.warning02
        },
        heading: {
            color: theme.palette.text02,
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            marginBottom: theme.spacing(3),

            [`@media(max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                ...withPixelLineHeight(theme.typography.bodyShortBoldLarge)
            }
        },

        search: {
            margin: `${theme.spacing(3)} 0`,

            '& input': {
                textAlign: 'center',
                paddingRight: '16px'
            }
        }
    };
});

interface IProps {
    currentRoom?: {
        jid: string;
        name: string;
    };
    overflowDrawer?: boolean;
    participantsCount?: number;
    searchString: string;
    setSearchString: (newValue: string) => void;
    showInviteButton?: boolean;
    sortedParticipantIds?: Array<string>;
}

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
}: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [ lowerMenu, , toggleMenu, menuEnter, menuLeave, raiseContext ] = useContextMenu<string>();
    const muteAudio = useCallback(id => () => {
        dispatch(muteRemote(id, MEDIA_TYPE.AUDIO));
        dispatch(rejectParticipantAudio(id));
    }, [ dispatch ]);
    const stopVideo = useCallback(id => () => {
        dispatch(muteRemote(id, MEDIA_TYPE.VIDEO));
        dispatch(rejectParticipantVideo(id));
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
    const isBreakoutRoom = useSelector(isInBreakoutRoom);
    const visitorsCount = useSelector((state: IReduxState) => state['features/visitors'].count || 0);
    const _isCurrentRoomRenamable = useSelector(isCurrentRoomRenamable);

    const { classes: styles, cx } = useStyles();

    return (
        <>
            <span
                aria-level = { 1 }
                className = 'sr-only'
                role = 'heading'>
                { t('participantsPane.title') }
            </span>
            {visitorsCount > 0 && (
                <div className = { cx(styles.heading, styles.headingW) }>
                    {t('participantsPane.headings.visitors', { count: visitorsCount })}
                </div>
            )}
            <div className = { styles.heading }>
                {currentRoom?.name
                    ? `${currentRoom.name} (${participantsCount})`
                    : t('participantsPane.headings.participantsList', { count: participantsCount })}
                { currentRoom?.name && _isCurrentRoomRenamable
                    && <RenameButton
                        breakoutRoomJid = { currentRoom?.jid }
                        name = { currentRoom?.name } /> }
            </div>
            {showInviteButton && <InviteButton />}
            <Input
                className = { styles.search }
                clearable = { true }
                id = 'participants-search-input'
                onChange = { setSearchString }
                placeholder = { t('participantsPane.search') }
                value = { searchString } />
            <div>
                <MeetingParticipantItems
                    isInBreakoutRoom = { isBreakoutRoom }
                    lowerMenu = { lowerMenu }
                    muteAudio = { muteAudio }
                    openDrawerForParticipant = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participantActionEllipsisLabel = { participantActionEllipsisLabel }
                    participantIds = { sortedParticipantIds }
                    raiseContextId = { raiseContext.entity }
                    searchString = { normalizeAccents(searchString) }
                    stopVideo = { stopVideo }
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
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);

    // Filter out the virtual screenshare participants since we do not want them to be displayed as separate
    // participants in the participants pane.
    sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
        const participant = getParticipantById(state, id);

        return !isScreenShareParticipant(participant);
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
