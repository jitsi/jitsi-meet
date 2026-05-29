import React from 'react';
import { Text } from 'react-native';

import { IReduxState } from '../../app/types';
import { getSecurityUrl } from '../config/functions.any';
import Link from '../react/components/native/Link';
import BaseTheme from '../ui/components/BaseTheme.native';

/**
 * Gets the unsafe room text for the given context.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Function} t - The translation function.
 * @param {'meeting'|'prejoin'|'welcome'} context - The given context of the warning.
 * @returns {Text}
 */
export default function getUnsafeRoomText(state: IReduxState, t: Function, context: 'meeting' | 'prejoin' | 'welcome') {
    const securityUrl = getSecurityUrl(state);
    const link = React.createElement(Link, {
        url: securityUrl,
        children: 'here',
        key: 'support-link',
        style: { color: BaseTheme.palette.action01 } });

    const options = {
        recommendAction: t(`security.unsafeRoomActions.${context}`)
    };

    return React.createElement(Text, { children: [ t('security.insecureRoomNameWarningNative', options), link, '.' ] });
}
