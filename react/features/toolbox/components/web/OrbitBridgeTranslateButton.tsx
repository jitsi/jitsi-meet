import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import {
    setTargetLanguage,
    toggleBridge
} from '../../../orbit-bridge/controller';
import { useOrbitBridgeConfig, useOrbitBridgeState } from '../../../orbit-bridge/hooks';

interface IProps {
    visible?: boolean;
}

const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'tl', label: 'Tagalog' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'pt-BR', label: 'Portuguese' }
];

const OrbitBridgeTranslateButton = ({ visible = true }: IProps) => {
    useOrbitBridgeConfig();
    const bridgeState = useOrbitBridgeState();
    const inMeeting = useSelector((state: IReduxState) => Boolean(state['features/base/conference'].conference));

    const onClick = useCallback(() => {
        if (bridgeState.connectionStatus === 'connecting') {
            return;
        }
        toggleBridge();
    }, [ bridgeState.connectionStatus ]);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    const onLanguageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        setTargetLanguage(event.target.value);
    }, []);

    if (!visible || !inMeeting) {
        return null;
    }

    const iconClasses = [
        'toolbox-icon',
        'orbit-bridge-icon',
        'orbit-bridge-translate',
        bridgeState.bridgeEnabled ? 'is-active' : '',
        bridgeState.ttsActive ? 'is-tts' : '',
        bridgeState.connectionStatus === 'error' ? 'is-error' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className = 'toolbox-button orbit-bridge-button orbit-bridge-translate-wrap'>
            <Tooltip
                content = 'Translate'
                position = 'top'>
                <div
                    aria-disabled = { bridgeState.connectionStatus === 'connecting' }
                    aria-label = 'Enable translation'
                    aria-pressed = { bridgeState.bridgeEnabled }
                    className = { iconClasses }
                    onClick = { onClick }
                    onKeyDown = { onKeyDown }
                    role = 'button'
                    tabIndex = { 0 }>
                </div>
            </Tooltip>
            {bridgeState.bridgeEnabled && (
                <span className = 'orbit-bridge-label'>Translate</span>
            )}
            {bridgeState.bridgeEnabled && (
                <div className = 'orbit-bridge-language'>
                    <select
                        aria-label = 'Target language'
                        onChange = { onLanguageChange }
                        value = { bridgeState.targetLanguage }>
                        {languageOptions.map((option) => (
                            <option
                                key = { option.code }
                                value = { option.code }>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default OrbitBridgeTranslateButton;
