// @flow

import Spinner from '@atlaskit/spinner';
import React, { PureComponent } from 'react';

import { translate } from '../../base/i18n';
import { VIDEO_TYPE } from '../../base/media';
import Video from '../../base/media/components/Video';
import { connect, equals } from '../../base/redux';
import { getCurrentCameraDeviceId } from '../../base/settings';
import { createLocalTracksF } from '../../base/tracks/functions';
import { toggleBackgroundEffect } from '../actions';
import { VIRTUAL_BACKGROUND_TYPE } from '../constants';
import { localTrackStopped } from '../functions';

const videoClassName = 'video-preview-video';

/**
 * The type of the React {@code PureComponent} props of {@link VirtualBackgroundPreview}.
 */
export type Props = {

    /**
     * The deviceId of the camera device currently being used.
     */
    _currentCameraDeviceId: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Represents the virtual background setted options.
     */
    options: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link VirtualBackgroundPreview}.
 */
type State = {

    /**
     * Loader activated on setting virtual background.
     */
    loading: boolean,

    /**
     * Activate the selected device camera only.
     */
    jitsiTrack: Object
};

/**
 * Implements a React {@link PureComponent} which displays the virtual
 * background preview.
 *
 * @extends PureComponent
 */
class VirtualBackgroundPreview extends PureComponent<Props, State> {
    _componentWasUnmounted: boolean;

    /**
     * Initializes a new {@code VirtualBackgroundPreview} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            jitsiTrack: null
        };
    }

    /**
     * Destroys the jitsiTrack object.
     *
     * @param {Object} jitsiTrack - The track that needs to be disposed.
     * @returns {Promise<void>}
     */
    _stopStream(jitsiTrack) {
        if (jitsiTrack) {
            jitsiTrack.dispose();
        }
    }

    /**
     * Creates and updates the track data.
     *
     * @returns {void}
     */
    async _setTracks() {
        const [ jitsiTrack ] = await createLocalTracksF({
            cameraDeviceId: this.props._currentCameraDeviceId,
            devices: [ 'video' ]
        });


        // In case the component gets unmounted before the tracks are created
        // avoid a leak by not setting the state
        if (this._componentWasUnmounted) {
            this._stopStream(jitsiTrack);

            return;
        }
        this.setState({
            jitsiTrack
        });
    }

    /**
     * Apply background effect on video preview.
     *
     * @returns {Promise}
     */
    async _applyBackgroundEffect() {
        this.setState({ loading: true });
        await this.props.dispatch(toggleBackgroundEffect(this.props.options, this.state.jitsiTrack));
        this.setState({ loading: false });
    }

    /**
     * Apply video preview loader.
     *
     * @returns {Promise}
     */
    _loadVideoPreview() {
        return (
            <div className = 'video-preview-loader'>
                <Spinner
                    invertColor = { true }
                    isCompleting = { false }
                    size = { 'large' } />
            </div>
        );
    }

    /**
     * Renders a preview entry.
     *
     * @param {Object} data - The track data.
     * @returns {React$Node}
     */
    _renderPreviewEntry(data) {
        const { t } = this.props;
        const className = 'video-background-preview-entry';

        if (this.state.loading) {
            return this._loadVideoPreview();
        }
        if (!data) {
            return (
                <div
                    className = { className }
                    video-preview-container = { true }>
                    <div className = 'video-preview-error'>{t('deviceSelection.previewUnavailable')}</div>
                </div>
            );
        }
        const props: Object = {
            className
        };

        return (
            <div { ...props }>
                <Video
                    className = { videoClassName }
                    playsinline = { true }
                    videoTrack = {{ jitsiTrack: data }} />
            </div>
        );
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._setTracks();
    }

    /**
     * Implements React's {@link Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._componentWasUnmounted = true;
        this._stopStream(this.state.jitsiTrack);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    async componentDidUpdate(prevProps) {
        if (!equals(this.props._currentCameraDeviceId, prevProps._currentCameraDeviceId)) {
            this._setTracks();
        }
        if (!equals(this.props.options, prevProps.options)) {
            if (prevProps.options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE) {
                prevProps.options.url.dispose();
            }
            this._applyBackgroundEffect();
        }
        if (this.props.options.url?.videoType === VIDEO_TYPE.DESKTOP) {
            localTrackStopped(this.props.dispatch, this.props.options.url, this.state.jitsiTrack);
        }
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { jitsiTrack } = this.state;

        return jitsiTrack
            ? <div className = 'video-preview'>{this._renderPreviewEntry(jitsiTrack)}</div>
            : <div className = 'video-preview-loader'>{this._loadVideoPreview()}</div>
        ;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VirtualBackgroundPreview} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    return {
        _currentCameraDeviceId: getCurrentCameraDeviceId(state)
    };
}

export default translate(connect(_mapStateToProps)(VirtualBackgroundPreview));
