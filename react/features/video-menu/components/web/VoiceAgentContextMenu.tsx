import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { IParticipant } from '../../../base/participants/types';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { setVolume } from '../../../filmstrip/actions.web';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { hasVoiceAgentMenuItems } from '../../functions.web';

import VolumeSlider from './VolumeSlider';

interface IProps {

    /**
     * Class name for the context menu.
     */
    className?: string;

    /**
     * Closes a drawer if open.
     */
    closeDrawer?: () => void;

    /**
     * The participant for which the drawer is open.
     * It contains the displayName & participantID.
     */
    drawerParticipant?: {
        displayName: string;
        participantID: string;
    };

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement;

    /**
     * Callback for the mouse entering the component.
     */
    onEnter?: (e?: React.MouseEvent) => void;

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave?: (e?: React.MouseEvent) => void;

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: (value?: boolean | React.MouseEvent) => void;

    /**
     * The agent.
     */
    participant: IParticipant;

    /**
     * Whether or not the menu is displayed in the thumbnail remote video menu.
     */
    thumbnailMenu?: boolean;
}

/**
 * The context menu of a voice agent. An agent is a participant without a transport of its own, so neither the
 * moderation and messaging actions of a participant nor the actions of the other fake participants (shared video,
 * whiteboard) apply to it. What does apply is what this participant can do for themselves, starting with the
 * volume; a video source later changes nothing here.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element}
 */
const VoiceAgentContextMenu = ({
    className,
    closeDrawer,
    drawerParticipant,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect,
    participant,
    thumbnailMenu
}: IProps) => {
    const dispatch = useDispatch();
    const _overflowDrawer: boolean = useSelector(showOverflowDrawer);
    const { participantsVolume } = useSelector((state: IReduxState) => state['features/filmstrip']);
    const _volume = participantsVolume[participant.id] ?? 1;

    const clickHandler = useCallback(() => onSelect(true), [ onSelect ]);

    const _onVolumeChange = useCallback((value: number) => {
        dispatch(setVolume(participant.id, value));
    }, [ participant.id, dispatch ]);

    const hasItems = useSelector((state: IReduxState) => hasVoiceAgentMenuItems(state, Boolean(thumbnailMenu)));
    const showVolumeSlider = hasItems && typeof _volume === 'number' && !isNaN(_volume);

    return (
        <ContextMenu
            activateFocusTrap = { !thumbnailMenu }
            className = { className }
            entity = { participant }
            hidden = { thumbnailMenu ? false : undefined }
            inDrawer = { thumbnailMenu && _overflowDrawer }
            isDrawerOpen = { Boolean(drawerParticipant) }
            offsetTarget = { offsetTarget }
            onClick = { onSelect }
            onClickOutside = { thumbnailMenu ? undefined : clickHandler }
            onDrawerClose = { thumbnailMenu ? onSelect : closeDrawer }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            {!thumbnailMenu && _overflowDrawer && drawerParticipant && <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: drawerParticipant.displayName,
                    customIcon: <Avatar
                        participantId = { drawerParticipant.participantID }
                        size = { 20 } />,
                    text: drawerParticipant.displayName
                } ] } />}
            {showVolumeSlider && (
                <ContextMenuItemGroup>
                    <VolumeSlider
                        initialValue = { _volume }
                        key = 'volume-slider'
                        onChange = { _onVolumeChange } />
                </ContextMenuItemGroup>
            )}
        </ContextMenu>
    );
};

export default VoiceAgentContextMenu;
