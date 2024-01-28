/* eslint-disable lines-around-comment */
import { Theme } from '@mui/material';
import React, { useCallback, useEffect, useMemo } from 'react';
import { WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createDeepLinkingPageEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { IDeeplinkingConfig, IDeeplinkingMobileConfig } from '../../base/config/configType';
import { isSupportedMobileBrowser } from '../../base/environment/environment';
import { translate } from '../../base/i18n/functions';
import Platform from '../../base/react/Platform.web';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Button from '../../base/ui/components/web/Button';
import DialInSummary from '../../invite/components/dial-in-summary/web/DialInSummary';
import { openWebApp } from '../actions';
import { _TNS } from '../constants';
import { generateDeepLinkingURL } from '../functions';


const PADDINGS = {
    topBottom: 24,
    leftRight: 40
};

const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            background: '#1E1E1E',
            width: '100vw',
            height: '100dvh',
            overflowX: 'hidden',
            overflowY: 'auto',
            justifyContent: 'center',
            display: 'flex',
            '& a': {
                textDecoration: 'none'
            }
        },
        contentPane: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            padding: `${PADDINGS.topBottom}px ${PADDINGS.leftRight}px`,
            maxWidth: 410,
            color: theme.palette.text01
        },
        launchingMeetingLabel: {
            marginTop: 24,
            textAlign: 'center',
            marginBottom: 32,
            ...withPixelLineHeight(theme.typography.heading5)
        },
        roomNameLabel: {
            ...withPixelLineHeight(theme.typography.bodyLongRegularLarge)
        },
        joinMeetWrapper: {
            marginTop: 24,
            width: '100%'
        },
        labelDescription: {
            textAlign: 'center',
            marginTop: 16,
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
        },
        linkWrapper: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 8,
            width: '100%'
        },
        linkLabel: {
            color: theme.palette.link01,
            ...withPixelLineHeight(theme.typography.bodyLongBoldLarge)
        },
        supportedBrowserContent: {
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        },
        labelOr: {
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
        },
        separator: {
            marginTop: '32px',
            height: 1,
            width: `calc(100% + ${2 * PADDINGS.leftRight}px)`,
            background: theme.palette.ui03
        }
    };
});

const DeepLinkingMobilePage: React.FC<WithTranslation> = ({ t }) => {
    const deeplinkingCfg = useSelector((state: IReduxState) =>
        state['features/base/config']?.deeplinking || {} as IDeeplinkingConfig);
    const { hideLogo } = deeplinkingCfg;
    const deepLinkingUrl: string = useSelector(generateDeepLinkingURL);
    const room = useSelector((state: IReduxState) => decodeURIComponent(state['features/base/conference'].room || ''));
    const url = useSelector((state: IReduxState) => state['features/base/connection'] || {});
    const dispatch = useDispatch();
    const { classes: styles } = useStyles();

    const generateDownloadURL = useCallback(() => {
        const { downloadLink, dynamicLink, appScheme }
            = (deeplinkingCfg?.[Platform.OS as keyof typeof deeplinkingCfg] || {}) as IDeeplinkingMobileConfig;

        if (downloadLink && typeof dynamicLink === 'undefined') {
            return downloadLink;
        }

        const {
            apn,
            appCode,
            customDomain,
            ibi,
            isi
        } = dynamicLink || {};

        const domain = customDomain ?? `https://${appCode}.app.goo.gl`;

        return `${domain}/?link=${
            encodeURIComponent(window.location.href)}&apn=${
            apn}&ibi=${
            ibi}&isi=${
            isi}&ius=${
            appScheme}&efr=1`;
    }, [ deeplinkingCfg ]);

    const onDownloadApp = useCallback(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'downloadAppButton', { isMobileBrowser: true }));
    }, []);

    const onLaunchWeb = useCallback(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'launchWebButton', { isMobileBrowser: true }));
        dispatch(openWebApp());
    }, []);

    const onOpenApp = useCallback(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'openAppButton', { isMobileBrowser: true }));
    }, []);

    const onOpenLinkProperties = useMemo(() => {
        const { downloadLink }
            = (deeplinkingCfg?.[Platform.OS as keyof typeof deeplinkingCfg] || {}) as IDeeplinkingMobileConfig;

        if (downloadLink) {
            return {
                // When opening a link to the download page, we want to let the
                // OS itself handle intercepting and opening the appropriate
                // app store. This avoids potential issues with browsers, such
                // as iOS Chrome, not opening the store properly.
            };
        }

        return {
            // When falling back to another URL (Firebase) let the page be
            // opened in a new window. This helps prevent the user getting
            // trapped in an app-open-cycle where going back to the mobile
            // browser re-triggers the app-open behavior.
            target: '_blank',
            rel: 'noopener noreferrer'
        };
    }, [ deeplinkingCfg ]);

    useEffect(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'displayed', 'DeepLinkingMobile', { isMobileBrowser: true }));
    }, []);


    return (
        <div className = { styles.container }>
            <div className = { styles.contentPane }>
                {!hideLogo && (<img
                    alt = { t('welcomepage.logo.logoDeepLinking') }
                    src = 'images/logo-deep-linking-mobile.png' />
                )}

                <div className = { styles.launchingMeetingLabel }>{ t(`${_TNS}.launchMeetingLabel`) }</div>
                <div className = ''>{room}</div>
                <a
                    { ...onOpenLinkProperties }
                    className = { styles.joinMeetWrapper }
                    href = { deepLinkingUrl }
                    onClick = { onOpenApp }
                    target = '_top'>
                    <Button
                        fullWidth = { true }
                        label = { t(`${_TNS}.joinInAppNew`) } />
                </a>
                <div className = { styles.labelDescription }>{ t(`${_TNS}.noMobileApp`) }</div>
                <a
                    { ...onOpenLinkProperties }
                    className = { styles.linkWrapper }
                    href = { generateDownloadURL() }
                    onClick = { onDownloadApp }
                    target = '_top'>
                    <div className = { styles.linkLabel }>{ t(`${_TNS}.downloadMobileApp`) }</div>
                </a>
                {isSupportedMobileBrowser() ? (
                    <div className = { styles.supportedBrowserContent }>
                        <div className = { styles.labelOr }>{ t(`${_TNS}.or`) }</div>
                        <a
                            className = { styles.linkWrapper }
                            onClick = { onLaunchWeb }
                            target = '_top'>
                            <div className = { styles.linkLabel }>{ t(`${_TNS}.joinInBrowser`) }</div>
                        </a>
                    </div>
                ) : (
                    <div className = { styles.labelDescription }>
                        {t(`${_TNS}.unsupportedBrowser`)}
                    </div>
                )}
                <div className = { styles.separator } />
                <DialInSummary
                    className = 'deep-linking-dial-in'
                    clickableNumbers = { true }
                    hideError = { true }
                    room = { room }
                    url = { url } />
            </div>
        </div>
    );
};

export default translate(DeepLinkingMobilePage);
