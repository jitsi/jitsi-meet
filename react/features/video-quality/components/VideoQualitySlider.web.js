// @flow

import InlineMessage from '@atlaskit/inline-message';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { setAudioOnly } from '../../base/audio-only';
import { VIDEO_QUALITY_LEVELS, setPreferredVideoQuality } from '../../base/conference';
import { translate } from '../../base/i18n';
import JitsiMeetJS from '../../base/lib-jitsi-meet';
import { connect } from '../../base/redux';

import logger from '../logger';

const {
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
const createEvent = function(quality) {
    return createToolbarEvent(
        'video.quality',
        {
            quality
        });
};

/**
 * The type of the React {@code Component} props of {@link VideoQualitySlider}.
 */
type Props = {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: Boolean,

    /**
     * Whether or not the conference is in peer to peer mode.
     */
    _p2p: Boolean,

    /**
     * The currently configured maximum quality resolution to be sent and
     * received from the remote participants.
     */
    _sendrecvVideoQuality: Number,

    /**
     * Whether or not displaying video is supported in the current
     * environment. If false, the slider will be disabled.
     */
    _videoSupported: Boolean,

    /**
     * Invoked to request toggling of audio only mode.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which displays a slider for selecting a
 * new receive video quality.
 *
 * @extends Component
 */
class VideoQualitySlider extends Component<Props> {
    _sliderOptions: Array<Object>;

    /**
     * Initializes a new {@code VideoQualitySlider} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._enableAudioOnly = this._enableAudioOnly.bind(this);
        this._enableHighDefinition = this._enableHighDefinition.bind(this);
        this._enableLowDefinition = this._enableLowDefinition.bind(this);
        this._enableStandardDefinition
            = this._enableStandardDefinition.bind(this);
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
                onSelect: this._enableHighDefinition,
                textKey: 'videoStatus.highDefinition',
                videoQuality: HIGH
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
        const { _videoSupported, t } = this.props;
        const activeSliderOption = this._mapCurrentQualityToSliderValue();

        let classNames = 'video-quality-dialog';
        let warning = null;

        if (!_videoSupported) {
            classNames += ' video-not-supported';
            warning = this._renderAudioOnlyLockedMessage();
        }

        return (
            <div className = { classNames }>
                <h3 className = 'video-quality-dialog-title'>
                    { t('videoStatus.callQuality') }
                </h3>
                <div className = { warning ? '' : 'hide-warning' }>
                    { warning }
                </div>
                <div className = 'video-quality-dialog-contents'>
                    <div className = 'video-quality-dialog-slider-container'>
                        { /* FIXME: onChange and onMouseUp are both used for
                           * compatibility with IE11. This workaround can be
                           * removed after upgrading to React 16.
                           */ }
                        <input
                            className = 'video-quality-dialog-slider'
                            disabled = { !_videoSupported }
                            max = { this._sliderOptions.length - 1 }
                            min = '0'
                            onChange = { this._onSliderChange }
                            onMouseUp = { this._onSliderChange }
                            step = '1'
                            type = 'range'
                            value
                                = { activeSliderOption } />

                    </div>
                    <div className = 'video-quality-dialog-labels'>
                        { this._createLabels(activeSliderOption) }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Creates a React Element for notifying that the browser is in audio only
     * and cannot be changed.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAudioOnlyLockedMessage() {
        const { t } = this.props;

        return (
            <InlineMessage
                title = { t('videoStatus.onlyAudioAvailable') }>
                { t('videoStatus.onlyAudioSupported') }
            </InlineMessage>
        );
    }

    /**
     * Creates React Elements to display mock tick marks with associated labels.
     *
     * @param {number} activeLabelIndex - Which of the sliderOptions should
     * display as currently active.
     * @private
     * @returns {ReactElement[]}
     */
    _createLabels(activeLabelIndex) {
        const labelsCount = this._sliderOptions.length;
        const maxWidthOfLabel = `${100 / labelsCount}%`;

        return this._sliderOptions.map((sliderOption, index) => {
            const style = {
                maxWidth: maxWidthOfLabel,
                left: `${(index * 100) / (labelsCount - 1)}%`
            };

            const isActiveClass = activeLabelIndex === index ? 'active' : '';
            const className
                = `video-quality-dialog-label-container ${isActiveClass}`;

            return (
                <div
                    className = { className }
                    key = { index }
                    style = { style }>
                    <div className = 'video-quality-dialog-label'>
                        { this.props.t(sliderOption.textKey) }
                    </div>
                </div>
            );
        });
    }

    _enableAudioOnly: () => void;

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

    _enableHighDefinition: () => void;

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

    _enableLowDefinition: () => void;

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

    _enableStandardDefinition: () => void;

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

            return _sliderOptions.indexOf(audioOnlyOption);
        }

        const matchingOption = _sliderOptions.find(
            ({ videoQuality }) => videoQuality === _sendrecvVideoQuality);

        return _sliderOptions.indexOf(matchingOption);
    }

    _onSliderChange: () => void;

    /**
     * Invokes a callback when the selected video quality changes.
     *
     * @param {Object} event - The slider's change event.
     * @private
     * @returns {void}
     */
    _onSliderChange(event) {
        const { _audioOnly, _sendrecvVideoQuality } = this.props;
        const {
            audioOnly,
            onSelect,
            videoQuality
        } = this._sliderOptions[event.target.value];

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
    _setPreferredVideoQuality(qualityLevel) {
        this.props.dispatch(setPreferredVideoQuality(qualityLevel));

        if (this.props._audioOnly) {
            this.props.dispatch(setAudioOnly(false));
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VideoQualitySlider} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _p2p: boolean,
 *     _sendrecvVideoQuality: number
 * }}
 */
function _mapStateToProps(state) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const { p2p, preferredVideoQuality } = state['features/base/conference'];

    return {
        _audioOnly: audioOnly,
        _p2p: p2p,
        _sendrecvVideoQuality: preferredVideoQuality,
        _videoSupported: JitsiMeetJS.mediaDevices.supportsVideo()
    };
}

export default translate(connect(_mapStateToProps)(VideoQualitySlider));
