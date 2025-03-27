import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    setFollowMe,
    setFollowMeRecorder,
    setStartMutedPolicy,
    setStartReactionsMuted
} from '../../../base/conference/actions';
import { updateSettings } from '../../../base/settings/actions';
import Switch from '../../../base/ui/components/native/Switch';
import { getModeratorTabProps } from '../../functions.native';

import FormRow from './FormRow';
import FormSection from './FormSection';

const ModeratorSection = () => {
    const dispatch = useDispatch();
    const {
        chatWithPermissionsEnabled,
        followMeActive,
        followMeEnabled,
        followMeRecorderActive,
        followMeRecorderEnabled,
        startAudioMuted,
        startVideoMuted,
        startReactionsMuted
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
    const onChatWithPermissionsToggled = useCallback((enabled?: boolean) => {
        const currentPermissions = conference?.getMetadataHandler().getMetadata().permissions || {};

        conference?.getMetadataHandler().setMetadata('permissions', {
            ...currentPermissions,
            groupChatRestricted: enabled
        });
    }, [ dispatch, conference ]);

    const followMeRecorderChecked = followMeRecorderEnabled && !followMeRecorderActive;

    const moderationSettings = useMemo(() => {
        const moderation = [
            {
                disabled: false,
                label: 'settings.startAudioMuted',
                state: startAudioMuted,
                onChange: onStartAudioMutedToggled
            },
            {
                disabled: false,
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
        ];

        if (disableReactionsModeration) {
            moderation.pop();
        }

        return moderation;
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
