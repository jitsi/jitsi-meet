import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    setStartMutedPolicy,
    setStartReactionsMuted
} from '../../../base/conference/actions';
import { updateSettings } from '../../../base/settings/actions';
import Switch from '../../../base/ui/components/native/Switch';
import { setFollowMe, setFollowMeRecorder } from '../../../follow-me/actions';
import { getModeratorTabProps } from '../../functions.native';

import FormRow from './FormRow';
import FormSection from './FormSection';

const ModeratorSection = () => {
    const dispatch = useDispatch();
    const {
        audioModerationEnabled,
        chatWithPermissionsEnabled,
        privateChatWithPermissionsEnabled,
        sharedVideoWithPermissionsEnabled,
        showSharedVideoWithPermissions,
        followMeActive,
        followMeEnabled,
        followMeRecorderActive,
        followMeRecorderEnabled,
        startAudioMuted,
        startVideoMuted,
        startReactionsMuted,
        videoModerationEnabled
    } = useSelector((state: IReduxState) => getModeratorTabProps(state));

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
        dispatch(setFollowMe(Boolean(enabled)));
    }, [ dispatch, setFollowMe ]);

    const onFollowMeRecorderToggled = useCallback((enabled?: boolean) => {
        dispatch(setFollowMeRecorder(Boolean(enabled)));
    }, [ dispatch, setFollowMeRecorder ]);

    const onStartReactionsMutedToggled = useCallback((enabled?: boolean) => {
        dispatch(setStartReactionsMuted(Boolean(enabled), true));
        dispatch(updateSettings({ soundsReactions: enabled }));
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
    }, [ conference, chatWithPermissionsEnabled, privateChatWithPermissionsEnabled, sharedVideoWithPermissionsEnabled ]);

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
                label: 'settings.startReactionsMuted',
                state: startReactionsMuted,
                onChange: onStartReactionsMutedToggled
            },
            {
                label: 'settings.chatWithPermissions',
                state: chatWithPermissionsEnabled,
                onChange: onChatWithPermissionsToggled
            },
            {
                label: 'settings.privateChatWithPermissions',
                state: privateChatWithPermissionsEnabled,
                onChange: onPrivateChatWithPermissionsToggled
            },
            {
                label: 'settings.sharedVideoWithPermissions',
                state: sharedVideoWithPermissionsEnabled,
                onChange: onSharedVideoWithPermissionsToggled
            },
        ];

        return moderation.filter(({ label }) => {
            // Remove the entries by name. A pop() here took out whichever
            // entry came last, which is not the reactions one.
            if (label === 'settings.startReactionsMuted') {
                return !disableReactionsModeration;
            }

            if (label === 'settings.sharedVideoWithPermissions') {
                return showSharedVideoWithPermissions;
            }

            return true;
        });
    }, [ startAudioMuted,
        startVideoMuted,
        followMeEnabled,
        followMeRecorderEnabled,
        disableReactionsModeration,
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
