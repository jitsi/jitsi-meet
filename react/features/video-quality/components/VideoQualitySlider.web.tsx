import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState, IStore } from '../../app/types';
import { setAudioOnly } from '../../base/audio-only/actions';
import { translate } from '../../base/i18n/functions';
import { setLastN } from '../../base/lastn/actions';
import { getLastNForQualityLevel } from '../../base/lastn/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { setPreferredVideoQuality } from '../actions';
import { DEFAULT_LAST_N, VIDEO_QUALITY_LEVELS } from '../constants';
import logger from '../logger';

import Slider from './Slider.web';

const {
    ULTRA,
    HIGH,
    STANDARD,
    LOW
} = VIDEO_QUALITY_LEVELS;

/**
 * Creates an analytics event for a press of one of the buttons in the video
 * quality dialog.
 *
 * @param {string} quality - The quality which was selected.
 * @returns {Object} The event in a format suitable for sending via
 *      sendAnalytics.
 */
const createEvent = function(quality: string) {
    return createToolbarEvent(
        'video.quality',
        {
            quality
        });
};

/**
 * The type of the React {@code Component} props of {@link VideoQualitySlider}.
 */
interface IProps extends WithTranslation {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: Boolean;

    /**
     * The channelLastN value configured for the conference.
     */
    _channelLastN?: number;

    /**
     * Whether or not the conference is in peer to peer mode.
     */
    _p2p?: Object;

    /**
     * The currently configured maximum quality resolution to be sent and
     * received from the remote participants.
     */
    _sendrecvVideoQuality: number;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * Invoked to request toggling of audio only mode.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: Theme) => {
    return {
        dialog: {
            color: theme.palette.text01
        },
        dialogDetails: {
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),
            marginBottom: 16
        },
        dialogContents: {
            background: theme.palette.ui01,
            padding: '16px 16px 48px 16px'
        },
        sliderDescription: {
            ...withPixelLineHeight(theme.typography.heading6),

            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 40
        }
    };
};


/**
 * Implements a React {@link Component} which displays a slider for selecting a
 * new receive video quality.
 *
 * @augments Component
 */
class VideoQualitySlider extends Component<IProps> {
    _sliderOptions: Array<{
        audioOnly?: boolean;
        onSelect: Function;
        textKey: string;
        videoQuality?: number;
    }>;

    /**
     * Initializes a new {@code VideoQualitySlider} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._enableAudioOnly = this._enableAudioOnly.bind(this);
        this._enableHighDefinition = this._enableHighDefinition.bind(this);
        this._enableLowDefinition = this._enableLowDefinition.bind(this);
        this._enableStandardDefinition
            = this._enableStandardDefinition.bind(this);
        this._enableUltraHighDefinition = this._enableUltraHighDefinition.bind(this);
        this._onSliderChange = this._onSliderChange.bind(this);

        /**
         * An array of configuration options for displaying a choice in the
         * input. The onSelect callback will be invoked when the option is
         * selected and videoQuality helps determine which choice matches with
         * the currently active quality level.
         *
         * @private
         * @type {Object[]}
         */
        this._sliderOptions = [
            {
                audioOnly: true,
                onSelect: this._enableAudioOnly,
                textKey: 'audioOnly.audioOnly'
            },
            {
                onSelect: this._enableLowDefinition,
                textKey: 'videoStatus.lowDefinition',
                videoQuality: LOW
            },
            {
                onSelect: this._enableStandardDefinition,
                textKey: 'videoStatus.standardDefinition',
                videoQuality: STANDARD
            },
            {
                onSelect: this._enableUltraHighDefinition,
                textKey: 'videoStatus.highDefinition',
                videoQuality: ULTRA
            }
        ];
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { classes, t } = this.props;
        const activeSliderOption = this._mapCurrentQualityToSliderValue();

        return (
            <div className = { clsx('video-quality-dialog', classes.dialog) }>
                <div
                    aria-hidden = { true }
                    className = { classes.dialogDetails }>
                    {t('videoStatus.adjustFor')}
                </div>
                <div className = { classes.dialogContents }>
                    <div
                        aria-hidden = { true }
                        className = { classes.sliderDescription }>
                        <span>{t('videoStatus.bestPerformance')}</span>
                        <span>{t('videoStatus.highestQuality')}</span>
                    </div>
                    <Slider
                        ariaLabel = { t('videoStatus.callQuality') }
                        max = { this._sliderOptions.length - 1 }
                        min = { 0 }
                        onChange = { this._onSliderChange }
                        step = { 1 }
                        value = { activeSliderOption } />
                </div>
            </div>
        );
    }

    /**
     * Dispatches an action to enable audio only mode.
     *
     * @private
     * @returns {void}
     */
    _enableAudioOnly() {
        sendAnalytics(createEvent('audio.only'));
        logger.log('Video quality: audio only enabled');
        this.props.dispatch(setAudioOnly(true));
    }

    /**
     * Handles the action of the high definition video being selected.
     * Dispatches an action to receive high quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableHighDefinition() {
        sendAnalytics(createEvent('high'));
        logger.log('Video quality: high enabled');
        this._setPreferredVideoQuality(HIGH);
    }

    /**
     * Dispatches an action to receive low quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableLowDefinition() {
        sendAnalytics(createEvent('low'));
        logger.log('Video quality: low enabled');
        this._setPreferredVideoQuality(LOW);
    }

    /**
     * Dispatches an action to receive standard quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableStandardDefinition() {
        sendAnalytics(createEvent('standard'));
        logger.log('Video quality: standard enabled');
        this._setPreferredVideoQuality(STANDARD);
    }

    /**
     * Dispatches an action to receive ultra HD quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableUltraHighDefinition() {
        sendAnalytics(createEvent('ultra high'));
        logger.log('Video quality: ultra high enabled');
        this._setPreferredVideoQuality(ULTRA);
    }

    /**
     * Matches the current video quality state with corresponding index of the
     * component's slider options.
     *
     * @private
     * @returns {void}
     */
    _mapCurrentQualityToSliderValue() {
        const { _audioOnly, _sendrecvVideoQuality } = this.props;
        const { _sliderOptions } = this;

        if (_audioOnly) {
            const audioOnlyOption = _sliderOptions.find(
                ({ audioOnly }) => audioOnly);

            // @ts-ignore
            return _sliderOptions.indexOf(audioOnlyOption);
        }

        for (let i = 0; i < _sliderOptions.length; i++) {
            if (Number(_sliderOptions[i].videoQuality) >= _sendrecvVideoQuality) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Invokes a callback when the selected video quality changes.
     *
     * @param {Object} event - The slider's change event.
     * @private
     * @returns {void}
     */
    _onSliderChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { _audioOnly, _sendrecvVideoQuality } = this.props;
        const {
            // @ts-ignore
            audioOnly,

            // @ts-ignore
            onSelect,

            // @ts-ignore
            videoQuality
        } = this._sliderOptions[event.target.value as keyof typeof this._sliderOptions];

        // Take no action if the newly chosen option does not change audio only
        // or video quality state.
        if ((_audioOnly && audioOnly)
            || (!_audioOnly && videoQuality === _sendrecvVideoQuality)) {
            return;
        }

        onSelect();
    }

    /**
     * Helper for changing the preferred maximum video quality to receive and
     * disable audio only.
     *
     * @param {number} qualityLevel - The new maximum video quality. Should be
     * a value enumerated in {@code VIDEO_QUALITY_LEVELS}.
     * @private
     * @returns {void}
     */
    _setPreferredVideoQuality(qualityLevel: number) {
        this.props.dispatch(setPreferredVideoQuality(qualityLevel));
        if (this.props._audioOnly) {
            this.props.dispatch(setAudioOnly(false));
        }

        // Determine the lastN value based on the quality setting.
        let { _channelLastN = DEFAULT_LAST_N } = this.props;

        _channelLastN = _channelLastN === -1 ? DEFAULT_LAST_N : _channelLastN;
        const lastN = getLastNForQualityLevel(qualityLevel, _channelLastN);

        // Set the lastN for the conference.
        this.props.dispatch(setLastN(lastN));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VideoQualitySlider} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const { p2p } = state['features/base/conference'];
    const { preferredVideoQuality } = state['features/video-quality'];
    const { channelLastN } = state['features/base/config'];

    return {
        _audioOnly: audioOnly,
        _channelLastN: channelLastN,
        _p2p: p2p,
        _sendrecvVideoQuality: preferredVideoQuality
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(VideoQualitySlider)));
