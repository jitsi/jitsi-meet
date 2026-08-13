import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { getParticipantDisplayName } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { releaseCameraControl, sendCameraControl } from '../../actions.web';
import { PTZControlState, ZOOM_RANGE } from '../../constants';
import { getCameraPtzState } from '../../functions';

import CameraFramingMap from './CameraFramingMap';
import CameraZoomControls from './CameraZoomControls';

const useStyles = makeStyles()(theme => {
    return {
        overlay: {
            position: 'absolute',
            inset: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 2
        },

        row: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
        },

        pill: {
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, .7)',
            borderRadius: '4px',
            color: theme.palette.text01,
            display: 'flex',
            gap: '8px',
            padding: '4px 8px',
            ...theme.typography.labelBold
        },

        dot: {
            backgroundColor: theme.palette.action01,
            borderRadius: '50%',
            height: '8px',
            width: '8px'
        },

        controls: {
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            display: 'flex',
            gap: '16px',
            marginLeft: 'auto',
            padding: '16px',
            pointerEvents: 'auto',
            width: '340px'
        },

        done: {
            pointerEvents: 'auto'
        }
    };
});

/**
 * The controls for a camera under far end control, drawn over the video of the participant it belongs to. They are
 * laid out like the local ones, since the two do the same thing to a camera.
 *
 * @returns {JSX.Element | null}
 */
const RemoteCameraControls = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { commanded, state, target, values } = useSelector(
        (reduxState: IReduxState) => getCameraPtzState(reduxState).controller);
    const name = useSelector((reduxState: IReduxState) =>
        (target ? getParticipantDisplayName(reduxState, target) : ''));

    const framing = useMemo(() => ({
        pan: values?.pan ?? 0,
        tilt: values?.tilt ?? 0,
        zoom: values?.zoom ?? ZOOM_RANGE.min
    }), [ values ]);

    const onFramingChange = useCallback((pan: number, tilt: number) => {
        dispatch(sendCameraControl({ pan,
            tilt }));
    }, [ dispatch ]);

    const onZoomChange = useCallback((zoom: number) => {
        dispatch(sendCameraControl({ zoom }));
    }, [ dispatch ]);

    const onReset = useCallback(() => {
        dispatch(sendCameraControl({
            pan: 0,
            tilt: 0,
            zoom: ZOOM_RANGE.min
        }));
    }, [ dispatch ]);

    const onDone = useCallback(() => {
        dispatch(releaseCameraControl());
    }, [ dispatch ]);

    if (state !== PTZControlState.CONTROLLING) {
        return null;
    }

    return (
        <div className = { classes.overlay }>
            <div className = { classes.row }>
                <div className = { classes.pill }>
                    <span className = { classes.dot } />
                    { t('cameraPtz.controlling', { name }) }
                </div>
                <Button
                    accessibilityLabel = { t('cameraPtz.done') }
                    className = { classes.done }
                    labelKey = 'cameraPtz.done'
                    onClick = { onDone }
                    type = { BUTTON_TYPES.SECONDARY } />
            </div>
            <div className = { classes.controls }>
                <CameraFramingMap
                    commanded = { commanded }
                    framing = { framing }
                    onChange = { onFramingChange }

                    // Which axes the camera has is only known from what it reports back about itself.
                    pannable = { Boolean(values && ('pan' in values || 'tilt' in values)) } />
                <CameraZoomControls
                    framing = { framing }
                    onChange = { onZoomChange }
                    onReset = { onReset }
                    zoomable = { Boolean(values && 'zoom' in values) } />
            </div>
        </div>
    );
};

export default RemoteCameraControls;
