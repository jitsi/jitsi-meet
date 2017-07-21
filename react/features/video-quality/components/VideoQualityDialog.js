import InlineMessage from '@atlaskit/inline-message';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    setAudioOnly,
    setReceiveVideoQuality,
    VIDEO_QUALITY_LEVELS
} from '../../base/conference';

import { translate } from '../../base/i18n';

const {
    HIGH,
    MEDIUM,
    LOW
} = VIDEO_QUALITY_LEVELS;

/**
 * Implements a React {@link Component} which displays a dialog with a slider
 * for selecting a new receive video quality.
 *
 * @extends Component
 */
class VideoQualityDialog extends Component {
    /**
     * {@code VideoQualityDialog}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the conference is in audio only mode.
         */
        _audioOnly: React.PropTypes.bool,

        /**
         * Whether or not the conference is in peer to peer mode.
         */
        _p2p: React.PropTypes.bool,

        /**
         * The currently configured maximum quality resolution to be received
         * from remote participants.
         */
        _receiveVideoQuality: React.PropTypes.number,

        /**
         * Invoked to request toggling of audio only mode.
         */
        dispatch: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code VideoQualityDialog} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._enableAudioOnly = this._enableAudioOnly.bind(this);
        this._enableHighQuality = this._enableHighQuality.bind(this);
        this._enableLowQuality = this._enableLowQuality.bind(this);
        this._enableMediumQuality = this._enableMediumQuality.bind(this);
        this._onSliderChange = this._onSliderChange.bind(this);

        this.state = {
            sliderOptions: [
                {
                    audioOnly: true,
                    onClick: this._enableAudioOnly,
                    textKey: 'audioOnly.audioOnly'
                },
                {
                    onClick: this._enableLowQuality,
                    textKey: 'videoStatus.lowQuality',
                    videoQuality: LOW
                },
                {
                    onClick: this._enableMediumQuality,
                    textKey: 'videoStatus.standardQuality',
                    videoQuality: MEDIUM
                },
                {
                    onClick: this._enableHighQuality,
                    textKey: 'videoStatus.highQuality',
                    videoQuality: HIGH
                }
            ]
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, _p2p } = this.props;
        const { sliderOptions } = this.state;
        const activeSliderOption = this._mapCurrentQualityToSliderValue();

        return (
            <div className = 'video-quality-dialog'>
                <h3>{ t('videoStatus.callQuality') }</h3>
                <div className = 'video-quality-dialog-contents'>
                    <div className = 'video-quality-dialog-slider-container'>
                        { /* FIXME: onChange and onMouseUp are both used for
                           * compatibility with IE11. This workaround can be
                           * removed after upgrading to React 16.
                           */ }
                        <input
                            className = 'video-quality-dialog-slider'
                            max = { sliderOptions.length - 1 }
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
                { _p2p ? this._renderP2PMessage() : null }
            </div>
        );
    }

    /**
     * Creates React Elements for notifying that peer to peer is enabled.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderP2PMessage() {
        const { t } = this.props;

        return (
            <InlineMessage
                secondaryText = { t('videoStatus.recHighQualityOnly') }
                title = { t('videoStatus.p2pEnabled') }>
                { t('videoStatus.p2pVideoQualityDescription') }
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
        const { sliderOptions } = this.state;
        const labelsCount = sliderOptions.length;
        const maxWidthOfLabel = `${100 / labelsCount}%`;

        return sliderOptions.map((sliderOption, index) => {
            const style = {
                maxWidth: maxWidthOfLabel,
                left: `${(index * 100) / (labelsCount - 1)}%`
            };

            const isActive = activeLabelIndex === index;
            const className
                = `video-quality-dialog-label ${isActive ? 'active' : ''}`;

            return (
                <div
                    className = { className }
                    key = { index }
                    style = { style }>
                    { this.props.t(sliderOption.textKey) }
                </div>
            );
        });
    }

    /**
     * Dispatches an action to receive high quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableHighQuality() {
        this.props.dispatch(setReceiveVideoQuality(HIGH));
    }

    /**
     * Dispatches an action to receive low quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableLowQuality() {
        this.props.dispatch(setReceiveVideoQuality(LOW));
    }

    /**
     * Dispatches an action to receive medium quality video from remote
     * participants.
     *
     * @private
     * @returns {void}
     */
    _enableMediumQuality() {
        this.props.dispatch(setReceiveVideoQuality(MEDIUM));
    }

    /**
     * Dispatches an action to enable audio only mode.
     *
     * @private
     * @returns {void}
     */
    _enableAudioOnly() {
        this.props.dispatch(setAudioOnly(true));
    }

    /**
     * Matches the current video quality state with correspinding index of the
     * component's slider options.
     *
     * @private
     * @returns {void}
     */
    _mapCurrentQualityToSliderValue() {
        const { _audioOnly, _receiveVideoQuality } = this.props;
        const { sliderOptions } = this.state;

        if (_audioOnly) {
            const audioOnlyOption = sliderOptions.find(
                ({ audioOnly }) => audioOnly);

            return sliderOptions.indexOf(audioOnlyOption);
        }

        const matchingOption = sliderOptions.find(
            ({ videoQuality }) => videoQuality === _receiveVideoQuality);

        return sliderOptions.indexOf(matchingOption);
    }

    /**
     * Invokes a callback when the selected video quality changes.
     *
     * @param {Object} event - The slider's change event.
     * @private
     * @returns {void}
     */
    _onSliderChange(event) {
        const chosenOption = this.state.sliderOptions[event.target.value];

        chosenOption.onClick();
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code VideoQualityDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _p2p: boolean,
 *     _receiveVideoQuality: boolean
 * }}
 */
function _mapStateToProps(state) {
    const {
        audioOnly,
        p2p,
        receiveVideoQuality
    } = state['features/base/conference'];

    return {
        _audioOnly: audioOnly,
        _p2p: p2p,
        _receiveVideoQuality: receiveVideoQuality
    };
}

export default translate(connect(_mapStateToProps)(VideoQualityDialog));

