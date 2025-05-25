import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { rejectParticipantAudio, rejectParticipantVideo } from '../../../av-moderation/actions';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getParticipantById, isScreenShareParticipant } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Input from '../../../base/ui/components/web/Input';
import useContextMenu from '../../../base/ui/hooks/useContextMenu.web';
import { normalizeAccents } from '../../../base/util/strings.web';
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { isButtonEnabled, showOverflowDrawer } from '../../../toolbox/functions.web';
import { muteRemote } from '../../../video-menu/actions.web';
import { getSortedParticipantIds, isCurrentRoomRenamable, shouldRenderInviteButton } from '../../functions';
import { useParticipantDrawer } from '../../hooks';
import RenameButton from '../breakout-rooms/components/web/RenameButton';

import { InviteButton } from './InviteButton';
import MeetingParticipantContextMenu from './MeetingParticipantContextMenu';
import MeetingParticipantItems from './MeetingParticipantItems';

// Hardcoded theme colors (ideally from a theme context or SCSS variables)
const themeColors = {
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColorDark: '#1A1E2D', // For input background
    spacingMedium: '16px',
    spacingLarge: '24px',
    borderRadius: '10px'
};

const useStyles = makeStyles()(theme => {
    return {
        container: { // Added a main container for padding
            padding: `0 ${themeColors.spacingMedium} ${themeColors.spacingMedium}`, // Padding for the whole pane content area
        },
        headingW: {
            color: theme.palette.warning02 // Keep as is, assuming it's for specific warnings
        },
        heading: {
            color: themeColors.textColorPrimary, // Updated color
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            marginBottom: themeColors.spacingLarge, // Use defined spacing

            [`@media(max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                ...withPixelLineHeight(theme.typography.bodyShortBoldLarge)
            }
        },
        search: {
            margin: `${themeColors.spacingLarge} 0`, // Use defined spacing
            '& .input-control': { // Targeting the inner structure of Input component
                width: '100% !important' // Ensure it takes full width if not already
            },
            '& input': {
                backgroundColor: themeColors.backgroundColorDark, // Darker background for input
                color: themeColors.textColorPrimary,
                border: `1px solid ${themeColors.borderColor}`,
                borderRadius: `calc(${themeColors.borderRadius} / 2)`, // Slightly less rounded than main border
                padding: `${themeColors.spacingSmall} ${themeColors.spacingMedium}`, // Consistent padding
                textAlign: 'left', // Align text to left for standard search input
                '&::placeholder': {
                    color: themeColors.textColorSecondary
                }
            }
        },
        // Ensure MeetingParticipantItems has some top margin if search is hidden
        meetingParticipantItemsContainer: {
            marginTop: themeColors.spacingMedium 
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
    const _isCurrentRoomRenamable = useSelector(isCurrentRoomRenamable);

    const { classes: styles, cx } = useStyles(); // Added cx

    return (
        <div className = { styles.container }> {/* Added main container div */}
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
            <div className={styles.meetingParticipantItemsContainer}>
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
function _mapStateToProps(state: IReduxState) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);

    // Filter out the virtual screenshare participants since we do not want them to be displayed as separate
    // participants in the participants pane.
    sortedParticipantIds = sortedParticipantIds.filter((id: any) => {
        const participant = getParticipantById(state, id);

        return !isScreenShareParticipant(participant);
    });

    const participantsCount = sortedParticipantIds.length;
    const showInviteButton = shouldRenderInviteButton(state) && isButtonEnabled('invite', state);
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
