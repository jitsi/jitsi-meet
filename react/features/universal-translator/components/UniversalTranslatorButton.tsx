import React, { useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { IconTranslate } from '../../base/icons/svg';
import ToolboxItem from '../../base/toolbox/components/ToolboxItem';
import { toggleUniversalTranslator } from '../actions';
import { IUniversalTranslatorState } from '../reducer';

/**
 * Universal Translator toolbar button component.
 */
const UniversalTranslatorButton = ({ t, tReady, i18n }: WithTranslation) => {
    const dispatch = useDispatch();
    const universalTranslator: IUniversalTranslatorState = useSelector(
        (state: IReduxState) => state['features/universal-translator']
    );

    const handleClick = useCallback(() => {
        dispatch(toggleUniversalTranslator());
    }, [ dispatch ]);

    const handleKeyDown = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Enter' || e?.key === ' ') {
            handleClick();
        }
    }, [ handleClick ]);

    const isActive = universalTranslator?.showDialog || universalTranslator?.isRecording;
    const tooltip = universalTranslator?.isRecording
        ? 'universalTranslator.recording'
        : 'universalTranslator.tooltip';

    return (
        <ToolboxItem
            accessibilityLabel = 'universalTranslator.accessibilityLabel'
            i18n = { i18n }
            icon = { IconTranslate }
            labelProps = {{}}
            onClick = { handleClick }
            onKeyDown = { handleKeyDown }
            tReady = { tReady }
            toggled = { isActive }
            tooltip = { tooltip } />
    );
};

export default withTranslation()(UniversalTranslatorButton);
