import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../app/types';
import { hideDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { Video } from '../../base/media/components/index';
import { equals } from '../../base/redux/functions';
import { createLocalTracksF } from '../../base/tracks/functions';
import Spinner from '../../base/ui/components/web/Spinner';
import { showWarningNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { toggleBackgroundEffect } from '../actions';
import logger from '../logger';
import { IVirtualBackground } from '../reducer';

/**
 * The type of the React {@code PureComponent} props of {@link VirtualBackgroundPreview}.
 */
export interface IProps extends WithTranslation {

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Dialog callback that indicates if the background preview was loaded.
     */
    loadedPreview: Function;

    /**
     * Represents the virtual background set options.
     */
    options: IVirtualBackground;

    /**
     * The id of the selected video device.
     */
    selectedVideoInputId: string;
}

/**
 * The type of the React {@code Component} state of {@link VirtualBackgroundPreview}.
 */
interface IState {

    /**
     * Activate the selected device camera only.
     */
    jitsiTrack: Object | null;

    /**
     * Loader activated on setting virtual background.
     */
    loading: boolean;

    /**
     * Flag that indicates if the local track was loaded.
     */
    localTrackLoaded: boolean;
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: Theme) => {
    return {
        virtualBackgroundPreview: {
            height: 'auto',
            width: '100%',
            overflow: 'hidden',
            marginBottom: theme.spacing(3),
            zIndex: 2,
            borderRadius: '3px',
            backgroundColor: theme.palette.uiBackground,
            position: 'relative' as const
        },

        previewLoader: {
            height: '220px',

            '& svg': {
                position: 'absolute' as const,
                top: '40%',
                left: '45%'
            }
        },

        previewVideo: {
            height: '100%',
            width: '100%',
            objectFit: 'cover' as const
        },

        error: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '220px',
            position: 'relative' as const
        }
    };
};

/**
 * Implements a React {@link PureComponent} which displays the virtual
 * background preview.
 *
 * @augments PureComponent
 */
class VirtualBackgroundPreview extends PureComponent<IProps, IState> {
    _componentWasUnmounted: boolean;

    /**
     * Initializes a new {@code VirtualBackgroundPreview} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
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
                cameraDeviceId: this.props.selectedVideoInputId,
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
            <div className = { this.props.classes.previewLoader }>
                <Spinner size = 'large' />
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
        const { classes, t } = this.props;

        if (this.state.loading) {
            return this._loadVideoPreview();
        }
        if (!data) {
            return (
                <div className = { classes.error }>{t('deviceSelection.previewUnavailable')}</div>
            );
        }

        return (
            <Video
                className = { classes.previewVideo }
                playsinline = { true }
                videoTrack = {{ jitsiTrack: data }} />
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
    async componentDidUpdate(prevProps: IProps) {
        if (!equals(this.props.selectedVideoInputId, prevProps.selectedVideoInputId)) {
            this._setTracks();
        }
        if (!equals(this.props.options, prevProps.options) && this.state.localTrackLoaded) {
            this._applyBackgroundEffect();
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

        return (
            <div className = { classes.virtualBackgroundPreview }>
                {jitsiTrack
                    ? this._renderPreviewEntry(jitsiTrack)
                    : this._loadVideoPreview()
                }</div>
        );
    }
}

export default translate(connect()(withStyles(styles)(VirtualBackgroundPreview)));
