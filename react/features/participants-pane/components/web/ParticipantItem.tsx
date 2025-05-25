import React, { ReactNode, useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import ListItem from '../../../base/ui/components/web/ListItem';
import {
    ACTION_TRIGGER,
    type ActionTrigger,
    AudioStateIcons,
    MEDIA_STATE,
    MediaState,
    VideoStateIcons
} from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';

interface IProps extends WithTranslation {

    /**
     * Type of trigger for the participant actions.
     */
    actionsTrigger?: ActionTrigger;

    /**
     * Media state for audio.
     */
    audioMediaState?: MediaState;

    /**
     * React children.
     */
    children?: ReactNode;

    /**
     * Whether or not to disable the moderator indicator.
     */
    disableModeratorIndicator?: boolean;

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName?: string;

    /**
     * Is this item highlighted/raised.
     */
    isHighlighted?: boolean;

    /**
     * Whether or not the participant is a moderator.
     */
    isModerator?: boolean;

    /**
     * True if the participant is local.
     */
    local?: boolean;

    /**
     * Callback for when the mouse leaves this component.
     */
    onLeave?: (e?: React.MouseEvent) => void;

    /**
     * Opens a drawer with participant actions.
     */
    openDrawerForParticipant?: Function;

    /**
     * If an overflow drawer can be opened.
     */
    overflowDrawer?: boolean;

    /**
     * The ID of the participant.
     */
    participantID: string;

    /**
     * True if the participant have raised hand.
     */
    raisedHand?: boolean;

    /**
     * Media state for video.
     */
    videoMediaState?: MediaState;

    /**
     * The translated "you" text.
     */
    youText?: string;
}

// Hardcoded theme colors (ideally from a theme context or SCSS variables)
const themeColors = {
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    primaryColor: '#7B61FF',
    borderColor: 'rgba(255, 255, 255, 0.1)', // from _variables.scss
    backgroundColorLight: '#252A3A', // for hover
    spacingSmall: '8px',
    spacingMedium: '16px'
};

const useStyles = makeStyles()(theme => {
    return {
        participantItem: { // Style for the ListItem root
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: `${themeColors.spacingSmall} ${themeColors.spacingMedium}`,
            borderBottom: `1px solid ${themeColors.borderColor}`,
            '&:hover': {
                backgroundColor: themeColors.backgroundColorLight
            }
        },
        avatarContainer: { // Renamed from 'avatar' for clarity
            marginRight: themeColors.spacingMedium, // Was theme.spacing(3) -> 16px
            display: 'flex',
            alignItems: 'center'
        },
        detailsContainer: { // New container for name and other text info
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            overflow: 'hidden', // To allow text truncation
            marginRight: themeColors.spacingSmall, // Space before indicators
        },
        nameContainer: {
            display: 'flex',
            alignItems: 'center', // Vertically align name and "you" text
            // flex: 1, // Removed to allow detailsContainer to manage flexGrow
            overflow: 'hidden'
        },
        name: {
            color: themeColors.textColorPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: '500' // Medium weight for name
        },
        youText: {
            color: themeColors.textColorSecondary,
            marginLeft: themeColors.spacingSmall,
            fontSize: '0.8rem'
        },
        moderatorLabel: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: themeColors.textColorSecondary,
            fontSize: '0.75rem',
            // Removed to be on its own line or integrated differently if needed by design
            // marginLeft: themeColors.spacingSmall 
        },
        indicatorsContainer: { // Container for status icons
            display: 'flex',
            alignItems: 'center',
            gap: themeColors.spacingSmall, // Space between icons

            // Styling for icons within this container
            '& .jitsi-icon svg': { // Target default icon wrapper
                fill: themeColors.textColorSecondary, // Default color for status icons
            },
            '& .jitsi-icon.status-raised-hand svg': { // Example for specific icon
                 fill: themeColors.primaryColor, // Raised hand often has accent color
            },
            '& .jitsi-icon.status-mic-muted svg': { // Example for specific icon
                 fill: themeColors.primaryColor, // Muted mic often has accent color
            }
        }
    };
});

/**
 * A component representing a participant entry in ParticipantPane and Lobby.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactNode}
 */
function ParticipantItem({
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    children,
    disableModeratorIndicator,
    displayName,
    isHighlighted,
    isModerator,
    local,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantID,
    raisedHand,
    t,
    videoMediaState = MEDIA_STATE.NONE,
    youText
}: IProps) {
    const onClick = useCallback(
        () => openDrawerForParticipant?.({
            participantID,
            displayName
        }), []);

    const { classes, cx } = useStyles(); // Added cx for easier class combining if needed

    // The ListItem component might not be flexible enough for the new horizontal design.
    // Consider reconstructing with divs or a more generic base component if ListItem imposes too many constraints.
    // For now, attempting to use ListItem's props effectively.

    // Avatar part for the icon prop of ListItem
    const avatar = (
        <div className = { classes.avatarContainer }>
            <Avatar
                displayName = { displayName }
                participantId = { participantID }
                size = { 32 } />
        </div>
    );

    // Text content part for the textChildren prop of ListItem
    const nameAndRole = (
        <div className = { classes.detailsContainer }>
            <div className = { classes.nameContainer }>
                <span className = { classes.name }>{displayName}</span>
                {local && <span className = { classes.youText }>&nbsp;({youText})</span>}
            </div>
            {isModerator && !disableModeratorIndicator && (
                <span className = { classes.moderatorLabel }>{t('videothumbnail.moderator')}</span>
            )}
        </div>
    );

    // Indicators part for the indicators prop of ListItem
    const statusIndicators = (
        <div className = { classes.indicatorsContainer }>
            {raisedHand && <RaisedHandIndicator className = "status-raised-hand" />}
            {/* Assuming VideoStateIcons and AudioStateIcons are components that render SVGs directly or wrapped SVGs */}
            {/* We need to ensure these icons can be styled by fill: currentColor or via specific classes */}
            <span className={cx({ 'status-video-off': videoMediaState !== MEDIA_STATE.ON })}>
                {VideoStateIcons[videoMediaState]}
            </span>
            <span className={cx({ 'status-mic-muted': audioMediaState === MEDIA_STATE.MUTED }, {'status-mic-talking': audioMediaState === MEDIA_STATE.UNMUTED_TALKING})}>
                 {AudioStateIcons[audioMediaState]}
            </span>
        </div>
    );

    // ListItem props need to be mapped to achieve horizontal layout:
    // icon -> avatar
    // textChildren -> nameAndRole
    // indicators -> statusIndicators
    // actions -> children (context menu trigger)
    return (
        <ListItem
            actions = { children }
            className = { classes.participantItem } // Apply main item style
            hideActions = { local } // Keep existing logic for local participant actions
            icon = { avatar }
            id = { `participant-item-${participantID}` }
            indicators = { statusIndicators }
            isHighlighted = { isHighlighted }
            onClick = { !local && overflowDrawer ? onClick : undefined }
            onMouseLeave = { onLeave }
            textChildren = { nameAndRole }
            trigger = { actionsTrigger } />
    );
}

export default translate(ParticipantItem);
