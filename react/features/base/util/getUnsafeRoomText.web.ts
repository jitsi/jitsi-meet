import React from 'react';

import TranslationWithMarkup from '../i18n/components/web/TranslationWithMarkup';
import { createTranslationLink } from '../i18n/functions';

import { SECURITY_URL } from './contants';

/**
 * Gets the unsafe room text for the given context.
 *
 * @param {Function} t - The translation function.
 * @param {'meeting'|'prejoin'|'welcome'} context - The given context of the warning.
 * @returns {ReactElement}
 */
export default function getUnsafeRoomText(t: Function, context: 'meeting' | 'prejoin' | 'welcome') {
    const securityUrl = APP.store.getState()['features/base/config'].legalUrls?.security ?? SECURITY_URL;

    return React.createElement(TranslationWithMarkup, {
        components: [ createTranslationLink(securityUrl) ],
        i18nKey: 'security.insecureRoomNameWarningWeb',
        values: {
            recommendAction: t(`security.unsafeRoomActions.${context}`)
        }
    });
}
