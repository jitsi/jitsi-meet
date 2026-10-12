import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import TogglePinToStageButton from '../../../../features/video-menu/components/web/TogglePinToStageButton';
import Avatar from '../../../base/avatar/components/Avatar';
import { IconPlay } from '../../../base/icons/svg';
import { isSharedVideoParticipant, isWhiteboardParticipant } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import SendToSecondScreenButton from '../../../multi-screen/components/SendToSecondScreenButton';
import { ISecondScreenSource } from '../../../multi-screen/types';
import { stopSharedVideo } from '../../../shared-video/actions';
import { getParticipantMenuButtonsWithNotifyClick, showOverflowDrawer } from '../../../toolbox/functions.web';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { setWhiteboardOpen } from '../../../whiteboard/actions';
import { WHITEBOARD_ID } from '../../../whiteboard/constants';
import { PARTICIPANT_MENU_BUTTONS as BUTTONS } from '../../constants';

/**
 * Module-scoped so the second-screen trigger's click handler stays stable
 * across renders. Both of the participants this menu serves have a second-screen
 * view of their own, so neither goes to the second screen as a video track.
 */
const WHITEBOARD_SECOND_SCREEN_SOURCE: ISecondScreenSource = { role: 'whiteboard' };
const SHARED_VIDEO_SECOND_SCREEN_SOURCE: ISecondScreenSource = { role: 'sharedvideo' };

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
     * Shared video local participant owner.
     */
    localVideoOwner?: boolean;

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
     * Participant reference.
     */
    participant: IParticipant;

    /**
     * Whether or not the menu is displayed in the thumbnail remote video menu.
     */
    thumbnailMenu?: boolean;
}

const FakeParticipantContextMenu = ({
    className,
    closeDrawer,
    drawerParticipant,
    localVideoOwner,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect,
    participant,
    thumbnailMenu
}: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _overflowDrawer: boolean = useSelector(showOverflowDrawer);
    const buttonsWithNotifyClick = useSelector(getParticipantMenuButtonsWithNotifyClick);

    const notifyClick = useCallback(
        (buttonKey: string, participantId?: string) => {
            const notifyMode = buttonsWithNotifyClick?.get(buttonKey);

            if (!notifyMode) {
                return;
            }

            APP.API.notifyParticipantMenuButtonClicked(
                buttonKey,
                participantId,
                notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }, [ buttonsWithNotifyClick ]);


    const clickHandler = useCallback(() => onSelect(true), [ onSelect ]);

    const _onStopSharedVideo = useCallback(() => {
        clickHandler();
        dispatch(stopSharedVideo());
    }, [ stopSharedVideo ]);

    const _onHideWhiteboard = useCallback(() => {
        clickHandler();
        dispatch(setWhiteboardOpen(false));
    }, [ setWhiteboardOpen ]);

    const secondScreenSource = useMemo(() => {
        if (isWhiteboardParticipant(participant)) {
            return WHITEBOARD_SECOND_SCREEN_SOURCE;
        }

        return isSharedVideoParticipant(participant) ? SHARED_VIDEO_SECOND_SCREEN_SOURCE : undefined;
    }, [ participant ]);

    const _getActions = useCallback(() => {
        if (isWhiteboardParticipant(participant)) {
            return [ {
                accessibilityLabel: t('toolbar.hideWhiteboard'),
                icon: IconPlay,
                onClick: _onHideWhiteboard,
                text: t('toolbar.hideWhiteboard')
            } ];
        }

        if (localVideoOwner) {
            return [ {
                accessibilityLabel: t('toolbar.stopSharedVideo'),
                icon: IconPlay,
                onClick: _onStopSharedVideo,
                text: t('toolbar.stopSharedVideo')
            } ];
        }
    }, [ localVideoOwner, participant.fakeParticipant ]);

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

            <ContextMenuItemGroup
                actions = { _getActions() }>
                {isWhiteboardParticipant(participant) && (
                    <TogglePinToStageButton
                        key = 'pinToStage'
                        // eslint-disable-next-line react/jsx-no-bind
                        notifyClick = { () => notifyClick(BUTTONS.PIN_TO_STAGE, WHITEBOARD_ID) }
                        notifyMode = { buttonsWithNotifyClick?.get(BUTTONS.PIN_TO_STAGE) }
                        participantID = { WHITEBOARD_ID } />
                )}
                {secondScreenSource && (
                    <SendToSecondScreenButton
                        key = 'sendToSecondScreen'
                        // eslint-disable-next-line react/jsx-no-bind
                        notifyClick = { () => notifyClick(BUTTONS.SEND_TO_SECOND_SCREEN, participant.id) }
                        notifyMode = { buttonsWithNotifyClick?.get(BUTTONS.SEND_TO_SECOND_SCREEN) }
                        participantID = { participant.id }
                        source = { secondScreenSource } />
                )}
            </ContextMenuItemGroup>

        </ContextMenu>
    );
};

export default FakeParticipantContextMenu;
