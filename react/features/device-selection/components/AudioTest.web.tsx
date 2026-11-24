import { alpha } from '@mui/material/styles';
import { uniqueId } from 'lodash-es';
import React, { ChangeEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { isAdvancedAudioSettingsEnabled } from '../../base/config/functions.any';
import { formatDeviceLabel, getDefaultDeviceId, getDeviceLabelById } from '../../base/devices/functions.web';
import { hideDialog } from '../../base/dialog/actions';
import Icon from '../../base/icons/components/Icon';
import {
    IconCheck,
    IconCloseLarge,
    IconDeviceHeadphone,
    IconInfoCircle,
    IconMic,
    IconReplay,
    IconVolumeUp,
    IconWarning
} from '../../base/icons/svg';
import JitsiMeetJS, { JitsiTrackErrors, JitsiTrackEvents } from '../../base/lib-jitsi-meet';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions.web';
import { MEDIA_TYPE } from '../../base/media/constants';
import { updateSettings } from '../../base/settings/actions';
import { getUserSelectedMicDeviceId, getUserSelectedOutputDeviceId } from '../../base/settings/functions.web';
import { getLocalJitsiAudioTrackSettings, isLocalTrackMuted } from '../../base/tracks/functions.any';
import BaseDialog from '../../base/ui/components/web/BaseDialog';
import Button from '../../base/ui/components/web/Button';
import ClickableIcon from '../../base/ui/components/web/ClickableIcon';
import Select from '../../base/ui/components/web/Select';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { isNoiseSuppressionEnabled } from '../../noise-suppression/functions';
import { openSettingsDialog } from '../../settings/actions.web';
import { SETTINGS_TABS } from '../../settings/constants';
import { isButtonEnabled } from '../../toolbox/functions.any';
import { iAmVisitor } from '../../visitors/functions';
import { openAudioSettingsWhenApplied, submitAudioTestDevices } from '../actions.web';
import { getAudioTestDevices } from '../functions.web';
import logger from '../logger';

import AudioInputPreview from './AudioInputPreview.web';

interface IProps {

    /**
     * Whether the test is shown in the page, e.g. in the pre-join preview, instead of in a dialog.
     */
    inline?: boolean;

    /**
     * Whether the test was opened from the settings on the welcome page.
     */
    isDisplayedOnWelcomePage?: boolean;

    /**
     * The microphone to start with, e.g. the one chosen in the audio settings.
     */
    micId?: string;

    /**
     * The speakers to start with, e.g. the ones chosen in the audio settings.
     */
    speakerId?: string;
}

type Issue = 'echo' | 'quiet' | 'silent';

type Step = 'choose' | 'done' | 'intro' | 'listen' | 'record' | 'troubleshoot';

const ISSUES: Issue[] = [ 'silent', 'quiet', 'echo' ];

const METER_SECTIONS = 16;

const MIC_ERRORS: { [name: string]: string; } = {
    [JitsiTrackErrors.CONSTRAINT_FAILED]: 'dialog.micConstraintFailedError',
    [JitsiTrackErrors.NOT_FOUND]: 'dialog.micNotFoundError',
    [JitsiTrackErrors.PERMISSION_DENIED]: 'dialog.micPermissionDeniedError',
    [JitsiTrackErrors.TIMEOUT]: 'dialog.micTimeoutError'
};

const RECORDING_DURATION = 5000;

// How often the recording's progress and its audio level are sampled.
const SAMPLE_INTERVAL = 150;

const STEPS: Step[] = [ 'choose', 'record', 'listen' ];

const TRACK_TIMEOUT = 5000;

const useStyles = makeStyles()(theme => {
    return {
        actions: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        bar: {
            backgroundColor: theme.palette.ui03,
            borderRadius: '2px',
            height: '4px',
            width: '28px'
        },
        barDone: {
            backgroundColor: theme.palette.action01
        },
        bars: {
            display: 'flex',
            gap: theme.spacing(1)
        },
        caption: {
            ...theme.typography.labelRegular,
            alignItems: 'center',
            color: theme.palette.dialogSecondaryText,
            display: 'flex',
            gap: theme.spacing(2),
            justifyContent: 'space-between',
            marginTop: theme.spacing(2)
        },
        captionDevice: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        circle: {
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.action01, 0.2),
            borderRadius: '50%',
            display: 'flex',
            flexShrink: 0,
            height: '80px',
            justifyContent: 'center',
            position: 'relative',
            width: '80px'
        },
        circleSuccess: {
            backgroundColor: alpha(theme.palette.success01, 0.15)
        },
        content: {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: 0,
            overflowY: 'auto',
            padding: theme.spacing(4)
        },
        description: {
            ...theme.typography.bodyLongRegular,
            color: theme.palette.dialogSecondaryText,
            margin: 0
        },
        dot: {
            backgroundColor: theme.palette.iconError,
            borderRadius: '50%',
            display: 'inline-block',
            height: '6px',
            marginRight: theme.spacing(2),
            verticalAlign: 'middle',
            width: '6px'
        },
        field: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        fieldLabel: {
            ...theme.typography.bodyShortBold,
            alignItems: 'center',
            color: theme.palette.dialogText,
            display: 'flex',
            gap: '6px'
        },
        fields: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(3)
        },
        header: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between'
        },
        headerLabel: {
            ...theme.typography.labelRegular,
            color: theme.palette.dialogSecondaryText
        },
        heading: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        hint: {
            ...theme.typography.labelRegular,
            alignItems: 'center',
            color: theme.palette.dialogSecondaryText,
            display: 'flex',
            gap: '6px'
        },
        inline: {
            alignItems: 'center',
            boxSizing: 'border-box',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            padding: theme.spacing(3),
            position: 'absolute'
        },
        inlineCard: {
            backgroundColor: theme.palette.dialogBackground,
            border: `1px solid ${theme.palette.dialogBorder}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            boxShadow: '0px 4px 25px 4px rgba(20, 20, 20, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            maxWidth: '100%',
            width: '400px'
        },
        introHint: {
            ...theme.typography.labelRegular,
            color: theme.palette.dialogSecondaryText,
            margin: 0,
            textAlign: 'center'
        },
        issue: {
            ...theme.typography.bodyShortBold,
            alignItems: 'center',
            border: `1px solid ${theme.palette.dialogBorder}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            color: theme.palette.dialogText,
            cursor: 'pointer',
            display: 'flex',
            gap: '10px',
            padding: '12px 14px',

            '& input': {
                accentColor: theme.palette.action01,
                height: '16px',
                margin: 0,
                width: '16px'
            }
        },
        issueSelected: {
            backgroundColor: alpha(theme.palette.action01, 0.12),
            borderColor: theme.palette.action01
        },
        issues: {
            border: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2),
            margin: 0,
            padding: 0
        },
        playback: {
            alignItems: 'center',
            display: 'flex',
            gap: theme.spacing(3)
        },
        progress: {
            backgroundColor: theme.palette.ui03,
            borderRadius: '2px',
            flex: 1,
            height: '4px',
            overflow: 'hidden'
        },
        progressFill: {
            backgroundColor: theme.palette.action01,
            height: '100%',
            transition: `width ${SAMPLE_INTERVAL}ms linear`
        },
        pulse: {
            '&::after': {
                animation: `${keyframes`
                    0% {
                        opacity: 0.6;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.55);
                    }
                `} 1.4s ease-out infinite`,
                border: `2px solid ${theme.palette.action01}`,
                borderRadius: '50%',
                content: '""',
                inset: 0,
                position: 'absolute'
            },

            '@media (prefers-reduced-motion: reduce)': {
                '&::after': {
                    animation: 'none'
                }
            }
        },
        question: {
            ...theme.typography.bodyShortBold,
            color: theme.palette.dialogText,
            margin: 0
        },
        status: {
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2),
            textAlign: 'center'
        },
        summary: {
            border: `1px solid ${theme.palette.dialogBorder}`,
            borderRadius: `${theme.shape.borderRadius}px`
        },
        summaryRow: {
            ...theme.typography.bodyShortRegular,
            alignItems: 'center',
            color: theme.palette.dialogText,
            display: 'flex',
            gap: theme.spacing(2),
            padding: '10px 12px',

            '& + &': {
                borderTop: `1px solid ${theme.palette.dialogBorder}`
            },

            '& span': {
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }
        },
        tip: {
            ...theme.typography.bodyShortRegular,
            alignItems: 'flex-start',
            backgroundColor: alpha(theme.palette.action01, 0.2),
            borderRadius: `${theme.shape.borderRadius}px`,
            color: theme.palette.dialogText,
            display: 'flex',
            gap: theme.spacing(2),
            padding: '12px 14px',

            '& svg': {
                flexShrink: 0
            }
        },
        tipBody: {
            alignItems: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        title: {
            ...theme.typography.heading5,
            color: theme.palette.dialogText,
            margin: 0
        },
        waveform: {
            alignItems: 'center',
            display: 'flex',
            height: '40px',
            justifyContent: 'space-between'
        },
        waveformBar: {
            backgroundColor: alpha(theme.palette.action01, 0.7),
            borderRadius: '2px',
            width: '6px'
        }
    };
});

/**
 * Records a few seconds from the microphone and plays them back on the speakers, so that the user hears what the others
 * will hear.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const AudioTest = ({
    inline = false,
    isDisplayedOnWelcomePage = false,
    micId: initialMicId,
    speakerId: initialSpeakerId
}: IProps) => {
    const { classes, cx, theme } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const store = useStore<IReduxState>();

    // The inline test and a dialog can show at the same time.
    const [ id ] = useState(() => uniqueId('audio-test-'));
    const availableDevices = useSelector((state: IReduxState) => state['features/base/devices'].availableDevices);
    const { audioInput = [], audioOutput = [] } = availableDevices;
    const canSelectSpeaker = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output') && audioOutput.length > 0;
    const isUnmutedInMeeting = useSelector((state: IReduxState) => Boolean(state['features/base/conference'].conference)
        && !isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO));
    const noiseSuppressionEnabled = useSelector(isNoiseSuppressionEnabled);
    const [ issue, setIssue ] = useState<Issue>('silent');

    // Settings that may help, where the user can change them: in a meeting, and not while the extra noise suppression
    // disables the others.
    const settingsTips = useSelector((state: IReduxState) => {
        if (!state['features/base/conference'].conference || iAmVisitor(state) || isNoiseSuppressionEnabled(state)) {
            return [];
        }

        const isAdvanced = isAdvancedAudioSettingsEnabled(state);
        const audioSettings = state['features/settings'].audioSettings ?? getLocalJitsiAudioTrackSettings(state);

        switch (issue) {
        case 'echo':
            return [
                isAdvanced && !audioSettings?.echoCancellation && 'audioTest.settingsTip.echoCancellation',
                isButtonEnabled('noisesuppression', state) && 'audioTest.settingsTip.noiseSuppression'
            ].filter(Boolean) as string[];
        case 'quiet':
            return isAdvanced ? [ 'audioTest.settingsTip.autoGainControl' ] : [];
        default:
            return [];
        }
    }, shallowEqual);

    // The devices the user chose, in the audio settings or before, or else the OS defaults.
    const getStartDevices = () => {
        const state = store.getState();
        const { userSelectedAudioOutputDeviceId, userSelectedMicDeviceId } = state['features/base/settings'];

        return getAudioTestDevices(state['features/base/devices'].availableDevices, {
            micId: initialMicId ?? (userSelectedMicDeviceId && getUserSelectedMicDeviceId(state)),
            speakerId: initialSpeakerId ?? (userSelectedAudioOutputDeviceId && getUserSelectedOutputDeviceId(state))
        });
    };
    const [ micId, setMicId ] = useState(() => getStartDevices().micId);
    const [ playbackError, setPlaybackError ] = useState<string>();
    const [ playbackTime, setPlaybackTime ] = useState(0);
    const [ recording, setRecording ] = useState<{ duration: number; levels: number[]; url: string; }>();
    const [ recordingTime, setRecordingTime ] = useState(0);
    const [ speakerId, setSpeakerId ] = useState(() => getStartDevices().speakerId);

    // In the pre-join preview it first says why it shows, and opens the microphone only once the user goes on.
    const [ step, setStep ] = useState<Step>(inline ? 'intro' : 'choose');
    const [ track, setTrack ] = useState<any>(null);
    const [ trackAttempt, setTrackAttempt ] = useState(0);
    const [ trackError, setTrackError ] = useState<string>();
    const isIntro = step === 'intro';
    const audioRef = useRef<HTMLAudioElement>(null);
    const recorderRef = useRef<MediaRecorder>();
    const speakerName = useSelector((state: IReduxState) => {
        const deviceId = speakerId === 'default' ? getDefaultDeviceId(state, 'audioOutput') ?? speakerId : speakerId;

        return formatDeviceLabel(getDeviceLabelById(state, deviceId ?? '', 'audioOutput') ?? '');
    });
    const micLabel = audioInput.find(({ deviceId }) => deviceId === micId)?.label;
    const speakerLabel = audioOutput.find(({ deviceId }) => deviceId === speakerId)?.label;

    // A recording that was cut short by losing the microphone is dropped.
    const restartTrack = useCallback(() => {
        setStep(current => (current === 'record' ? 'choose' : current));
        setTrackAttempt(attempt => attempt + 1);
    }, []);

    // The devices may be listed only after the test shows, e.g. on the pre-join screen, or go away while it shows.
    useEffect(() => {
        const defaults = getStartDevices();

        if (!audioInput.some(({ deviceId }) => deviceId === micId)) {
            setMicId(defaults.micId);
            setStep(current => (current === 'record' ? 'choose' : current));
        }
        audioOutput.some(({ deviceId }) => deviceId === speakerId) || setSpeakerId(defaults.speakerId);
    }, [ availableDevices ]);

    useEffect(() => {
        if (isIntro) {
            return;
        }

        const state = store.getState();
        let created: any;
        let replaced = false;

        setTrack(null);
        setTrackError(undefined);

        // The same audio processing as the meeting's microphone, but not its noise suppression: the effect shares an
        // audio context with the meeting's microphone, and stopping it here would stop that one too.
        createLocalTrack('audio', micId ?? null, TRACK_TIMEOUT, isAdvancedAudioSettingsEnabled(state) ? {
            constraints: { audio: state['features/settings'].audioSettings ?? getLocalJitsiAudioTrackSettings(state) }
        } : undefined)
            .then((jitsiTrack: any) => {
                if (replaced) {
                    jitsiTrack.dispose();

                    return;
                }
                created = jitsiTrack;

                // E.g. the device was unplugged.
                jitsiTrack.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED, restartTrack);
                setTrack(jitsiTrack);
            })
            .catch((error: any) => {
                logger.warn('Failed to create the audio test track', error);
                replaced || setTrackError(MIC_ERRORS[error?.name] ?? 'dialog.micUnknownError');
            });

        return () => {
            replaced = true;
            created?.off(JitsiTrackEvents.LOCAL_TRACK_STOPPED, restartTrack);
            created?.dispose();
        };
    }, [ isIntro, micId, trackAttempt ]);

    useEffect(() => {
        if (step !== 'record' || !track) {
            return;
        }

        let recorder: MediaRecorder;

        try {
            recorder = new MediaRecorder(track.getOriginalStream());
            recorder.start();
        } catch (error) {
            // E.g. the microphone stopped after its track was created.
            logger.warn('Failed to start recording the audio test', error);
            restartTrack();

            return;
        }

        const chunks: Blob[] = [];
        const levels: number[] = [];
        const startedAt = Date.now();
        let level = 0;
        const onLevel = (value: number) => {
            level = value;
        };
        const timer = window.setInterval(() => {
            const time = Date.now() - startedAt;

            levels.push(level);
            setRecordingTime(time);
            time >= RECORDING_DURATION && recorder.state === 'recording' && recorder.stop();
        }, SAMPLE_INTERVAL);

        recorder.ondataavailable = ({ data }) => chunks.push(data);
        recorder.onstop = () => {
            // The microphone stopped, so the recording was cut short.
            if (!track.getOriginalStream().active) {
                setStep('choose');

                return;
            }
            setRecording({
                duration: (Date.now() - startedAt) / 1000,
                levels,
                url: URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }))
            });
            setStep('listen');
        };
        track.on(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, onLevel);
        recorderRef.current = recorder;

        return () => {
            window.clearInterval(timer);
            track.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, onLevel);
            recorderRef.current = undefined;

            // Closing the dialog drops the recording.
            if (recorder.state !== 'inactive') {
                recorder.onstop = null;
                recorder.stop();
            }
        };
    }, [ step, track ]);

    useEffect(() => () => {
        recording && URL.revokeObjectURL(recording.url);
    }, [ recording ]);

    // Leaving the last step without pressing Done, e.g. by joining from the pre-join screen, finishes the test too.
    useEffect(() => () => {
        step === 'done' && dispatch(updateSettings({ audioTestDone: true }));
    }, [ step ]);

    const play = useCallback(async () => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }
        audio.currentTime = 0;
        setPlaybackError(undefined);
        setPlaybackTime(0);

        if (canSelectSpeaker && speakerId) {
            try {
                await audio.setSinkId(speakerId);
            } catch (error) {
                logger.warn('Failed to play the audio test recording on the chosen speakers', error);
                setPlaybackError('audioTest.speakersError');
                await audio.setSinkId('').catch(() => undefined);
            }
        }

        try {
            await audio.play();
        } catch (error) {
            // E.g. the browser blocks playing without a click, which Replay is.
            logger.warn('Failed to play the audio test recording', error);
            setPlaybackError('audioTest.playbackError');
        }
    }, [ canSelectSpeaker, speakerId ]);

    useEffect(() => {
        step === 'listen' && play();
    }, [ recording, step ]);

    // Applied as soon as the user is happy with them, so that the meeting uses them even if the user then joins, or
    // closes the test, without pressing Done.
    const acceptDevices = useCallback(() => {
        dispatch(submitAudioTestDevices(micId, canSelectSpeaker ? speakerId : undefined, isDisplayedOnWelcomePage));
        setStep('done');
    }, [ canSelectSpeaker, isDisplayedOnWelcomePage, micId, speakerId ]);

    // Finished or skipped, so that the pre-join screen doesn't offer it again. Opened from the settings, it goes back
    // to them.
    const close = useCallback(() => {
        dispatch(updateSettings({ audioTestDone: true }));
        inline || dispatch(openSettingsDialog(SETTINGS_TABS.AUDIO, isDisplayedOnWelcomePage));
    }, [ inline, isDisplayedOnWelcomePage ]);
    const finish = useCallback(() => {
        dispatch(updateSettings({ audioTestDone: true }));
        if (!inline) {
            dispatch(hideDialog());
            dispatch(openAudioSettingsWhenApplied(micId, canSelectSpeaker ? speakerId : undefined,
                isDisplayedOnWelcomePage));
        }
    }, [ canSelectSpeaker, inline, isDisplayedOnWelcomePage, micId, speakerId ]);

    // The user may have changed the devices while the intro showed, e.g. on the pre-join screen.
    const leaveIntro = useCallback(() => {
        const devices = getStartDevices();

        setMicId(devices.micId);
        setSpeakerId(devices.speakerId);
        setStep('choose');
    }, []);
    const onIssueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setIssue(e.target.value as Issue), []);
    const onMicChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => setMicId(e.target.value), []);
    const onPlaybackEnded = useCallback(() => setPlaybackTime(recording?.duration ?? 0), [ recording ]);
    const onPlaybackError = useCallback(() => setPlaybackError('audioTest.playbackError'), []);
    const onSpeakerChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => setSpeakerId(e.target.value), []);
    const onTimeUpdate = useCallback(() => setPlaybackTime(audioRef.current?.currentTime ?? 0), []);
    const retryTrack = useCallback(() => setTrackAttempt(attempt => attempt + 1), []);
    const showTroubleshoot = useCallback(() => setStep('troubleshoot'), []);
    const stop = useCallback(() => recorderRef.current?.stop(), []);

    // On the last step the devices are applied already, so closing the test there finishes it.
    const dismiss = step === 'done' ? finish : close;

    const start = useCallback(() => {
        setRecordingTime(0);
        setStep('record');
    }, []);

    const Heading = inline ? 'h2' : 'h1';

    // The ids of the dialogs, which the inline test leaves to them.
    const headingId = inline ? undefined : 'dialog-title';

    const renderHeading = (title: string, description: string) => (
        <div className = { classes.heading }>
            <Heading
                className = { classes.title }
                id = { headingId }>
                { title }
            </Heading>
            <p className = { classes.description }>{ description }</p>
        </div>
    );

    const renderHint = (icon: Function, text: string) => (
        <div className = { classes.hint }>
            <Icon
                color = { theme.palette.dialogSecondaryText }
                size = { 15 }
                src = { icon } />
            { text }
        </div>
    );

    const renderTip = (icon: Function, content: ReactNode) => (
        <div
            aria-live = 'polite'
            className = { classes.tip }>
            <Icon
                color = { theme.palette.dialogText }
                size = { 16 }
                src = { icon } />
            { content }
        </div>
    );

    const renderMeter = () => (
        <div
            aria-label = { t('audioTest.microphoneLevel') }
            role = 'img'>
            <AudioInputPreview
                sections = { METER_SECTIONS }
                track = { track } />
        </div>
    );

    const renderProgress = (value: number, labelKey: string) => (
        <div
            aria-label = { t(labelKey) }
            aria-valuemax = { 100 }
            aria-valuemin = { 0 }
            aria-valuenow = { Math.round(value * 100) }
            className = { classes.progress }
            role = 'progressbar'>
            <div
                className = { classes.progressFill }
                style = {{ width: `${Math.min(value, 1) * 100}%` }} />
        </div>
    );

    const selects = {
        mic: {
            devices: audioInput,
            icon: IconMic,
            labelKey: 'audioTest.microphone',
            onChange: onMicChange,
            value: micId
        },
        speakers: {
            devices: audioOutput,
            icon: IconVolumeUp,
            labelKey: 'audioTest.speakers',
            onChange: onSpeakerChange,
            value: speakerId
        }
    };

    const renderSelect = (kind: keyof typeof selects) => {
        const { devices, icon, labelKey, onChange, value } = selects[kind];

        return (
            <div className = { classes.field }>
                <label
                    className = { classes.fieldLabel }
                    htmlFor = { `${id}-${kind}` }>
                    <Icon
                        color = { theme.palette.dialogSecondaryText }
                        size = { 15 }
                        src = { icon } />
                    { t(labelKey) }
                </label>
                <Select
                    id = { `${id}-${kind}` }
                    onChange = { onChange }
                    options = { devices.map(({ deviceId, label }) => {
                        return {
                            label: label || deviceId,
                            value: deviceId
                        };
                    }) }
                    value = { value ?? '' } />
                { kind === 'mic' && trackError && renderTip(IconWarning, (
                    <div className = { classes.tipBody }>
                        { t(trackError) }
                        <Button
                            accessibilityLabel = { t('audioTest.retry') }
                            labelKey = 'audioTest.retry'
                            onClick = { retryTrack }
                            size = 'small'
                            type = { BUTTON_TYPES.SECONDARY } />
                    </div>
                )) }
                { kind === 'mic' && !trackError && step === 'choose' && renderMeter() }
            </div>
        );
    };

    const renderSelects = () => (
        <div className = { classes.fields }>
            { renderSelect('mic') }
            { canSelectSpeaker && renderSelect('speakers') }
            { step === 'choose' && renderHint(IconDeviceHeadphone, t('audioTest.headphonesHint')) }
            { isUnmutedInMeeting && renderHint(IconInfoCircle, t('audioTest.unmutedHint')) }
        </div>
    );

    const renderStatus = (icon: Function, title: string, description: string, circleClassName?: string) => (
        <div className = { classes.status }>
            <div className = { cx(classes.circle, circleClassName) }>
                <Icon
                    color = { circleClassName === classes.circleSuccess ? theme.palette.success01
                        : theme.palette.action01 }
                    size = { 32 }
                    src = { icon } />
            </div>
            <Heading
                className = { classes.title }
                id = { headingId }>
                { title }
            </Heading>
            <p className = { classes.description }>{ description }</p>
        </div>
    );

    const renderStep = (): ReactNode => {
        switch (step) {
        case 'choose':
            return (
                <>
                    { renderHeading(t('audioTest.chooseTitle'),
                        t(inline ? 'audioTest.chooseDescriptionPrejoin' : 'audioTest.chooseDescription')) }
                    { renderSelects() }
                    <div className = { classes.actions }>
                        <Button
                            accessibilityLabel = { t('audioTest.start') }
                            disabled = { !track }
                            fullWidth = { true }
                            icon = { IconMic }
                            labelKey = 'audioTest.start'
                            onClick = { start } />
                        <Button
                            accessibilityLabel = { t('audioTest.skip') }
                            fullWidth = { true }
                            labelKey = 'audioTest.skip'
                            onClick = { close }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </div>
                </>
            );
        case 'record':
            return (
                <>
                    { renderStatus(IconMic, t('audioTest.recordTitle'), t('audioTest.recordDescription'),
                        classes.pulse) }
                    { renderMeter() }
                    <div>
                        { renderProgress(recordingTime / RECORDING_DURATION, 'audioTest.recordingProgress') }
                        <div className = { classes.caption }>
                            <span>
                                <span className = { classes.dot } />
                                { t('audioTest.recording', { seconds: RECORDING_DURATION / 1000 }) }
                            </span>
                            <span className = { classes.captionDevice }>{ micLabel }</span>
                        </div>
                    </div>
                    <div className = { classes.actions }>
                        <Button
                            accessibilityLabel = { t('audioTest.stop') }
                            fullWidth = { true }
                            labelKey = 'audioTest.stop'
                            onClick = { stop }
                            type = { BUTTON_TYPES.SECONDARY } />
                    </div>
                </>
            );
        case 'intro':
            return (
                <>
                    { renderStatus(IconMic, t('audioTest.introTitle'), t('audioTest.introDescription')) }
                    <div className = { classes.actions }>
                        <Button
                            accessibilityLabel = { t('audioTest.introStart') }
                            fullWidth = { true }
                            labelKey = 'audioTest.introStart'
                            onClick = { leaveIntro } />
                        <Button
                            accessibilityLabel = { t('audioTest.skip') }
                            fullWidth = { true }
                            labelKey = 'audioTest.skip'
                            onClick = { close }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </div>
                    <p className = { classes.introHint }>{ t('audioTest.introHint') }</p>
                </>
            );
        case 'listen': {
            const levels = recording?.levels ?? [];
            const peak = Math.max(0, ...levels);

            return (
                <>
                    { renderStatus(IconVolumeUp, t('audioTest.listenTitle'), canSelectSpeaker
                        ? t('audioTest.listenDescription', { speaker: speakerName })
                        : t('audioTest.listenDescriptionDefault')) }
                    <div
                        aria-label = { t('audioTest.waveform') }
                        className = { classes.waveform }
                        role = 'img'>
                        { levels.map((level, index) => (
                            <div
                                className = { classes.waveformBar }
                                key = { index }
                                style = {{ height: `${4 + (peak ? level / peak : 0) * 36}px` }} />
                        )) }
                    </div>
                    <div className = { classes.playback }>
                        { renderProgress(recording ? playbackTime / recording.duration : 0, 'audioTest.playbackProgress') }
                        <Button
                            accessibilityLabel = { t('audioTest.replay') }
                            icon = { IconReplay }
                            labelKey = 'audioTest.replay'
                            onClick = { play }
                            size = 'small'
                            type = { BUTTON_TYPES.TERTIARY } />
                    </div>
                    { playbackError && renderTip(IconWarning, t(playbackError)) }
                    { noiseSuppressionEnabled && renderHint(IconInfoCircle, t('audioTest.noiseSuppressionHint')) }
                    <audio
                        onEnded = { onPlaybackEnded }
                        onError = { onPlaybackError }
                        onTimeUpdate = { onTimeUpdate }
                        ref = { audioRef }
                        src = { recording?.url } />
                    <div className = { classes.actions }>
                        <p className = { classes.question }>{ t('audioTest.heardQuestion') }</p>
                        <Button
                            accessibilityLabel = { t('audioTest.yes') }
                            fullWidth = { true }
                            labelKey = 'audioTest.yes'
                            onClick = { acceptDevices } />
                        <Button
                            accessibilityLabel = { t('audioTest.no') }
                            fullWidth = { true }
                            labelKey = 'audioTest.no'
                            onClick = { showTroubleshoot }
                            type = { BUTTON_TYPES.SECONDARY } />
                    </div>
                </>
            );
        }
        case 'done':
            return (
                <>
                    { renderStatus(IconCheck, t('audioTest.doneTitle'), t('audioTest.doneDescription'),
                        classes.circleSuccess) }
                    <div className = { classes.summary }>
                        { [
                            { icon: IconMic, kind: 'mic', label: micLabel },
                            { icon: IconVolumeUp, kind: 'speakers', label: canSelectSpeaker ? speakerLabel : undefined }
                        ].filter(({ label }) => label)
                            .map(({ icon, kind, label }) => (
                                <div
                                    className = { classes.summaryRow }
                                    key = { kind }>
                                    <Icon
                                        color = { theme.palette.dialogSecondaryText }
                                        size = { 15 }
                                        src = { icon } />
                                    <span>{ label }</span>
                                    <Icon
                                        color = { theme.palette.success01 }
                                        size = { 15 }
                                        src = { IconCheck } />
                                </div>
                            )) }
                    </div>
                    <div className = { classes.actions }>
                        <Button
                            accessibilityLabel = { t('audioTest.done') }
                            fullWidth = { true }
                            labelKey = 'audioTest.done'
                            onClick = { finish } />
                    </div>
                </>
            );
        case 'troubleshoot':
            return (
                <>
                    { renderHeading(t('audioTest.troubleshootTitle'), t('audioTest.troubleshootDescription')) }
                    <fieldset
                        aria-label = { t('audioTest.troubleshootDescription') }
                        className = { classes.issues }>
                        { ISSUES.map(value => (
                            <label
                                className = { cx(classes.issue, issue === value && classes.issueSelected) }
                                key = { value }>
                                <input
                                    checked = { issue === value }
                                    name = { `${id}-issue` }
                                    onChange = { onIssueChange }
                                    type = 'radio'
                                    value = { value } />
                                { t(`audioTest.issue.${value}`) }
                            </label>
                        )) }
                    </fieldset>
                    { renderTip(IconInfoCircle, (
                        <div className = { classes.tipBody }>
                            { t(`audioTest.tip.${issue}`) }
                            { settingsTips.map(key => <span key = { key }>{ t(key) }</span>) }
                        </div>
                    )) }
                    { renderSelects() }
                    <div className = { classes.actions }>
                        <Button
                            accessibilityLabel = { t('audioTest.testAgain') }
                            disabled = { !track }
                            fullWidth = { true }
                            icon = { IconReplay }
                            labelKey = 'audioTest.testAgain'
                            onClick = { start } />
                        <Button
                            accessibilityLabel = { t('audioTest.useAnyway') }
                            fullWidth = { true }
                            labelKey = 'audioTest.useAnyway'
                            onClick = { acceptDevices }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </div>
                </>
            );
        }
    };

    const stepIndex = STEPS.indexOf(step);
    const content = (
        <div className = { classes.content }>
            <div className = { classes.header }>
                { stepIndex >= 0 ? (
                    <div className = { classes.heading }>
                        <div className = { classes.bars }>
                            { STEPS.map((name, index) => (
                                <div
                                    className = { cx(classes.bar, index <= stepIndex && classes.barDone) }
                                    key = { name } />
                            )) }
                        </div>
                        <span className = { classes.headerLabel }>
                            { t('audioTest.step', {
                                name: t(`audioTest.${step}Step`),
                                step: stepIndex + 1
                            }) }
                        </span>
                    </div>
                ) : (
                    <span className = { classes.headerLabel }>
                        { t(step === 'done' ? 'audioTest.doneHeader' : 'audioTest.header') }
                    </span>
                ) }
                <ClickableIcon
                    accessibilityLabel = { t('dialog.accessibilityLabel.close') }
                    icon = { IconCloseLarge }
                    id = { inline ? undefined : 'modal-header-close-button' }
                    onClick = { dismiss } />
            </div>
            { renderStep() }
        </div>
    );
    const title = t(`audioTest.${step}Title`);

    if (inline) {
        return (
            <div className = { classes.inline }>
                <section
                    aria-label = { title }
                    className = { classes.inlineCard }>
                    { content }
                </section>
            </div>
        );
    }

    return (
        <BaseDialog
            onClose = { dismiss }
            title = { title }>
            { content }
        </BaseDialog>
    );
};

export default AudioTest;
