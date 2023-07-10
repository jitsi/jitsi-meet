import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import TogglePinToStageButton from '../../../../features/video-menu/components/web/TogglePinToStageButton';
import Avatar from '../../../base/avatar/components/Avatar';
import { getButtonNotifyMode, getParticipantMenuButtonsWithNotifyClick } from '../../../base/config/functions.web';
import { IconPlay } from '../../../base/icons/svg';
import { isWhiteboardParticipant } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { stopSharedVideo } from '../../../shared-video/actions.any';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { setWhiteboardOpen } from '../../../whiteboard/actions';
import { WHITEBOARD_ID } from '../../../whiteboard/constants';
import { PARTICIPANT_MENU_BUTTONS as BUTTONS } from '../../constants';

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
            const notifyMode = getButtonNotifyMode(buttonKey, buttonsWithNotifyClick);

            if (!notifyMode) {
                return;
            }

            APP.API.notifyParticipantMenuButtonClicked(
                buttonKey,
                participantId,
                notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }, [ buttonsWithNotifyClick, getButtonNotifyMode ]);


    const clickHandler = useCallback(() => onSelect(true), [ onSelect ]);

    const _onStopSharedVideo = useCallback(() => {
        clickHandler();
        dispatch(stopSharedVideo());
    }, [ stopSharedVideo ]);

    const _onHideWhiteboard = useCallback(() => {
        clickHandler();
        dispatch(setWhiteboardOpen(false));
    }, [ setWhiteboardOpen ]);

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
            className = { className }
            entity = { participant }
            hidden = { thumbnailMenu ? false : undefined }
            inDrawer = { thumbnailMenu && _overflowDrawer }
            isDrawerOpen = { Boolean(drawerParticipant) }
            offsetTarget = { offsetTarget }
            onClick = { onSelect }
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
                        notifyMode = { getButtonNotifyMode(BUTTONS.PIN_TO_STAGE, buttonsWithNotifyClick) }
                        participantID = { WHITEBOARD_ID } />
                )}
            </ContextMenuItemGroup>

        </ContextMenu>
    );
};

export default FakeParticipantContextMenu;
