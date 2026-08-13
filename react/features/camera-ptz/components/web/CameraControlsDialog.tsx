import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Video from '../../../base/media/components/web/Video';
import Dialog from '../../../base/ui/components/web/Dialog';
import { resetLocalCameraFraming, setLocalCameraControl } from '../../actions';
import { ZOOM_RANGE } from '../../constants';
import { getCameraPtzState, getLocalCameraTrack } from '../../functions';

import CameraFramingMap from './CameraFramingMap';
import CameraZoomControls from './CameraZoomControls';

const useStyles = makeStyles()(theme => {
    return {
        content: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        },

        preview: {
            position: 'relative',
            aspectRatio: '16 / 9',
            width: '100%',
            borderRadius: `${theme.shape.borderRadius}px`,
            backgroundColor: theme.palette.uiBackground,
            overflow: 'hidden',

            '& video': {
                height: '100%',
                objectFit: 'cover',
                width: '100%'
            }
        },

        status: {
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '4px 8px',
            borderRadius: '4px',
            ...theme.typography.labelBold
        },

        onTarget: {
            backgroundColor: theme.palette.action01,
            color: theme.palette.text01
        },

        travelling: {
            backgroundColor: theme.palette.warning01,
            color: theme.palette.uiBackground
        },

        controls: {
            display: 'flex',
            gap: '16px'
        }
    };
});

/**
 * Pan, tilt and zoom for the local camera, laid out as a map of what the camera can see with the current framing
 * drawn on it.
 *
 * @returns {JSX.Element}
 */
const CameraControlsDialog = () => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const previewRef = useRef(null);
    const track = useSelector(getLocalCameraTrack);
    const { axes, commanded, values } = useSelector((state: IReduxState) => getCameraPtzState(state).local);

    const framing = useMemo(() => ({
        pan: values?.pan ?? 0,
        tilt: values?.tilt ?? 0,
        zoom: values?.zoom ?? ZOOM_RANGE.min
    }), [ values ]);

    const onFramingChange = useCallback((pan: number, tilt: number) => {
        dispatch(setLocalCameraControl({ pan,
            tilt }));
    }, [ dispatch ]);

    const onZoomChange = useCallback((zoom: number) => {
        dispatch(setLocalCameraControl({ zoom }));
    }, [ dispatch ]);

    const onReset = useCallback(() => {
        dispatch(resetLocalCameraFraming());
    }, [ dispatch ]);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ translationKey: 'dialog.done' }}
            titleKey = 'cameraPtz.title'>
            <div className = { classes.content }>
                <div className = { classes.preview }>
                    <Video
                        autoPlay = { true }
                        id = 'cameraPtzPreview'
                        playsinline = { true }
                        ref = { previewRef }
                        videoTrack = {{ jitsiTrack: track }} />
                    <div className = { cx(classes.status, commanded ? classes.travelling : classes.onTarget) }>
                        { t(commanded ? 'cameraPtz.moving' : 'cameraPtz.onTarget') }
                    </div>
                </div>
                <div className = { classes.controls }>
                    <CameraFramingMap
                        commanded = { commanded }
                        framing = { framing }
                        onChange = { onFramingChange }
                        pannable = { Boolean(axes?.pan || axes?.tilt) } />
                    <CameraZoomControls
                        framing = { framing }
                        onChange = { onZoomChange }
                        onReset = { onReset }
                        zoomable = { Boolean(axes?.zoom) } />
                </div>
            </div>
        </Dialog>
    );
};

export default CameraControlsDialog;
