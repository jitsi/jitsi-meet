import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import {
    armActivation,
    cancelActivation
} from '../../../orbit-bridge/controller';
import { useOrbitBridgeConfig, useOrbitBridgeState } from '../../../orbit-bridge/hooks';

interface IProps {
    visible?: boolean;
}

const OrbitBridgeListenButton = ({ visible = true }: IProps) => {
    useOrbitBridgeConfig();
    const bridgeState = useOrbitBridgeState();
    const inMeeting = useSelector((state: IReduxState) => Boolean(state['features/base/conference'].conference));

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (bridgeState.activated) {
            return;
        }
        if (event.button !== 0 && event.pointerType !== 'touch') {
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        armActivation();
    }, [ bridgeState.activated ]);

    const onPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        cancelActivation();
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (err) {
            // Ignore pointer capture errors.
        }
    }, []);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (bridgeState.activated) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            armActivation();
        }
    }, [ bridgeState.activated ]);

    const onKeyUp = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            cancelActivation();
        }
    }, []);

    if (!visible || !inMeeting) {
        return null;
    }

    const iconClasses = [
        'toolbox-icon',
        'orbit-bridge-icon',
        'orbit-bridge-listen',
        bridgeState.activated ? 'is-active' : '',
        bridgeState.activationPending ? 'is-arming' : '',
        bridgeState.isTalking ? 'is-talking' : '',
        bridgeState.isSpeaker ? 'is-speaking' : '',
        bridgeState.supernova ? 'is-supernova' : '',
        bridgeState.connectionStatus === 'error' ? 'is-error' : ''
    ].filter(Boolean).join(' ');

    const orbStyle = {
        '--orb-hue': String(Math.round(bridgeState.orbHue)),
        '--orb-scale': String(bridgeState.orbScale.toFixed(3))
    } as React.CSSProperties;

    return (
        <div className = 'toolbox-button orbit-bridge-button'>
            <Tooltip
                content = 'Listening'
                position = 'top'>
                <div
                    aria-disabled = { bridgeState.activated }
                    aria-label = 'Activate listening'
                    aria-pressed = { bridgeState.activated }
                    className = { iconClasses }
                    onKeyDown = { onKeyDown }
                    onKeyUp = { onKeyUp }
                    onPointerCancel = { onPointerEnd }
                    onPointerDown = { onPointerDown }
                    onPointerLeave = { onPointerEnd }
                    onPointerUp = { onPointerEnd }
                    role = 'button'
                    style = { orbStyle }
                    tabIndex = { bridgeState.activated ? -1 : 0 }>
                </div>
            </Tooltip>
            {bridgeState.activated && (
                <span className = 'orbit-bridge-label'>Listening</span>
            )}
        </div>
    );
};

export default OrbitBridgeListenButton;
