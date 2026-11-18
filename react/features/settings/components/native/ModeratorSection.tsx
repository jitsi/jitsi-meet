import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    setStartMutedPolicy,
    setStartReactionsMuted
} from '../../../base/conference/actions';
import { updateSettings } from '../../../base/settings/actions';
import Switch from '../../../base/ui/components/native/Switch';
import { setFollowMe, setFollowMeRecorder, setFollowMeRecorderExclusive } from '../../../follow-me/actions';
import { getModeratorTabProps } from '../../functions.native';

import FormRow from './FormRow';
import FormSection from './FormSection';

const ModeratorSection = () => {
    const dispatch = useDispatch();
    const {
        audioModerationEnabled,
        breakoutRoomJoinWithPermissionsEnabled,
        chatWithPermissionsEnabled,
        privateChatWithPermissionsEnabled,
        sharedVideoWithPermissionsEnabled,
        showSharedVideoWithPermissions,
        showBreakoutRoomJoinWithPermissions,
        followMeActive,
        followMeEnabled,
        followMeRecorderActive,
        followMeRecorderEnabled,
        hideChatWithPermissions,
        startAudioMuted,
        startVideoMuted,
        startReactionsMuted,
        videoModerationEnabled
    } = useSelector((state: IReduxState) => getModeratorTabProps(state), shallowEqual);

    const { disableReactionsModeration } = useSelector((state: IReduxState) => state['features/base/config']);

    const onStartAudioMutedToggled = useCallback((enabled?: boolean) => {
        dispatch(setStartMutedPolicy(
            Boolean(enabled), Boolean(startVideoMuted)));
    }, [ startVideoMuted, dispatch, setStartMutedPolicy ]);

    const onStartVideoMutedToggled = useCallback((enabled?: boolean) => {
        dispatch(setStartMutedPolicy(
            Boolean(startAudioMuted), Boolean(enabled)));
    }, [ startAudioMuted, dispatch, setStartMutedPolicy ]);

    const onFollowMeToggled = useCallback((enabled?: boolean) => {
        // Turning off the recorder mode also turns off follow me, thus do it first.
        if (enabled && followMeRecorderEnabled) {
            dispatch(setFollowMeRecorder(false));
        }
        dispatch(setFollowMe(Boolean(enabled)));
    }, [ followMeRecorderEnabled, dispatch, setFollowMe, setFollowMeRecorder ]);

    const onFollowMeRecorderToggled = useCallback((enabled?: boolean) => {
        dispatch(setFollowMeRecorderExclusive(Boolean(enabled)));
    }, [ dispatch, setFollowMeRecorderExclusive ]);

    const onStartReactionsMutedToggled = useCallback((enabled?: boolean) => {
        dispatch(setStartReactionsMuted(Boolean(enabled), true));
        dispatch(updateSettings({ soundsReactions: !enabled }));
    }, [ dispatch, updateSettings, setStartReactionsMuted ]);

    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);

    // The permissions that were set but that the server has not confirmed yet. The metadata changes only
    // when the server confirms it, thus a second toggle before that would put back the old value of the first.
    const pendingPermissions = useRef<Record<string, boolean | undefined>>({});

    // The values that were not confirmed belong to the previous room, e.g. when moving to a breakout room.
    useEffect(() => {
        pendingPermissions.current = {};
    }, [ conference ]);

    useEffect(() => {
        const confirmed = conference?.getMetadataHandler().getMetadata().permissions || {};

        for (const key of Object.keys(pendingPermissions.current)) {
            if (Boolean(confirmed[key]) === Boolean(pendingPermissions.current[key])) {
                delete pendingPermissions.current[key];
            }
        }
    }, [ conference, chatWithPermissionsEnabled, privateChatWithPermissionsEnabled, sharedVideoWithPermissionsEnabled,
        breakoutRoomJoinWithPermissionsEnabled ]);

    const setPermission = useCallback((key: string, enabled?: boolean) => {
        pendingPermissions.current[key] = enabled;

        conference?.getMetadataHandler().setMetadata('permissions', {
            ...conference?.getMetadataHandler().getMetadata().permissions,
            ...pendingPermissions.current
        });
    }, [ conference ]);

    const onChatWithPermissionsToggled = useCallback((enabled?: boolean) => {
        setPermission('groupChatRestricted', enabled);
    }, [ setPermission ]);

    const onPrivateChatWithPermissionsToggled = useCallback((enabled?: boolean) => {
        setPermission('privateChatRestricted', enabled);
    }, [ setPermission ]);

    const onSharedVideoWithPermissionsToggled = useCallback((enabled?: boolean) => {
        setPermission('sharedVideoRestricted', enabled);
    }, [ setPermission ]);

    const onBreakoutRoomJoinWithPermissionsToggled = useCallback((enabled?: boolean) => {
        setPermission('breakoutRoomJoinRestricted', enabled);
    }, [ setPermission ]);

    const followMeRecorderChecked = followMeRecorderEnabled && !followMeRecorderActive;

    const moderationSettings = useMemo(() => {
        const moderation = [
            {
                disabled: audioModerationEnabled,
                label: 'settings.startAudioMuted',
                state: startAudioMuted,
                onChange: onStartAudioMutedToggled
            },
            {
                disabled: videoModerationEnabled,
                label: 'settings.startVideoMuted',
                state: startVideoMuted,
                onChange: onStartVideoMutedToggled
            },
            {
                disabled: followMeActive || followMeRecorderActive,
                label: 'settings.followMe',
                state: followMeEnabled && !followMeActive && !followMeRecorderChecked,
                onChange: onFollowMeToggled
            },
            {
                disabled: followMeRecorderActive || followMeActive,
                label: 'settings.followMeRecorder',
                state: followMeRecorderChecked,
                onChange: onFollowMeRecorderToggled
            },
            {
                disabled: false,
                hidden: disableReactionsModeration,
                label: 'settings.startReactionsMuted',
                state: startReactionsMuted,
                onChange: onStartReactionsMutedToggled
            },
            {
                hidden: hideChatWithPermissions,
                label: 'settings.chatWithPermissions',
                state: chatWithPermissionsEnabled,
                onChange: onChatWithPermissionsToggled
            },
            {
                hidden: hideChatWithPermissions,
                label: 'settings.privateChatWithPermissions',
                state: privateChatWithPermissionsEnabled,
                onChange: onPrivateChatWithPermissionsToggled
            },
            {
                hidden: !showSharedVideoWithPermissions,
                label: 'settings.sharedVideoWithPermissions',
                state: sharedVideoWithPermissionsEnabled,
                onChange: onSharedVideoWithPermissionsToggled
            },
            {
                hidden: !showBreakoutRoomJoinWithPermissions,
                label: 'settings.breakoutRoomJoinWithPermissions',
                state: breakoutRoomJoinWithPermissionsEnabled,
                onChange: onBreakoutRoomJoinWithPermissionsToggled
            },
        ];

        // Hide the entries that the config or the room does not allow.
        return moderation.filter(({ hidden }) => !hidden);
    }, [ startAudioMuted,
        startVideoMuted,
        audioModerationEnabled,
        videoModerationEnabled,
        followMeActive,
        followMeEnabled,
        followMeRecorderActive,
        followMeRecorderChecked,
        followMeRecorderEnabled,
        disableReactionsModeration,
        hideChatWithPermissions,
        onStartAudioMutedToggled,
        onStartVideoMutedToggled,
        onFollowMeToggled,
        onFollowMeRecorderToggled,
        onStartReactionsMutedToggled,
        onChatWithPermissionsToggled,
        onPrivateChatWithPermissionsToggled,
        onSharedVideoWithPermissionsToggled,
        chatWithPermissionsEnabled,
        privateChatWithPermissionsEnabled,
        sharedVideoWithPermissionsEnabled,
        showSharedVideoWithPermissions,
        onBreakoutRoomJoinWithPermissionsToggled,
        breakoutRoomJoinWithPermissionsEnabled,
        showBreakoutRoomJoinWithPermissions,
        startReactionsMuted ]);

    return (
        <FormSection
            label = 'settings.playSounds'>
            {
                moderationSettings.map(({ label, state, onChange, disabled }) => (
                    <FormRow
                        key = { label }
                        label = { label }>
                        <Switch
                            checked = { Boolean(state) }
                            disabled = { disabled }
                            onChange = { onChange } />
                    </FormRow>
                ))
            }
        </FormSection>
    );
};

export default ModeratorSection;
