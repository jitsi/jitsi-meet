import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { resetLocalCameraFraming, setLocalCameraControl } from '../../actions';
import { ZOOM_RANGE } from '../../constants';
import { IPTZValues } from '../../types';

interface IProps {

    /**
     * Where the camera is now.
     */
    framing: Required<IPTZValues>;

    /**
     * Whether the camera can be zoomed at all.
     */
    zoomable: boolean;
}

const ZOOM_STEP = 0.1;

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '148px'
        },

        header: {
            color: theme.palette.text02,
            display: 'flex',
            justifyContent: 'space-between',
            ...theme.typography.bodyShortRegular
        },

        value: {
            color: theme.palette.text01,
            fontWeight: 600
        },

        slider: {
            appearance: 'none',
            background: 'transparent',
            width: '100%',

            '&::-webkit-slider-runnable-track': {
                backgroundColor: theme.palette.ui03,
                borderRadius: '2px',
                height: '4px'
            },

            '&::-webkit-slider-thumb': {
                appearance: 'none',
                backgroundColor: theme.palette.text01,
                borderRadius: '50%',
                boxShadow: '0 1px 4px rgba(4, 4, 4, .6)',
                height: '14px',
                marginTop: '-5px',
                width: '14px'
            },

            '&:disabled': {
                opacity: 0.5
            }
        },

        helper: {
            color: theme.palette.text03,
            ...theme.typography.bodyShortRegularSmall
        }
    };
});

/**
 * The zoom of the local camera, and a way back to the framing it started from.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element}
 */
const CameraZoomControls = ({ framing, zoomable }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onZoom = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setLocalCameraControl({ zoom: Number(event.target.value) }));
    }, [ dispatch ]);

    const onReset = useCallback(() => {
        dispatch(resetLocalCameraFraming());
    }, [ dispatch ]);

    return (
        <div className = { classes.container }>
            <div className = { classes.header }>
                <span>{ t('cameraPtz.zoom') }</span>
                <span className = { classes.value }>{ `${framing.zoom.toFixed(1)}×` }</span>
            </div>
            <input
                aria-label = { t('cameraPtz.zoom') }
                className = { classes.slider }
                disabled = { !zoomable }
                max = { ZOOM_RANGE.max }
                min = { ZOOM_RANGE.min }
                onChange = { onZoom }
                step = { ZOOM_STEP }
                type = 'range'
                value = { framing.zoom } />
            <div className = { classes.helper }>{ t('cameraPtz.framingHelp') }</div>
            <Button
                accessibilityLabel = { t('cameraPtz.reset') }
                fullWidth = { true }
                labelKey = 'cameraPtz.reset'
                onClick = { onReset }
                type = { BUTTON_TYPES.SECONDARY } />
        </div>
    );
};

export default CameraZoomControls;
