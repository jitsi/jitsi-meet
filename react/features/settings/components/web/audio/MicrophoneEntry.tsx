import clsx from 'clsx';
import React, { Component } from 'react';

import Icon from '../../../../base/icons/components/Icon';
import { IconCheck, IconExclamationSolid } from '../../../../base/icons/svg';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import JitsiMeetJS from '../../../../base/lib-jitsi-meet/_';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import { TEXT_OVERFLOW_TYPES } from '../../../../base/ui/constants.any';

import Meter from './Meter';

const JitsiTrackEvents = JitsiMeetJS.events.track;

interface IProps {

    /**
     * The text for this component.
     */
    children: string;

    /**
     * The deviceId of the microphone.
     */
    deviceId: string;

    /**
     * Flag indicating if there is a problem with the device.
     */
    hasError?: boolean;

    /**
     * Flag indicating if there is a problem with the device.
     */
    index?: number;

    /**
     * Flag indicating the selection state.
     */
    isSelected: boolean;

    /**
     * The audio track for the current entry.
     */
    jitsiTrack: any;

    /**
     * The id for the label, that contains the item text.
     */
    labelId?: string;

    /**
     * The length of the microphone list.
     */
    length: number;


    listHeaderId: string;

    /**
    * Used to decide whether to listen to audio level changes.
    */
    measureAudioLevels: boolean;

    /**
     * Click handler for component.
     */
    onClick: Function;
}

interface IState {

    /**
     * The audio level.
     */
    level: number;
}

/**
 * React {@code Component} representing an entry for the microphone audio settings.
 *
 * @param {IProps} props - The props of the component.
 * @returns { ReactElement}
 */
export default class MicrophoneEntry extends Component<IProps, IState> {
    /**
     * Initializes a new {@code MicrophoneEntry} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            level: -1
        };
        this._onClick = this._onClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._updateLevel = this._updateLevel.bind(this);
    }

    /**
     * Click handler for the entry.
     *
     * @returns {void}
     */
    _onClick() {
        this.props.onClick(this.props.deviceId);
    }

    /**
     * Key pressed handler for the entry.
     *
     * @param {Object} e - The event.
     * @private
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ') {
            e.preventDefault();
            this.props.onClick(this.props.deviceId);
        }
    }

    /**
     * Updates the level of the meter.
     *
     * @param {number} num - The audio level provided by the jitsiTrack.
     * @returns {void}
     */
    _updateLevel(num: number) {
        this.setState({
            level: Math.floor(num / 0.125)
        });
    }

    /**
     * Subscribes to audio level changes coming from the jitsiTrack.
     *
     * @returns {void}
     */
    _startListening() {
        const { jitsiTrack, measureAudioLevels } = this.props;

        jitsiTrack && measureAudioLevels && jitsiTrack.on(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            this._updateLevel);
    }

    /**
     * Unsubscribes from changes coming from the jitsiTrack.
     *
     * @param {Object} jitsiTrack - The jitsiTrack to unsubscribe from.
     * @returns {void}
     */
    _stopListening(jitsiTrack?: any) {
        jitsiTrack?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, this._updateLevel);
        this.setState({
            level: -1
        });
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps) {
        if (prevProps.jitsiTrack !== this.props.jitsiTrack) {
            this._stopListening(prevProps.jitsiTrack);
            this._startListening();
        }
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._startListening();
    }

    /**
     * Implements React's {@link Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._stopListening(this.props.jitsiTrack);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            deviceId,
            children,
            hasError,
            index,
            isSelected,
            length,
            jitsiTrack,
            listHeaderId,
            measureAudioLevels
        } = this.props;

        const deviceTextId = `choose_microphone${deviceId}`;

        const labelledby = `${listHeaderId} ${deviceTextId} `;

        const className = `audio-preview-microphone ${measureAudioLevels
            ? 'audio-preview-microphone--withmeter' : 'audio-preview-microphone--nometer'}`;

        return (
            <li
                aria-checked = { isSelected }
                aria-labelledby = { labelledby }
                aria-posinset = { index }
                aria-setsize = { length }
                className = { className }
                onClick = { this._onClick }
                onKeyPress = { this._onKeyPress }
                role = 'radio'
                tabIndex = { 0 }>
                <ContextMenuItem
                    accessibilityLabel = ''
                    icon = { isSelected ? IconCheck : undefined }
                    overflowType = { TEXT_OVERFLOW_TYPES.SCROLL_ON_HOVER }
                    selected = { isSelected }
                    text = { children }
                    textClassName = { clsx('audio-preview-entry-text', !isSelected && 'left-margin') }>
                    {hasError && <Icon
                        className = 'audio-preview-icon audio-preview-icon--exclamation'
                        size = { 16 }
                        src = { IconExclamationSolid } />}
                </ContextMenuItem>
                { Boolean(jitsiTrack) && measureAudioLevels && <Meter
                    className = 'audio-preview-meter-mic'
                    isDisabled = { hasError }
                    level = { this.state.level } />
                }
            </li>
        );
    }
}
