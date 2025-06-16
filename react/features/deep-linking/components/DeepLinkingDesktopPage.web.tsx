import { Theme } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createDeepLinkingPageEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { IDeeplinkingConfig } from '../../base/config/configType';
import { getLegalUrls } from '../../base/config/functions.any';
import { isSupportedBrowser } from '../../base/environment/environment';
import { translate, translateToHTML } from '../../base/i18n/functions';
import Platform from '../../base/react/Platform.web';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.any';
import {
    openDesktopApp,
    openWebApp
} from '../actions';
import { _TNS } from '../constants';

const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            background: '#1E1E1E',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            display: 'flex'
        },
        contentPane: {
            display: 'flex',
            flexDirection: 'column',
            background: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui03}`,
            padding: 40,
            borderRadius: 16,
            maxWidth: 410,
            color: theme.palette.text01
        },
        logo: {
            marginBottom: 32
        },
        launchingMeetingLabel: {
            marginBottom: 16,
            ...withPixelLineHeight(theme.typography.heading4)
        },
        roomName: {
            marginBottom: 32,
            ...withPixelLineHeight(theme.typography.heading5)
        },
        descriptionLabel: {
            marginBottom: 32,
            ...withPixelLineHeight(theme.typography.bodyLongRegular)
        },
        buttonsContainer: {
            display: 'flex',
            justifyContent: 'flex-start',
            '& > *:not(:last-child)': {
                marginRight: 16
            }
        },
        separator: {
            marginTop: 40,
            height: 1,
            maxWidth: 390,
            background: theme.palette.ui03
        },
        label: {
            marginTop: 40,
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text02,
            '& a': {
                color: theme.palette.link01
            }
        }
    };
});

const DeepLinkingDesktopPage: React.FC<WithTranslation> = ({ t }) => {
    const dispatch = useDispatch();
    const room = useSelector((state: IReduxState) => decodeURIComponent(state['features/base/conference'].room || ''));
    const deeplinkingCfg = useSelector((state: IReduxState) =>
        state['features/base/config']?.deeplinking || {} as IDeeplinkingConfig);

    const generateDownloadURL = useCallback(() => {
        const downloadCfg = deeplinkingCfg.desktop?.download;

        if (downloadCfg) {
            return downloadCfg[Platform.OS as keyof typeof downloadCfg];
        }
    }, [ deeplinkingCfg ]);

    const legalUrls = useSelector(getLegalUrls);

    const { hideLogo, desktop } = deeplinkingCfg;

    const { classes: styles } = useStyles();
    const onLaunchWeb = useCallback(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'launchWebButton', { isMobileBrowser: false }));
        dispatch(openWebApp());
    }, []);
    const onTryAgain = useCallback(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'clicked', 'tryAgainButton', { isMobileBrowser: false }));
        dispatch(openDesktopApp());
    }, []);

    useEffect(() => {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'displayed', 'DeepLinkingDesktop', { isMobileBrowser: false }));
    }, []);

    return (
        <div className = { styles.container }>
            <div className = { styles.contentPane }>
                <div className = 'header'>
                    {
                        !hideLogo
                            && <img
                                alt = { t('welcomepage.logo.logoDeepLinking') }
                                className = { styles.logo }
                                src = 'images/logo-deep-linking.png' />
                    }
                </div>
                <div className = { styles.launchingMeetingLabel }>
                    {
                        t(`${_TNS}.titleNew`)
                    }
                </div>
                <div className = { styles.roomName }>{ room }</div>
                <div className = { styles.descriptionLabel }>
                    {
                        isSupportedBrowser()
                            ? translateToHTML(t, `${_TNS}.descriptionNew`, { app: desktop?.appName })
                            : t(`${_TNS}.descriptionWithoutWeb`, { app: desktop?.appName })
                    }
                </div>
                <div className = { styles.descriptionLabel }>
                    {
                        t(`${_TNS}.noDesktopApp`)
                    } &nbsp;
                    <a href = { generateDownloadURL() }>
                        {
                            t(`${_TNS}.downloadApp`)
                        }
                    </a>
                </div>
                <div className = { styles.buttonsContainer }>
                    <Button
                        label = { t(`${_TNS}.tryAgainButton`) }
                        onClick = { onTryAgain } />
                    { isSupportedBrowser() && (
                        <Button
                            label = { t(`${_TNS}.launchWebButton`) }
                            onClick = { onLaunchWeb }
                            type = { BUTTON_TYPES.SECONDARY } />
                    )}

                </div>
                <div className = { styles.separator } />
                <div className = { styles.label }> {translateToHTML(t, 'deepLinking.termsAndConditions', {
                    termsAndConditionsLink: legalUrls.terms
                })}
                </div>
            </div>
        </div>
    );
};

export default translate(DeepLinkingDesktopPage);
