import Tooltip from '@atlaskit/tooltip';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { CircularLabel } from '../../base/label';
import { MEDIA_TYPE } from '../../base/media';
import { getTrackByMediaTypeAndParticipant } from '../../base/tracks';

/**
 * A map of video resolution (number) to translation key.
 *
 * @type {Object}
 */
const RESOLUTION_TO_TRANSLATION_KEY = {
    720: 'videoStatus.hd',
    360: 'videoStatus.sd',
    180: 'videoStatus.ld'
};

/**
 * Expected video resolutions placed into an array, sorted from lowest to
 * highest resolution.
 *
 * @type {number[]}
 */
const RESOLUTIONS
    = Object.keys(RESOLUTION_TO_TRANSLATION_KEY)
        .map(resolution => parseInt(resolution, 10))
        .sort((a, b) => a - b);

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference. {@code AudioOnlyLabel}
 * will display when the conference is in audio only mode. {@code HDVideoLabel}
 * will display if not in audio only mode and a high-definition large video is
 * being displayed.
 */
export class VideoQualityLabel extends Component {
    /**
     * {@code VideoQualityLabel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the conference is in audio only mode.
         */
        _audioOnly: PropTypes.bool,

        /**
         * The current video resolution (height) to display a label for.
         */
        _resolution: PropTypes.number,

        /**
         * The redux representation of the JitsiTrack displayed on large video.
         */
        _videoTrack: PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code VideoQualityLabel} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the filmstrip is transitioning from not visible
             * to visible. Used to set a transition class for animation.
             *
             * @type {boolean}
             */
            togglingToVisible: false
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _audioOnly,
            _resolution,
            _videoTrack,
            t
        } = this.props;


        let labelContent, tooltipKey;

        if (_audioOnly) {
            labelContent = t('videoStatus.audioOnly');
            tooltipKey = 'videoStatus.labelTooltipAudioOnly';
        } else if (!_videoTrack || _videoTrack.muted) {
            labelContent = t('videoStatus.audioOnly');
            tooltipKey = 'videoStatus.labelTooiltipNoVideo';
        } else {
            const translationKeys
                = this._mapResolutionToTranslationsKeys(_resolution);

            labelContent = t(translationKeys.labelKey);
            tooltipKey = translationKeys.tooltipKey;
        }


        return (
            <Tooltip
                content = { t(tooltipKey) }
                position = { 'left' }>
                <CircularLabel
                    className = 'vid-quality'
                    id = 'videoResolutionLabel'>
                    { labelContent }
                </CircularLabel>
            </Tooltip>
        );
    }

    /**
     * Matches the passed in resolution with a translation keys for describing
     * the resolution. The passed in resolution will be matched with a known
     * resolution that it is at least greater than or equal to.
     *
     * @param {number} resolution - The video height to match with a
     * translation.
     * @private
     * @returns {Object}
     */
    _mapResolutionToTranslationsKeys(resolution) {
        // Set the default matching resolution of the lowest just in case a
        // match is not found.
        let highestMatchingResolution = RESOLUTIONS[0];

        for (let i = 0; i < RESOLUTIONS.length; i++) {
            const knownResolution = RESOLUTIONS[i];

            if (resolution >= knownResolution) {
                highestMatchingResolution = knownResolution;
            } else {
                break;
            }
        }

        const labelKey
            = RESOLUTION_TO_TRANSLATION_KEY[highestMatchingResolution];

        return {
            labelKey,
            tooltipKey: `${labelKey}Tooltip`
        };
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoQualityLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _resolution: number,
 *     _videoTrack: Object
 * }}
 */
function _mapStateToProps(state) {
    const { audioOnly } = state['features/base/conference'];
    const { resolution, participantId } = state['features/large-video'];
    const videoTrackOnLargeVideo = getTrackByMediaTypeAndParticipant(
        state['features/base/tracks'],
        MEDIA_TYPE.VIDEO,
        participantId
    );

    return {
        _audioOnly: audioOnly,
        _resolution: resolution,
        _videoTrack: videoTrackOnLargeVideo
    };
}

export default translate(connect(_mapStateToProps)(VideoQualityLabel));
