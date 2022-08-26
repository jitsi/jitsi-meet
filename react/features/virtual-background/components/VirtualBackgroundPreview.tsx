/* eslint-disable lines-around-comment */
import Spinner from '@atlaskit/spinner';
import { withStyles } from '@material-ui/core/styles';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';

import { IState } from '../../app/types';
// @ts-ignore
import { hideDialog } from '../../base/dialog';
// @ts-ignore
import { translate } from '../../base/i18n';
// @ts-ignore
import Video from '../../base/media/components/Video';
import { VIDEO_TYPE } from '../../base/media/constants';
import { connect, equals } from '../../base/redux/functions';
// @ts-ignore
import { getCurrentCameraDeviceId } from '../../base/settings';
// @ts-ignore
import { createLocalTracksF } from '../../base/tracks/functions';
// @ts-ignore
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications';
// @ts-ignore
import { showWarningNotification } from '../../notifications/actions';
// @ts-ignore
import { toggleBackgroundEffect } from '../actions';
import { VIRTUAL_BACKGROUND_TYPE } from '../constants';
// @ts-ignore
import { localTrackStopped } from '../functions';
// @ts-ignore
import logger from '../logger';

const videoClassName = 'video-preview-video';

/**
 * The type of the React {@code PureComponent} props of {@link VirtualBackgroundPreview}.
 */
export type Props = WithTranslation & {

    /**
     * The deviceId of the camera device currently being used.
     */
    _currentCameraDeviceId: string,

    /**
     * An object containing the CSS classes.
     */
    classes: any,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Dialog callback that indicates if the background preview was loaded.
     */
    loadedPreview: Function,

    /**
     * Represents the virtual background set options.
     */
    options: any
};

/**
 * The type of the React {@code Component} state of {@link VirtualBackgroundPreview}.
 */
type State = {

    /**
     * Activate the selected device camera only.
     */
    jitsiTrack: Object|null,

    /**
     * Loader activated on setting virtual background.
     */
    loading: boolean,

    /**
     * Flag that indicates if the local track was loaded.
     */
    localTrackLoaded: boolean
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: any) => {
    return {
        virtualBackgroundPreview: {
            '& .video-preview': {
                height: '250px'
            },

            '& .video-background-preview-entry': {
                marginLeft: '-10px',
                height: '250px',
                width: '570px',
                marginBottom: `${theme.spacing(2)}px`,
                zIndex: 2,

                '@media (max-width: 632px)': {
                    maxWidth: '336px'
                }
            },

            '& .video-preview-loader': {
                borderRadius: '6px',
                backgroundColor: 'transparent',
                height: '250px',
                marginBottom: `${theme.spacing(2)}px`,
                width: '572px',
                position: 'fixed',
                zIndex: 2,

                '& svg': {
                    position: 'absolute',
                    top: '40%',
                    left: '45%'
                },

                '@media (min-width: 432px) and (max-width: 632px)': {
                    width: '340px'
                }
            }
        }
    };
};

/**
 * Implements a React {@link PureComponent} which displays the virtual
 * background preview.
 *
 * @augments PureComponent
 */
class VirtualBackgroundPreview extends PureComponent<Props, State> {
    _componentWasUnmounted: boolean;

    /**
     * Initializes a new {@code VirtualBackgroundPreview} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            loading: false,
            localTrackLoaded: false,
            jitsiTrack: null
        };
    }

    /**
     * Destroys the jitsiTrack object.
     *
     * @param {Object} jitsiTrack - The track that needs to be disposed.
     * @returns {Promise<void>}
     */
    _stopStream(jitsiTrack: any) {
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
        try {
            this.setState({ loading: true });
            const [ jitsiTrack ] = await createLocalTracksF({
                cameraDeviceId: this.props._currentCameraDeviceId,
                devices: [ 'video' ]
            });

            this.setState({ localTrackLoaded: true });

            // In case the component gets unmounted before the tracks are created
            // avoid a leak by not setting the state
            if (this._componentWasUnmounted) {
                this._stopStream(jitsiTrack);

                return;
            }
            this.setState({
                jitsiTrack,
                loading: false
            });
            this.props.loadedPreview(true);
        } catch (error) {
            this.props.dispatch(hideDialog());
            this.props.dispatch(
                showWarningNotification({
                    titleKey: 'virtualBackground.backgroundEffectError',
                    description: 'Failed to access camera device.'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG)
            );
            logger.error('Failed to access camera device. Error on apply background effect.');

            return;
        }

        if (this.props.options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE
                && this.state.localTrackLoaded) {
            this._applyBackgroundEffect();
        }
    }

    /**
     * Apply background effect on video preview.
     *
     * @returns {Promise}
     */
    async _applyBackgroundEffect() {
        this.setState({ loading: true });
        this.props.loadedPreview(false);
        await this.props.dispatch(toggleBackgroundEffect(this.props.options, this.state.jitsiTrack));
        this.props.loadedPreview(true);
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
                    // @ts-ignore
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
    _renderPreviewEntry(data: Object) {
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
    async componentDidUpdate(prevProps: Props) {
        if (!equals(this.props._currentCameraDeviceId, prevProps._currentCameraDeviceId)) {
            this._setTracks();
        }
        if (!equals(this.props.options, prevProps.options) && this.state.localTrackLoaded) {
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
        const { classes } = this.props;

        return (<div className = { classes.virtualBackgroundPreview }>
            {jitsiTrack
                ? <div className = 'video-preview'>{this._renderPreviewEntry(jitsiTrack)}</div>
                : <div className = 'video-preview-loader'>{this._loadVideoPreview()}</div>
            }</div>);
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
function _mapStateToProps(state: IState): Object {
    return {
        _currentCameraDeviceId: getCurrentCameraDeviceId(state)
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(VirtualBackgroundPreview)));
