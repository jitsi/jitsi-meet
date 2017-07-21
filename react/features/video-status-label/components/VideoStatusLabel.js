import { Tooltip } from '@atlaskit/tooltip';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';

declare var interfaceConfig: Object;

/**
 * Whether or not the video quality button is displayed in a menu.
 *
 * @private
 * @type {boolean}
 */
const HAS_VIDEO_QUALITY_BUTTON
    = (interfaceConfig.TOOLBAR_BUTTONS || [])
        .find(button => button === 'videoquality');

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
         * Whether or not the filmstrip is displayed with remote videos. Used to
         * determine display classes to set.
         */
        _filmstripVisible: React.PropTypes.bool,

        /**
         * Whether or not a high-definition large video is displayed.
         */
        _largeVideoHD: React.PropTypes.bool,

        /**
         * Whether or note remote videos are visible in the filmstrip,
         * regardless of count. Used to determine display classes to set.
         */
        _remoteVideosVisible: React.PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code VideoStatusLabel} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            // Whether or not the filmstrip is transitioning from not visible
            // to visible. Used to set a transition class for animation.
            togglingToVisible: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
    }

    /**
     * Updates the state for whether or not the filmstrip is being toggled to
     * display after having being hidden.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        this.setState({
            togglingToVisible: nextProps._filmstripVisible
                && !this.props._filmstripVisible
        });
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
            _remoteVideosVisible,
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

        // Determine which classes should be set on the component. These classes
        // will used to help with animations and setting position.
        const baseClasses = 'video-state-indicator moveToCorner';
        const filmstrip
            = _filmstripVisible ? 'with-filmstrip' : 'without-filmstrip';
        const remoteVideosVisible = _remoteVideosVisible
            ? 'with-remote-videos'
            : 'without-remote-videos';
        const opening = this.state.togglingToVisible ? 'opening' : '';
        const classNames
            = `${baseClasses} ${filmstrip} ${remoteVideosVisible} ${opening}`;

        return (
            <Tooltip
                description = { t('videoStatus.changeVideoTip') }
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }
                position = 'left'
                visible = { this.state.showTooltip }>
                <div
                    className = { classNames }
                    id = 'videoResolutionLabel' >
                    { displayedLabel }
                </div>
            </Tooltip>
        );
    }

    /**
     * Hides the tooltip for explaining how to change received video quality.
     *
     * @private
     * @returns {void}
     */
    _onMouseOut() {
        this.setState({ showTooltip: false });
    }

    /**
     * Displays a tooltip for explaining how to change received video quality.
     *
     * @private
     * @returns {void}
     */
    _onMouseOver() {
        if (HAS_VIDEO_QUALITY_BUTTON) {
            this.setState({ showTooltip: true });
        }
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
 *     _filmstripVisible: true,
 *     _largeVideoHD: (boolean|undefined),
 *     _remoteVideosVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const {
        audioOnly,
        conference,
        isLargeVideoHD
    } = state['features/base/conference'];
    const {
        remoteVideosVisible,
        visible
    } = state['features/filmstrip'];

    return {
        _audioOnly: audioOnly,
        _conferenceStarted: Boolean(conference),
        _filmstripVisible: visible,
        _largeVideoHD: isLargeVideoHD,
        _remoteVideosVisible: remoteVideosVisible
    };
}

export default translate(connect(_mapStateToProps)(VideoStatusLabel));
