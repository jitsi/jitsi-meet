import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../app/types';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import { isAudioMuted, isVideoMuted } from '../base/media/functions';
import { raiseHand } from '../base/participants/actions';
import { getLocalParticipant, hasRaisedHand } from '../base/participants/functions';
import { toggleChat } from '../chat/actions.web';
import { isChatDisabled } from '../chat/functions';
import { beginAddPeople } from '../invite/actions.any';
import { toggleNoiseSuppression } from '../noise-suppression/actions';
import { isNoiseSuppressionEnabled } from '../noise-suppression/functions';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../participants-pane/actions.web';
import {
    getParticipantsPaneOpen,
    isParticipantsPaneEnabled
} from '../participants-pane/functions';
import { startScreenShareFlow } from '../screen-share/actions.web';
import { isScreenVideoShared } from '../screen-share/functions';
import { isButtonEnabled } from '../toolbox/functions.web';
import { muteLocal } from '../video-menu/actions.any';

import { ICommand } from './types';

/**
 * Custom hook that returns the list of available commands
 * for the command palette. Labels update dynamically based
 * on the current application state.
 *
 * @returns {ICommand[]}
 */
export function useCommands(): ICommand[] {
    const dispatch: IStore['dispatch'] = useDispatch();
    const toolbarButtons = useSelector(
        (state: IReduxState) => state['features/toolbox'].toolbarButtons || []);
    const audioMuted = useSelector(isAudioMuted);
    const videoMuted = useSelector(isVideoMuted);
    const screenSharing = useSelector(isScreenVideoShared);
    const chatOpen = useSelector((state: IReduxState) => state['features/chat'].isOpen);
    const raisedHand = useSelector(
        (state: IReduxState) => hasRaisedHand(getLocalParticipant(state)));
    const participantsPaneOpen = useSelector(getParticipantsPaneOpen);
    const noiseSuppressionOn = useSelector(isNoiseSuppressionEnabled);
    const _isChatDisabled = useSelector(isChatDisabled);
    const _isParticipantsPaneEnabled = useSelector(isParticipantsPaneEnabled);
    const desktopSharingEnabled = JitsiMeetJS.isDesktopSharingEnabled();

    return useMemo(() => {
            const commands: ICommand[] = [];

            commands.push({
                id: 'toggle-audio',
                label: audioMuted ? 'commandPalette.unmute' : 'commandPalette.mute',
                execute: () => dispatch(muteLocal(!audioMuted, MEDIA_TYPE.AUDIO))
            });

            commands.push({
                id: 'toggle-video',
                label: videoMuted ? 'commandPalette.startCamera' : 'commandPalette.stopCamera',
                execute: () => dispatch(muteLocal(!videoMuted, MEDIA_TYPE.VIDEO))
            });

            if (desktopSharingEnabled && isButtonEnabled('desktop', toolbarButtons)) {
                commands.push({
                    id: 'toggle-screen-share',
                    label: screenSharing ? 'commandPalette.stopScreenShare' : 'commandPalette.startScreenShare',
                    execute: () => dispatch(startScreenShareFlow(!screenSharing))
                });
            }

            if (!_isChatDisabled && isButtonEnabled('chat', toolbarButtons)) {
                commands.push({
                    id: 'toggle-chat',
                    label: chatOpen ? 'commandPalette.closeChat' : 'commandPalette.openChat',
                    execute: () => dispatch(toggleChat())
                });
            }

            if (isButtonEnabled('raisehand', toolbarButtons)) {
                commands.push({
                    id: 'toggle-raise-hand',
                    label: raisedHand ? 'commandPalette.lowerHand' : 'commandPalette.raiseHand',
                    execute: () => dispatch(raiseHand(!raisedHand))
                });
            }

            if (_isParticipantsPaneEnabled
                && isButtonEnabled('participants-pane', toolbarButtons)) {
                commands.push({
                    id: 'toggle-participants-pane',
                    label: participantsPaneOpen ? 'commandPalette.closeParticipantsPane' : 'commandPalette.openParticipantsPane',
                    execute: () => {
                        if (participantsPaneOpen) {
                            dispatch(closeParticipantsPane());
                        } else {
                            dispatch(openParticipantsPane());
                        }
                    }
                });
            }

            if (isButtonEnabled('noisesuppression', toolbarButtons)) {
                commands.push({
                    id: 'toggle-noise-suppression',
                    label: noiseSuppressionOn ? 'commandPalette.disableNoiseSuppression' : 'commandPalette.enableNoiseSuppression',
                    execute: () => dispatch(toggleNoiseSuppression())
                });
            }

            if (isButtonEnabled('invite', toolbarButtons)) {
                commands.push({
                    id: 'invite-people',
                    label: 'commandPalette.invitePeople',
                    execute: () => dispatch(beginAddPeople())
                });
            }

            return commands;
        }, [ audioMuted, chatOpen, desktopSharingEnabled, dispatch, _isChatDisabled, _isParticipantsPaneEnabled, noiseSuppressionOn, participantsPaneOpen, raisedHand, screenSharing, toolbarButtons, videoMuted ]
    );
}
