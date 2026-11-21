import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
import { getParticipantById, isScreenShareParticipant } from '../../../base/participants/functions';
import Input from '../../../base/ui/components/web/Input';
import useContextMenu from '../../../base/ui/hooks/useContextMenu.web';
import { normalizeAccents } from '../../../base/util/strings.web';
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { isButtonEnabled, showOverflowDrawer } from '../../../toolbox/functions.web';
import { iAmVisitor } from '../../../visitors/functions';
import {
    getSortedParticipantIds,
    isCurrentRoomRenamable,
    participantMatchesSearch,
    shouldRenderInviteButton
} from '../../functions';
import { useParticipantDrawer } from '../../hooks.web';
import RenameButton from '../breakout-rooms/components/web/RenameButton';

import { InviteButton } from './InviteButton';
import MeetingParticipantContextMenu from './MeetingParticipantContextMenu';
import MeetingParticipantItems from './MeetingParticipantItems';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0
        },

        headingW: {
            color: theme.palette.participantWarningText
        },
        heading: {
            color: theme.palette.participantSectionText,
            ...theme.typography.bodyShortBold,
            marginBottom: theme.spacing(3),

            [`@media(max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                ...theme.typography.bodyShortBoldLarge
            }
        },

        search: {
            margin: `${theme.spacing(3)} 0`,

            '& input': {
                textAlign: 'center',
                paddingRight: '16px'
            }
        },

        listContainer: {
            flex: 1,
            minHeight: '200px',
            maxHeight: '100%',
            position: 'relative'
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
    const { t } = useTranslation();

    const [ lowerMenu, , toggleMenu, menuEnter, menuLeave, raiseContext ] = useContextMenu<string>();
    const [ drawerParticipant, closeDrawer, openDrawerForParticipant ] = useParticipantDrawer();

    // Virtualization is handled via react-window in MeetingParticipantItems to keep only
    // visible rows mounted for large meetings.
    const participantActionEllipsisLabel = t('participantsPane.actions.moreParticipantOptions');
    const youText = t('chat.you');
    const isBreakoutRoom = useSelector(isInBreakoutRoom);
    const _isCurrentRoomRenamable = useSelector(isCurrentRoomRenamable);

    const { classes: styles } = useStyles();

    return (
        <div className = { styles.container }>
            <span
                aria-level = { 1 }
                className = 'sr-only'
                role = 'heading'>
                { t('participantsPane.title') }
            </span>
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
                accessibilityLabel = { t('participantsPane.search') }
                className = { styles.search }
                clearable = { true }
                hiddenDescription = { t('participantsPane.searchDescription') }
                id = 'participants-search-input'
                onChange = { setSearchString }
                placeholder = { t('participantsPane.search') }
                value = { searchString } />
            <div className = { styles.listContainer }>
                <MeetingParticipantItems
                    isInBreakoutRoom = { isBreakoutRoom }
                    lowerMenu = { lowerMenu }
                    openDrawerForParticipant = { openDrawerForParticipant }
                    overflowDrawer = { overflowDrawer }
                    participantActionEllipsisLabel = { participantActionEllipsisLabel }
                    participantIds = { sortedParticipantIds }
                    raiseContextId = { raiseContext.entity }
                    searchString = { normalizeAccents(searchString) }
                    toggleMenu = { toggleMenu }
                    youText = { youText } />
            </div>
            <MeetingParticipantContextMenu
                closeDrawer = { closeDrawer }
                drawerParticipant = { drawerParticipant }
                offsetTarget = { raiseContext?.offsetTarget }
                onEnter = { menuEnter }
                onLeave = { menuLeave }
                onSelect = { lowerMenu }
                overflowDrawer = { overflowDrawer }
                participantID = { raiseContext?.entity } />
        </div>
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
function _mapStateToProps(state: IReduxState, ownProps: any) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);
    const _iAmVisitor = iAmVisitor(state);

    // Filter out the virtual screenshare participants since we do not want them to be displayed as separate
    // participants in the participants pane.
    // Filter local participant when in visitor mode
    sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
        const participant = getParticipantById(state, id);

        if (_iAmVisitor && participant?.local) {
            return false;
        }

        return !isScreenShareParticipant(participant);
    });

    const participantsCount = sortedParticipantIds.length;
    const showInviteButton = shouldRenderInviteButton(state) && isButtonEnabled('invite', state);
    const overflowDrawer = showOverflowDrawer(state);
    const currentRoomId = getCurrentRoomId(state);
    const currentRoom = getBreakoutRooms(state)[currentRoomId];

    const { searchString } = ownProps;

    if (searchString) {
        const normalizedSearch = normalizeAccents(searchString);

        sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
            const participant = getParticipantById(state, id);

            return participantMatchesSearch(participant, normalizedSearch);
        });
    }

    return {
        currentRoom,
        overflowDrawer,
        participantsCount,
        showInviteButton,
        sortedParticipantIds
    };
}

export default connect(_mapStateToProps)(MeetingParticipants);
