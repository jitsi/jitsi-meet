// @flow

import React, { Component } from 'react';

import { translate } from '../../../../base/i18n';
import Video from '../../../../base/media/components/Video';
import { equals } from '../../../../base/redux';
import { createLocalVideoTracks } from '../../../functions';


const videoClassName = 'video-preview-video flipVideoX';

/**
 * The type of the React {@code Component} props of {@link VideoSettingsContent}.
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
};

/**
 * The type of the React {@code Component} state of {@link VideoSettingsContent}.
 */
type State = {

    /**
     * An array of all the jitsiTracks and eventual errors.
     */
    trackData: Object[],
};

/**
 * Implements a React {@link Component} which displays a list of video
 * previews to choose from.
 *
 * @extends Component
 */
class VideoSettingsContent extends Component<Props, State> {
    _componentWasUnmounted: boolean;

    /**
     * Initializes a new {@code VideoSettingsContent} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            trackData: new Array(props.videoDeviceIds.length).fill({
                jitsiTrack: null
            })
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
     * Renders a preview entry.
     *
     * @param {Object} data - The track data.
     * @param {number} index - The index of the entry.
     * @returns {React$Node}
     */
    _renderPreviewEntry(data, index) {
        const { error, jitsiTrack, deviceId } = data;
        const { currentCameraDeviceId, t } = this.props;
        const isSelected = deviceId === currentCameraDeviceId;
        const key = `vp-${index}`;
        const className = 'video-preview-entry';

        if (error) {
            return (
                <div
                    className = { className }
                    key = { key }>
                    <div className = 'video-preview-error'>{t(error)}</div>
                </div>
            );
        }

        const props: Object = {
            className,
            key
        };
        const label = jitsiTrack && jitsiTrack.getTrackLabel();

        if (isSelected) {
            props.className = `${className} video-preview-entry--selected`;
        } else {
            props.onClick = this._onEntryClick(deviceId);
        }

        return (
            <div { ...props }>
                <div className = 'video-preview-label'>{label}</div>
                <div className = 'video-preview-overlay' />
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
    componentDidUpdate(prevProps) {
        if (!equals(this.props.videoDeviceIds, prevProps.videoDeviceIds)) {
            this._setTracks();
        }
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { trackData } = this.state;

        return (
            <div className = 'video-preview-container'>
                <div className = 'video-preview'>
                    {trackData.map((data, i) => this._renderPreviewEntry(data, i))}
                </div>
            </div>
        );
    }
}


export default translate(VideoSettingsContent);
