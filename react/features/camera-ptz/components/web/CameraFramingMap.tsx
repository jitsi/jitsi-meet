import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { PAN_TILT_RANGE } from '../../constants';
import { IPTZValues } from '../../types';

interface IProps {

    /**
     * Where the camera has been asked to go, while it is still travelling there.
     */
    commanded?: IPTZValues;

    /**
     * Where the camera is now.
     */
    framing: Required<IPTZValues>;

    /**
     * Called with the pan and tilt the user framed.
     */
    onChange: (pan: number, tilt: number) => void;

    /**
     * Whether the camera can be panned or tilted at all.
     */
    pannable: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: '8px',
            minWidth: 0
        },

        caption: {
            color: theme.palette.text03,
            ...theme.typography.labelBold
        },

        map: {
            position: 'relative',
            aspectRatio: '16 / 9',
            width: '100%',
            border: `1px solid ${theme.palette.ui03}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            backgroundColor: theme.palette.uiBackground,
            backgroundImage: `linear-gradient(${theme.palette.ui02} 1px, transparent 1px),
                linear-gradient(90deg, ${theme.palette.ui02} 1px, transparent 1px)`,
            backgroundSize: '12.5% 12.5%',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: 'grab'
        },

        disabled: {
            cursor: 'default',
            opacity: 0.5
        },

        rect: {
            position: 'absolute',
            border: `2px solid ${theme.palette.action01}`,
            borderRadius: '4px',
            boxShadow: '0 0 0 9999px rgba(4, 4, 4, .5)',
            pointerEvents: 'none'
        },

        ghost: {
            position: 'absolute',
            border: `2px dashed ${theme.palette.warning01}`,
            borderRadius: '4px',
            pointerEvents: 'none'
        },

        legend: {
            color: theme.palette.text02,
            display: 'flex',
            gap: '16px',
            ...theme.typography.bodyShortRegularSmall
        },

        legendEntry: {
            alignItems: 'center',
            display: 'flex',
            gap: '4px'
        },

        nowSwatch: {
            border: `2px solid ${theme.palette.action01}`,
            height: '9px',
            width: '14px'
        },

        commandedSwatch: {
            border: `2px dashed ${theme.palette.warning01}`,
            height: '9px',
            width: '14px'
        }
    };
});

/**
 * Draws the whole field of view with the current framing on it, and turns a drag into the framing the user wants.
 * The rectangle covers the fraction of the field of view the current zoom leaves visible.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element}
 */
const CameraFramingMap = ({ commanded, framing, onChange, pannable }: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const mapRef = useRef<HTMLDivElement>(null);

    const size = 100 / framing.zoom;
    const position = (values: Required<IPTZValues>) => {
        const span = PAN_TILT_RANGE.max - PAN_TILT_RANGE.min;

        return {
            height: `${size}%`,
            left: `${((values.pan - PAN_TILT_RANGE.min) / span) * (100 - size)}%`,
            top: `${((PAN_TILT_RANGE.max - values.tilt) / span) * (100 - size)}%`,
            width: `${size}%`
        };
    };

    const frameAt = useCallback((event: React.PointerEvent) => {
        const bounds = mapRef.current?.getBoundingClientRect();

        if (!bounds) {
            return;
        }

        // The pointer marks the centre of the wanted framing, so the reachable range shrinks as the framing grows.
        const reach = 1 - (size / 100);
        const span = PAN_TILT_RANGE.max - PAN_TILT_RANGE.min;
        const ratioX = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
        const ratioY = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);

        onChange(
            reach ? PAN_TILT_RANGE.min + (((ratioX - 0.5) / reach + 0.5) * span) : 0,
            reach ? PAN_TILT_RANGE.max - (((ratioY - 0.5) / reach + 0.5) * span) : 0);
    }, [ onChange, size ]);

    const onPointerDown = useCallback((event: React.PointerEvent) => {
        if (!pannable) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        frameAt(event);
    }, [ frameAt, pannable ]);

    const onPointerMove = useCallback((event: React.PointerEvent) => {
        pannable && event.currentTarget.hasPointerCapture(event.pointerId) && frameAt(event);
    }, [ frameAt, pannable ]);

    return (
        <div className = { classes.container }>
            <div className = { classes.caption }>{ t('cameraPtz.fieldOfView') }</div>
            <div
                className = { cx(classes.map, !pannable && classes.disabled) }
                onPointerDown = { onPointerDown }
                onPointerMove = { onPointerMove }
                ref = { mapRef }>
                <div
                    className = { classes.rect }
                    style = { position(framing) } />
                { commanded && <div
                    className = { classes.ghost }
                    style = { position({ ...framing,
                        ...commanded }) } /> }
            </div>
            <div className = { classes.legend }>
                <span className = { classes.legendEntry }>
                    <span className = { classes.nowSwatch } />
                    { t('cameraPtz.now') }
                </span>
                <span className = { classes.legendEntry }>
                    <span className = { classes.commandedSwatch } />
                    { t('cameraPtz.commanded') }
                </span>
            </div>
        </div>
    );
};

export default CameraFramingMap;
