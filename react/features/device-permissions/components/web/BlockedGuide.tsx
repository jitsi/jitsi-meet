import { alpha } from '@mui/material/styles';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconMicSlash, IconSliders, IconVideoOff } from '../../../base/icons/svg';
import { CaptureKind, BlockedGuide as Guide, getBrowserNames, getKeySuffix } from '../../functions';

interface IProps {

    /**
     * The guide to show.
     */
    guide: Guide;

    /**
     * The blocked devices.
     */
    kinds: CaptureKind[];
}

const CROSSED_OUT_ICONS = {
    audio: IconMicSlash,
    video: IconVideoOff
};

const useStyles = makeStyles()(theme => {
    return {
        address: {
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        addressBar: {
            ...theme.typography.labelRegular,
            alignItems: 'center',
            backgroundColor: theme.palette.ui02,
            color: theme.palette.text02,
            display: 'flex',
            gap: theme.spacing(2),
            height: '30px',
            overflow: 'hidden',
            padding: `0 ${theme.spacing(1)}`,
            whiteSpace: 'nowrap'
        },
        appIcon: {
            border: `1px dashed ${theme.palette.text03}`,
            borderRadius: '50%',
            boxSizing: 'border-box',
            flex: 'none',
            height: '18px',
            width: '18px'
        },
        chip: {
            ...theme.typography.labelBold,
            backgroundColor: theme.palette.ui02,
            borderRadius: '4px',
            color: theme.palette.text01,
            padding: '3px 8px'
        },
        chips: {
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
        },
        chromiumAddressBar: {
            borderRadius: '15px'
        },
        chromiumSiteControls: {
            alignItems: 'center',
            backgroundColor: theme.palette.action01,
            borderRadius: '50%',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.action01, 0.35)}`,
            display: 'flex',
            flex: 'none',
            height: '24px',
            justifyContent: 'center',
            width: '24px'
        },
        firefoxAddressBar: {
            borderRadius: '6px'
        },
        firefoxBlockedIcon: {
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.actionDanger, 0.2),
            borderRadius: '4px',
            boxShadow: `0 0 0 2px ${theme.palette.actionDanger}`,
            display: 'flex',
            flex: 'none',
            height: '22px',
            justifyContent: 'center',
            width: '24px'
        },
        firefoxPageIcon: {
            border: `1px solid ${theme.palette.text03}`,
            borderRadius: '3px',
            flex: 'none',
            height: '12px',
            width: '12px'
        },
        inset: {
            backgroundColor: theme.palette.uiBackground,
            border: `1px solid ${theme.palette.ui02}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            display: 'flex',
            flexDirection: 'column'
        },
        insetPadded: {
            gap: '6px',
            padding: '14px'
        },
        number: {
            ...theme.typography.labelBold,
            alignItems: 'center',
            backgroundColor: theme.palette.ui03,
            borderRadius: '50%',
            color: theme.palette.text01,
            display: 'flex',
            flex: 'none',
            height: '24px',
            justifyContent: 'center',
            width: '24px'
        },
        row: {
            ...theme.typography.bodyShortRegular,
            alignItems: 'center',
            color: theme.palette.text01,
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between',
            padding: '8px 12px',

            '& + &': {
                borderTop: `1px solid ${theme.palette.ui02}`
            }
        },
        rowLabel: {
            alignItems: 'center',
            display: 'flex',
            gap: theme.spacing(2)
        },
        select: {
            ...theme.typography.labelBold,
            backgroundColor: theme.palette.ui03,
            borderRadius: '4px',
            padding: '2px 8px 2px 10px'
        },
        separator: {
            color: theme.palette.text03
        },
        sitePopover: {
            ...theme.typography.labelBold,
            alignItems: 'center',
            backgroundColor: theme.palette.ui10,
            borderRadius: `${theme.shape.borderRadius}px`,
            boxSizing: 'border-box',
            color: theme.palette.text04,
            display: 'flex',
            justifyContent: 'space-between',
            marginLeft: theme.spacing(1),
            padding: '10px 12px',
            width: '220px'
        },
        step: {
            display: 'flex',
            gap: '12px'
        },
        stepContent: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.text01,
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: theme.spacing(2),
            minWidth: 0
        },
        steps: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(3),
            listStyle: 'none',
            margin: 0,
            padding: 0
        },
        switch: {
            borderRadius: '10px',
            flex: 'none',
            height: '20px',
            position: 'relative',
            width: '34px',

            '&::after': {
                backgroundColor: theme.palette.switchToggle,
                borderRadius: '50%',
                content: '""',
                height: '16px',
                position: 'absolute',
                right: '2px',
                top: '2px',
                width: '16px'
            }
        },
        switchMac: {
            backgroundColor: theme.palette.success01
        },
        switchOn: {
            backgroundColor: theme.palette.switchBackgroundOn
        },
        warning: {
            ...theme.typography.labelRegular,
            color: theme.palette.warning01
        }
    };
});

/**
 * Shows the steps for unblocking the microphone or the camera, with pictures of the settings to change.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const BlockedGuide = ({ guide, kinds }: IProps) => {
    const { classes, cx, theme } = useStyles();
    const { t } = useTranslation();
    const names = getBrowserNames();
    const domain = window.location.host;
    const address = `${domain}${window.location.pathname}`;
    const devices = kinds.map(kind => {
        const suffix = getKeySuffix([ kind ]);

        return {
            device: t(`mediaPermissions.device${suffix}`),
            kind,
            pane: t(`mediaPermissions.pane${suffix}`)
        };
    });
    const allDevices = t(`mediaPermissions.device${getKeySuffix(kinds)}`);
    const tryAgain = t('mediaPermissions.blocked.tryAgainStep');

    const renderSwitch = (className: string) => <span className = { cx(classes.switch, className) } />;
    const renderPath = (first: string, second: string) => (
        <div className = { classes.chips }>
            <span className = { classes.chip }>{ first }</span>
            <span className = { classes.separator }>›</span>
            <span className = { classes.chip }>{ second }</span>
        </div>
    );
    const renderPaths = (first: string) =>
        devices.map(({ kind, pane }) => <div key = { kind }>{ renderPath(first, pane) }</div>);

    let steps: Array<{ extra?: ReactNode; text: string; }> = [];
    let picture: ReactNode;

    switch (guide) {
    case 'osMac':
        steps = [ {
            extra: renderPaths(t('mediaPermissions.blocked.osMac.privacy')),
            text: t('mediaPermissions.blocked.osMac.step1')
        }, {
            extra: names && (
                <div
                    aria-hidden = { true }
                    className = { classes.inset }>
                    <div className = { classes.row }>
                        <span className = { classes.rowLabel }>
                            <span className = { classes.appIcon } />
                            { names.app }
                        </span>
                        { renderSwitch(classes.switchMac) }
                    </div>
                </div>
            ),
            text: names
                ? t('mediaPermissions.blocked.osMac.step2', { app: names.app })
                : t('mediaPermissions.blocked.osMac.step2Generic')
        }, {
            text: names
                ? t('mediaPermissions.blocked.osMac.step3', { browser: names.name })
                : t('mediaPermissions.blocked.osMac.step3Generic')
        } ];
        break;
    case 'osWindows':
        steps = [ {
            extra: renderPaths(t('mediaPermissions.blocked.osWindows.privacy')),
            text: t('mediaPermissions.blocked.osWindows.step1')
        }, {
            extra: (
                <div
                    aria-hidden = { true }
                    className = { classes.inset }>
                    { devices.map(({ device, kind, pane }) => (
                        <React.Fragment key = { kind }>
                            <div className = { classes.row }>
                                { t('mediaPermissions.blocked.osWindows.deviceAccess', { pane }) }
                                { renderSwitch(classes.switchOn) }
                            </div>
                            <div className = { classes.row }>
                                { t('mediaPermissions.blocked.osWindows.desktopApps', { device }) }
                                { renderSwitch(classes.switchOn) }
                            </div>
                        </React.Fragment>
                    )) }
                </div>
            ),
            text: t('mediaPermissions.blocked.osWindows.step2')
        }, {
            text: tryAgain
        } ];
        break;
    case 'osOther':
        steps = [ {
            text: t('mediaPermissions.blocked.osOther.step1', { device: allDevices })
        }, {
            text: tryAgain
        } ];
        break;
    case 'browserChromium':
        picture = (
            <div
                aria-hidden = { true }
                className = { cx(classes.inset, classes.insetPadded) }>
                <div className = { cx(classes.addressBar, classes.chromiumAddressBar) }>
                    <span className = { classes.chromiumSiteControls }>
                        <Icon
                            color = { theme.palette.icon01 }
                            size = { 14 }
                            src = { IconSliders } />
                    </span>
                    <span className = { classes.address }>{ address }</span>
                </div>
                { devices.map(({ kind, pane }) => (
                    <div
                        className = { classes.sitePopover }
                        key = { kind }>
                        { pane }
                        { renderSwitch(classes.switchOn) }
                    </div>
                )) }
            </div>
        );
        steps = [ {
            text: t('mediaPermissions.blocked.browserChromium.step1', {
                device: allDevices,
                domain
            })
        }, {
            text: tryAgain
        } ];
        break;
    case 'browserFirefox':
        picture = (
            <div
                aria-hidden = { true }
                className = { cx(classes.inset, classes.insetPadded) }>
                <div className = { cx(classes.addressBar, classes.firefoxAddressBar) }>
                    <span className = { classes.firefoxPageIcon } />
                    { devices.map(({ kind }) => (
                        <span
                            className = { classes.firefoxBlockedIcon }
                            key = { kind }>
                            <Icon
                                color = { theme.palette.textError }
                                size = { 14 }
                                src = { CROSSED_OUT_ICONS[kind] } />
                        </span>
                    )) }
                    <span className = { classes.address }>{ address }</span>
                </div>
            </div>
        );
        steps = [ {
            text: kinds.length > 1
                ? t('mediaPermissions.blocked.browserFirefox.step1Both')
                : t('mediaPermissions.blocked.browserFirefox.step1', { device: allDevices })
        }, {
            text: tryAgain
        } ];
        break;
    case 'browserSafari':
        steps = [ {
            extra: renderPath(
                t('mediaPermissions.blocked.browserSafari.menuSafari'),
                t('mediaPermissions.blocked.browserSafari.menuSiteSettings', { domain })),
            text: t('mediaPermissions.blocked.browserSafari.step1')
        }, {
            extra: (
                <>
                    <div
                        aria-hidden = { true }
                        className = { classes.inset }>
                        { [ 'paneVideo', 'paneAudio' ].map(pane => (
                            <div
                                className = { classes.row }
                                key = { pane }>
                                { t(`mediaPermissions.${pane}`) }
                                <span className = { classes.select }>
                                    { `${t('mediaPermissions.blocked.browserSafari.allow')} ⌄` }
                                </span>
                            </div>
                        )) }
                    </div>
                    <div className = { classes.warning }>
                        { t('mediaPermissions.blocked.browserSafari.askWarning') }
                    </div>
                </>
            ),
            text: t('mediaPermissions.blocked.browserSafari.step2')
        }, {
            text: tryAgain
        } ];
        break;
    }

    return (
        <>
            { picture }
            <ol className = { classes.steps }>
                { steps.map(({ extra, text }, index) => (
                    <li
                        className = { classes.step }
                        key = { index }>
                        <span
                            aria-hidden = { true }
                            className = { classes.number }>
                            { index + 1 }
                        </span>
                        <div className = { classes.stepContent }>
                            <span>{ text }</span>
                            { extra }
                        </div>
                    </li>
                )) }
            </ol>
        </>
    );
};

export default BlockedGuide;
