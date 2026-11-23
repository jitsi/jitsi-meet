import { alpha } from '@mui/material/styles';
import React, { ChangeEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
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
    IconVolumeUp
} from '../../base/icons/svg';
import JitsiMeetJS from '../../base/lib-jitsi-meet';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions.web';
import { updateSettings } from '../../base/settings/actions';
import BaseDialog from '../../base/ui/components/web/BaseDialog';
import Button from '../../base/ui/components/web/Button';
import ClickableIcon from '../../base/ui/components/web/ClickableIcon';
import Select from '../../base/ui/components/web/Select';
import { BUTTON_TYPES } from '../../base/ui/constants.web';
import { submitAudioTestDevices } from '../actions.web';
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
}

type Issue = 'echo' | 'quiet' | 'silent';

type Step = 'choose' | 'done' | 'intro' | 'listen' | 'record' | 'troubleshoot';

const ISSUES: Issue[] = [ 'silent', 'quiet', 'echo' ];

const METER_SECTIONS = 16;

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
const AudioTest = ({ inline = false, isDisplayedOnWelcomePage = false }: IProps) => {
    const { classes, cx, theme } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const availableDevices = useSelector((state: IReduxState) => state['features/base/devices'].availableDevices);
    const { audioInput = [], audioOutput = [] } = availableDevices;
    const canSelectSpeaker = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output') && audioOutput.length > 0;
    const [ issue, setIssue ] = useState<Issue>('silent');
    const [ micId, setMicId ] = useState(() => getAudioTestDevices(availableDevices).micId);
    const [ playbackTime, setPlaybackTime ] = useState(0);
    const [ recording, setRecording ] = useState<{ duration: number; levels: number[]; url: string; }>();
    const [ recordingTime, setRecordingTime ] = useState(0);
    const [ speakerId, setSpeakerId ] = useState(() => getAudioTestDevices(availableDevices).speakerId);
    // In the pre-join preview it first says why it shows, and opens the microphone only once the user goes on.
    const [ step, setStep ] = useState<Step>(inline ? 'intro' : 'choose');
    const [ track, setTrack ] = useState<any>(null);
    const isIntro = step === 'intro';
    const audioRef = useRef<HTMLAudioElement>(null);
    const recorderRef = useRef<MediaRecorder>();
    const speakerName = useSelector((state: IReduxState) => {
        const id = speakerId === 'default' ? getDefaultDeviceId(state, 'audioOutput') ?? speakerId : speakerId;

        return formatDeviceLabel(getDeviceLabelById(state, id ?? '', 'audioOutput') ?? '');
    });
    const micLabel = audioInput.find(({ deviceId }) => deviceId === micId)?.label;
    const speakerLabel = audioOutput.find(({ deviceId }) => deviceId === speakerId)?.label;

    // The devices may be listed only after the test shows, e.g. on the pre-join screen, or go away while it shows.
    useEffect(() => {
        const defaults = getAudioTestDevices(availableDevices);

        audioInput.some(({ deviceId }) => deviceId === micId) || setMicId(defaults.micId);
        audioOutput.some(({ deviceId }) => deviceId === speakerId) || setSpeakerId(defaults.speakerId);
    }, [ availableDevices ]);

    useEffect(() => {
        if (isIntro) {
            return;
        }

        let created: any;
        let replaced = false;

        setTrack(null);
        createLocalTrack('audio', micId ?? null, TRACK_TIMEOUT)
            .then((jitsiTrack: any) => {
                if (replaced) {
                    jitsiTrack.dispose();

                    return;
                }
                created = jitsiTrack;
                setTrack(jitsiTrack);
            })
            .catch((error: Error) => logger.warn('Failed to create the audio test track', error));

        return () => {
            replaced = true;
            created?.dispose();
        };
    }, [ isIntro, micId ]);

    useEffect(() => {
        if (step !== 'record' || !track) {
            return;
        }

        const recorder = new MediaRecorder(track.getOriginalStream());
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
            setRecording({
                duration: (Date.now() - startedAt) / 1000,
                levels,
                url: URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }))
            });
            setStep('listen');
        };
        track.on(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, onLevel);
        recorder.start();
        recorderRef.current = recorder;

        return () => {
            window.clearInterval(timer);
            track.off(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, onLevel);
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

    const play = useCallback(async () => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }
        audio.currentTime = 0;
        setPlaybackTime(0);

        try {
            canSelectSpeaker && speakerId && await audio.setSinkId(speakerId);
            await audio.play();
        } catch (error) {
            // E.g. the browser blocks playing without a click, which Replay is.
            logger.warn('Failed to play the audio test recording', error);
        }
    }, [ canSelectSpeaker, speakerId ]);

    useEffect(() => {
        step === 'listen' && play();
    }, [ recording, step ]);

    // Finished or skipped, so that the pre-join screen doesn't offer it again.
    const close = useCallback(() => {
        dispatch(updateSettings({ audioTestDone: true }));
        inline || dispatch(hideDialog());
    }, [ inline ]);
    const onIssueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setIssue(e.target.value as Issue), []);
    const onMicChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => setMicId(e.target.value), []);
    const onPlaybackEnded = useCallback(() => setPlaybackTime(recording?.duration ?? 0), [ recording ]);
    const onSpeakerChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => setSpeakerId(e.target.value), []);
    const onTimeUpdate = useCallback(() => setPlaybackTime(audioRef.current?.currentTime ?? 0), []);
    const showChoose = useCallback(() => setStep('choose'), []);
    const showDone = useCallback(() => setStep('done'), []);
    const showTroubleshoot = useCallback(() => setStep('troubleshoot'), []);
    const stop = useCallback(() => recorderRef.current?.stop(), []);

    const save = useCallback(() => {
        close();
        dispatch(submitAudioTestDevices(micId, canSelectSpeaker ? speakerId : undefined, isDisplayedOnWelcomePage));
    }, [ canSelectSpeaker, isDisplayedOnWelcomePage, micId, speakerId ]);

    const start = useCallback(() => {
        setRecordingTime(0);
        setStep('record');
    }, []);

    const Heading = inline ? 'h2' : 'h1';

    const renderHeading = (title: string, description: string) => (
        <div className = { classes.heading }>
            <Heading
                className = { classes.title }
                id = 'dialog-title'>
                { title }
            </Heading>
            <p className = { classes.description }>{ description }</p>
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
                    htmlFor = { `audio-test-${kind}` }>
                    <Icon
                        color = { theme.palette.dialogSecondaryText }
                        size = { 15 }
                        src = { icon } />
                    { t(labelKey) }
                </label>
                <Select
                    id = { `audio-test-${kind}` }
                    onChange = { onChange }
                    options = { devices.map(({ deviceId, label }) => {
                        return {
                            label: label || deviceId,
                            value: deviceId
                        };
                    }) }
                    value = { value ?? '' } />
                { kind === 'mic' && step === 'choose' && renderMeter() }
            </div>
        );
    };

    const renderSelects = () => (
        <div className = { classes.fields }>
            { renderSelect('mic') }
            { canSelectSpeaker && renderSelect('speakers') }
            { step === 'choose' && (
                <div className = { classes.hint }>
                    <Icon
                        color = { theme.palette.dialogSecondaryText }
                        size = { 15 }
                        src = { IconDeviceHeadphone } />
                    { t('audioTest.headphonesHint') }
                </div>
            ) }
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
                id = 'dialog-title'>
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
                            onClick = { showChoose } />
                        <Button
                            accessibilityLabel = { t('audioTest.notNow') }
                            fullWidth = { true }
                            labelKey = 'audioTest.notNow'
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
                    <audio
                        onEnded = { onPlaybackEnded }
                        onTimeUpdate = { onTimeUpdate }
                        ref = { audioRef }
                        src = { recording?.url } />
                    <div className = { classes.actions }>
                        <p className = { classes.question }>{ t('audioTest.heardQuestion') }</p>
                        <Button
                            accessibilityLabel = { t('audioTest.yes') }
                            fullWidth = { true }
                            labelKey = 'audioTest.yes'
                            onClick = { showDone } />
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
                            onClick = { save } />
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
                                    name = 'audio-test-issue'
                                    onChange = { onIssueChange }
                                    type = 'radio'
                                    value = { value } />
                                { t(`audioTest.issue.${value}`) }
                            </label>
                        )) }
                    </fieldset>
                    <div
                        aria-live = 'polite'
                        className = { classes.tip }>
                        <Icon
                            color = { theme.palette.dialogText }
                            size = { 16 }
                            src = { IconInfoCircle } />
                        { t(`audioTest.tip.${issue}`) }
                    </div>
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
                            onClick = { showDone }
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
                    id = 'modal-header-close-button'
                    onClick = { close } />
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
            onClose = { close }
            title = { title }>
            { content }
        </BaseDialog>
    );
};

export default AudioTest;
