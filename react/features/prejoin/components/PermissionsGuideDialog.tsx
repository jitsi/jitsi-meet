import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Dialog from '../../base/ui/components/web/Dialog';
import { detectBrowserAndDevice } from '../utils';

import TuneIcon from './TuneIcon';

const styles = {
    ol: {
        paddingLeft: 20,
        marginTop: 16
    },
    li: {
        marginBottom: 8
    },
    details: {
        marginTop: 24,
        borderRadius: 8,
        padding: 12
    } as React.CSSProperties,
    summary: {
        cursor: 'pointer',
        fontWeight: 500,
        color: '#007bff'
    },
    deviceHelp: {
        marginTop: 12,
        paddingLeft: 8
    },
    gifContainer: {
        marginTop: 24
    },
    gifImage: {
        maxWidth: '100%',
        borderRadius: 8
    }
};

type Props = {
    onClose: () => void;
};

const PermissionsGuideDialog = ({ onClose }: Props) => {
    const { t } = useTranslation();
    const [ browser, setBrowser ] = useState('Unknown');
    const [ device, setDevice ] = useState('Unknown');

    useEffect(() => {
        Promise.resolve(detectBrowserAndDevice()).then(({ browser: b, device: d }) => {
            setBrowser(b);
            setDevice(d);
        });
    }, []);

    const handleSubmit = useCallback(() => {
        window.location.reload();
    }, []);

    const renderInstructions = () => {
        const key = `prejoin.permissionsGuide.steps.${browser}_${device}`;
        const fallbackKey = 'prejoin.permissionsGuide.steps.default';

        const steps: string[]
            = t(key, { returnObjects: true, defaultValue: [] }) || t(fallbackKey, { returnObjects: true });

        const renderWithTuneIcon = (text: string) => {
            const parts = text.split(/(<0>Tune<\/0>)/g);

            return parts.map((part, idx) => {
                if (part === '<0>Tune</0>') {
                    return <TuneIcon key = { idx } />;
                }

                return <React.Fragment key = { idx }>{part}</React.Fragment>;
            });
        };

        return (
            <ol style = { styles.ol }>
                {steps.map((step, idx) => (
                    <li
                        key = { idx }
                        style = { styles.li }>
                        {renderWithTuneIcon(step)}
                    </li>
                ))}
            </ol>
        );
    };

    const renderDeviceHelp = () => {
        if (device !== 'Android' && device !== 'iOS') {
            return null;
        }

        const steps: string[] = t(`prejoin.permissionsGuide.deviceHelp.${device}`, { returnObjects: true });

        if (!steps?.length) {
            return null;
        }

        return (
            <details style = { styles.details }>
                <summary style = { styles.summary }>
                    {t('prejoin.permissionsGuide.stillNotWorking')}
                </summary>
                <div style = { styles.deviceHelp }>
                    <ol style = { styles.ol }>
                        {steps.map((step, idx) => (
                            <li
                                key = { idx }
                                style = { styles.li }>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            </details>
        );
    };

    const renderGif = () => {
        const isDesktop = [ 'Windows', 'macOS', 'Linux' ].includes(device);

        return (
            <div style = { styles.gifContainer }>
                <img
                    alt = { `Camera and microphone permissions guide for ${device}` }
                    src = { `images/permissions_guide_${isDesktop ? 'desktop' : 'mobile'}.gif` }
                    style = { styles.gifImage } />
            </div>
        );
    };

    return (
        <Dialog
            cancel = {{ translationKey: 'prejoin.permissionsGuide.close' }}
            onCancel = { onClose }
            onSubmit = { handleSubmit }
            submit = { handleSubmit }
            titleKey = 'prejoin.permissionsGuide.title'>
            <div className = 'prejoin-permissions-dialog'>
                <p>
                    <strong>{t('prejoin.permissionsGuide.detected')}</strong> {browser} on {device}
                </p>
                <h4>{t('prejoin.permissionsGuide.howToAllow')}</h4>
                {renderInstructions()}
                {renderDeviceHelp()}
                {renderGif()}
            </div>
        </Dialog>
    );
};

export default PermissionsGuideDialog;
