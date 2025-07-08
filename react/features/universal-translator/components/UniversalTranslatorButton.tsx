import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';
import ToolboxItem from '../../base/toolbox/components/ToolboxItem';
import { IconTranslate } from '../../base/icons/svg';

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
    }, [dispatch]);

    const handleKeyDown = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Enter' || e?.key === ' ') {
            handleClick();
        }
    }, [handleClick]);

    const isActive = universalTranslator?.showDialog || universalTranslator?.isRecording;
    const tooltip = universalTranslator?.isRecording 
        ? 'universalTranslator.recording' 
        : 'universalTranslator.tooltip';

    return (
        <ToolboxItem
            accessibilityLabel = 'universalTranslator.accessibilityLabel'
            icon = { IconTranslate }
            onClick = { handleClick }
            onKeyDown = { handleKeyDown }
            toggled = { isActive }
            tooltip = { tooltip }
            labelProps = {{}}
            i18n = { i18n }
            tReady = { tReady }
        />
    );
};

export default withTranslation()(UniversalTranslatorButton);