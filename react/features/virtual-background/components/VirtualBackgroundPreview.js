// @flow

import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';

import { createLocalVideoTracks } from '../../../features/settings/functions';
import { getVideoDeviceIds } from '../../base/devices';
import { translate } from '../../base/i18n';
import Video from '../../base/media/components/Video';
import { connect, equals } from '../../base/redux';
import { toggleBackgroundEffect } from '../actions';

const videoClassName = 'video-preview-video flipVideoX';

/**
 * The type of the React {@code Component} props of {@link VirtualBackgroundPreview}.
 */
export type Props = {

    /**
     * The deviceId of the camera device currently being used.
     */
    currentCameraDeviceId: string,

    /**
     * Callback invoked to change current camera.
     */
    setVideoInputDevice: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Callback invoked to toggle the settings popup visibility.
     */
    toggleVideoSettings: Function,

    /**
     * All the camera device ids currently connected.
     */
    videoDeviceIds: string[],

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Represents the virtual background setted options.
     */
    options: Object
};

/**
 * The type of the React {@code Component} state of {@link VirtualBackgroundPreview}.
 */
type State = {

    /**
     * An array of all the jitsiTracks and eventual errors.
     */
    trackData: Object[],

    /**
     * Loader activated on setting virtual background.
     */
    loading: boolean
};

/**
 * Implements a React {@link Component} which displays the virtual
 * background preview.
 *
 * @extends Component
 */
class VirtualBackgroundPreview extends Component<Props, State> {
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
            trackData: new Array(props.videoDeviceIds && props.videoDeviceIds.length).fill({
                jitsiTrack: null
            }),
            loading: false
        };
    }

    /**
     * Creates and updates the track data.
     *
     * @returns {void}
     */
    async _setTracks() {
        this._disposeTracks(this.state.trackData);

        const trackData = await createLocalVideoTracks(this.props.videoDeviceIds, 5000);

        // In case the component gets unmounted before the tracks are created
        // avoid a leak by not setting the state
        if (this._componentWasUnmounted) {
            this._disposeTracks(trackData);
        } else {
            this.setState({
                trackData
            });
        }
    }

    /**
     * Destroys all the tracks from trackData object.
     *
     * @param {Object[]} trackData - An array of tracks that are to be disposed.
     * @returns {Promise<void>}
     */
    _disposeTracks(trackData) {
        trackData.forEach(({ jitsiTrack }) => {
            jitsiTrack && jitsiTrack.dispose();
        });
    }

    /**
     * Returns the click handler used when selecting the video preview.
     *
     * @param {string} deviceId - The id of the camera device.
     * @returns {Function}
     */
    _onEntryClick(deviceId) {
        return () => {
            this.props.setVideoInputDevice(deviceId);
            this.props.toggleVideoSettings();
        };
    }

    /**
     * Apply background effect on video preview.
     *
     * @returns {Promise}
     */
    async _applyBackgroundEffect() {
        const jitsiTrack = this.state.trackData[0].jitsiTrack;

        this.setState({ loading: true });
        await this.props.dispatch(toggleBackgroundEffect(this.props.options, jitsiTrack));
        this.setState({ loading: false });
    }

    /**
     * Renders a preview entry.
     *
     * @param {Object} data - The track data.
     * @param {number} index - The index of the entry.
     * @returns {React$Node}
     */
    _renderPreviewEntry(data, index) {
        const { error, jitsiTrack } = data;
        const { t } = this.props;
        const key = `vp-${index}`;
        const className = 'video-background-preview-entry';

        if (this.state.loading) {
            return (
                <div>
                    <span className = 'loading-content-text'>{t('virtualBackground.pleaseWait')}</span>
                    <Spinner
                        invertColor = { true }
                        isCompleting = { false }
                        size = { 'large' } />
                </div>
            );
        }
        if (error) {
            return (
                <div
                    className = { className }
                    key = { key }
                    video-preview-container = { true }>
                    <div className = 'video-preview-error'>{t(error)}</div>
                </div>
            );
        }

        const props: Object = {
            className,
            key
        };

        return (
            <div { ...props }>
                <Video
                    className = { videoClassName }
                    playsinline = { true }
                    videoTrack = {{ jitsiTrack }} />
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
        this._disposeTracks(this.state.trackData);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    async componentDidUpdate(prevProps) {
        if (!equals(this.props.videoDeviceIds, prevProps.videoDeviceIds)) {
            this._setTracks();
        }
        if (!equals(this.props.options, prevProps.options)) {
            this._applyBackgroundEffect();
        }
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { trackData } = this.state;

        return <div className = 'video-preview'>{trackData.map((data, i) => this._renderPreviewEntry(data, i))}</div>;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VirtualBackgroundPreview} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     videoDeviceIds: string[]
 * }}
 */
function _mapStateToProps(state): Object {
    return {
        videoDeviceIds: getVideoDeviceIds(state)
    };
}

export default translate(connect(_mapStateToProps)(VirtualBackgroundPreview));
