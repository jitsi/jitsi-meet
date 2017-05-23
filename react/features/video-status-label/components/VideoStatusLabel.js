import React, { Component } from 'react';
import { connect } from 'react-redux';

import { toggleAudioOnly } from '../../base/conference';
import { translate } from '../../base/i18n';

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference. {@code AudioOnlyLabel}
 * will display when the conference is in audio only mode. {@code HDVideoLabel}
 * will display if not in audio only mode and a high-definition large video is
 * being displayed.
 */
export class VideoStatusLabel extends Component {
    /**
     * {@code VideoStatusLabel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the conference is in audio only mode.
         */
        _audioOnly: React.PropTypes.bool,

        /**
         * Whether or not a connection to a conference has been established.
         */
        _conferenceStarted: React.PropTypes.bool,

        /**
         * Whether or not the filmstrip is displayed with remote videos.
         */
        _filmstripVisible: React.PropTypes.bool,

        /**
         * Whether or not a high-definition large video is displayed.
         */
        _largeVideoHD: React.PropTypes.bool,

        /**
         * Invoked to request toggling of audio only mode.
         */
        dispatch: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new {@code VideoStatusLabel} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._toggleAudioOnly = this._toggleAudioOnly.bind(this);
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
            _conferenceStarted,
            _filmstripVisible,
            _largeVideoHD,
            t
        } = this.props;

        // FIXME The _conferenceStarted check is used to be defensive against
        // toggling audio only mode while there is no conference and hides the
        // need for error handling around audio only mode toggling.
        if (!_conferenceStarted) {
            return null;
        }

        let displayedLabel;

        if (_audioOnly) {
            displayedLabel = <i className = 'icon-visibility-off' />;
        } else {
            displayedLabel = _largeVideoHD
                ? t('videoStatus.hd') : t('videoStatus.sd');
        }

        const filmstripClassName
            = _filmstripVisible ? 'with-filmstrip' : 'without-filmstrip';
        const classNames
            = `video-state-indicator moveToCorner ${filmstripClassName}`;

        return (
            <div
                className = { classNames }
                id = 'videoResolutionLabel' >
                { displayedLabel }
                { this._renderVideonMenu() }
            </div>
        );
    }

    /**
     * Renders a dropdown menu for changing video modes.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderVideonMenu() {
        const { _audioOnly, t } = this.props;
        const audioOnlyAttributes = _audioOnly ? { className: 'active' }
            : { onClick: this._toggleAudioOnly };
        const videoAttributes = _audioOnly ? { onClick: this._toggleAudioOnly }
            : { className: 'active' };

        return (
            <div className = 'video-state-indicator-menu'>
                <div className = 'video-state-indicator-menu-options'>
                    <div { ...audioOnlyAttributes }>
                        <i className = 'icon-visibility' />
                        { t('audioOnly.audioOnly') }
                    </div>
                    <div { ...videoAttributes }>
                        <i className = 'icon-camera' />
                        { this.props._largeVideoHD
                            ? t('videoStatus.hdVideo')
                            : t('videoStatus.sdVideo') }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Dispatches an action to toggle the state of audio only mode.
     *
     * @private
     * @returns {void}
     */
    _toggleAudioOnly() {
        this.props.dispatch(toggleAudioOnly());
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoStatusLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _conferenceStarted: boolean,
 *     _largeVideoHD: (boolean|undefined)
 * }}
 */
function _mapStateToProps(state) {
    const {
        audioOnly,
        conference,
        isLargeVideoHD
    } = state['features/base/conference'];
    const {
        remoteVideosCount,
        remoteVideosVisible,
        visible
    } = state['features/filmstrip'];

    return {
        _audioOnly: audioOnly,
        _conferenceStarted: Boolean(conference),
        _filmstripVisible:
            Boolean(remoteVideosCount && remoteVideosVisible && visible),
        _largeVideoHD: isLargeVideoHD
    };
}

export default translate(connect(_mapStateToProps)(VideoStatusLabel));
