// @flow

import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';

import { createLocalVideoTracks } from '../../../features/settings/functions';
import { getVideoDeviceIds } from '../../base/devices';
import { translate } from '../../base/i18n';
import Video from '../../base/media/components/Video';
import { connect, equals } from '../../base/redux';
import { getCurrentCameraDeviceId } from '../../base/settings';
import { createVirtualBackgroundEffect } from '../../stream-effects/virtual-background';
import { toggleBackgroundEffect } from '../actions';

const videoClassName = 'video-preview-video flipVideoX';

/**
 * The type of the React {@code Component} props of {@link VirtualBackgroundPreview}.
 */
export type Props = {

    /**
     * The deviceId of the camera device currently being used.
     */
    _currentCameraDeviceId: string,

    /**
     * All the camera device ids currently connected.
     */
    _videoDeviceIds: string[],

    /**
     * The virtual background object.
     */

    _virtualBackground: Object,

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
     * An array of all the jitsiTracks and eventual errors.
     */
    trackData: Object[],

    /**
     * Activate the selected device camera only.
     */
    selectedTrack: Object
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
            trackData: new Array(props._videoDeviceIds && props._videoDeviceIds.length).fill({
                jitsiTrack: null
            }),
            loading: false,
            selectedTrack: null
        };
    }

    /**
     * Creates and updates the track data.
     *
     * @returns {void}
     */
    async _setTracks() {
        this._disposeTracks(this.state.trackData);

        const trackData = await createLocalVideoTracks(this.props._videoDeviceIds, 5000);

        // In case the component gets unmounted before the tracks are created
        // avoid a leak by not setting the state
        if (this._componentWasUnmounted) {
            this._disposeTracks(trackData);
        } else {
            this.setState({
                trackData
            });
        }

        // background preview should open the selected device camera only
        const selectedTrack = this.state.trackData.filter(
            track => track.deviceId === this.props._currentCameraDeviceId
        )[0]?.jitsiTrack;

        this.setState({
            selectedTrack
        });
        if (this.props._virtualBackground?.backgroundEffectEnabled && this.state.selectedTrack) {
            await this.state.selectedTrack.setEffect(
                await createVirtualBackgroundEffect(this.props._virtualBackground)
            );
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
     * Apply background effect on video preview.
     *
     * @returns {Promise}
     */
    async _applyBackgroundEffect() {
        this.setState({ loading: true });
        await this.props.dispatch(toggleBackgroundEffect(this.props.options, this.state.selectedTrack));
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
        const { error } = data;
        const { t } = this.props;
        const className = 'video-background-preview-entry';

        if (this.state.loading) {
            return this._loadVideoPreview();
        }
        if (error) {
            return (
                <div
                    className = { className }
                    video-preview-container = { true }>
                    <div className = 'video-preview-error'>{t(error)}</div>
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
        this._disposeTracks(this.state.trackData);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    async componentDidUpdate(prevProps) {
        if (!equals(this.props._videoDeviceIds, prevProps._videoDeviceIds)) {
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
        const { selectedTrack } = this.state;

        return selectedTrack
            ? <div className = 'video-preview'>{this._renderPreviewEntry(selectedTrack)}</div>
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
        _currentCameraDeviceId: getCurrentCameraDeviceId(state),
        _videoDeviceIds: getVideoDeviceIds(state),
        _virtualBackground: state['features/virtual-background']
    };
}

export default translate(connect(_mapStateToProps)(VirtualBackgroundPreview));
