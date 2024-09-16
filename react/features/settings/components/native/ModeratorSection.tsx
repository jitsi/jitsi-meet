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
        followMeEnabled,
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

    const moderationSettings = useMemo(() => {
        const moderation = [
            {
                label: 'settings.startAudioMuted',
                state: startAudioMuted,
                onChange: onStartAudioMutedToggled
            },
            {
                label: 'settings.startVideoMuted',
                state: startVideoMuted,
                onChange: onStartVideoMutedToggled
            },
            {
                label: 'settings.followMe',
                state: followMeEnabled,
                onChange: onFollowMeToggled
            },
            {
                label: 'settings.followMeRecorder',
                state: followMeRecorderEnabled,
                onChange: onFollowMeRecorderToggled
            },
            {
                label: 'settings.startReactionsMuted',
                state: startReactionsMuted,
                onChange: onStartReactionsMutedToggled
            }
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
                moderationSettings.map(({ label, state, onChange }) => (
                    <FormRow
                        key = { label }
                        label = { label }>
                        <Switch
                            checked = { Boolean(state) }
                            onChange = { onChange } />
                    </FormRow>
                ))
            }
        </FormSection>
    );
};

export default ModeratorSection;
