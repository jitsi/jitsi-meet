import React, { ComponentType, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { hideDialog } from '../../../dialog/actions';
import { IconArrowBack, IconCloseLarge } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';

import BaseDialog, { IProps as IBaseProps } from './BaseDialog';
import Button from './Button';
import ClickableIcon from './ClickableIcon';
import ContextMenuItem from './ContextMenuItem';

const MOBILE_BREAKPOINT = 607;

const useStyles = makeStyles()(theme => {
    return {
        dialog: {
            flexDirection: 'row',
            height: '560px',

            '@media (min-width: 608px) and (max-width: 712px)': {
                width: '560px'
            },

            [`@media (max-width: ${MOBILE_BREAKPOINT}px)`]: {
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0
            },

            '@media (max-width: 448px)': {
                height: '100%'
            }
        },

        sidebar: {
            display: 'flex',
            flexDirection: 'column',
            minWidth: '211px',
            maxWidth: '100%',
            borderRight: `1px solid ${theme.palette.ui03}`,

            [`@media (max-width: ${MOBILE_BREAKPOINT}px)`]: {
                width: '100%',
                borderRight: 'none'
            }
        },

        menuItemMobile: {
            paddingLeft: '24px'
        },

        titleContainer: {
            margin: 0,
            padding: '24px',
            paddingRight: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',

            [`@media (max-width: ${MOBILE_BREAKPOINT}px)`]: {
                padding: '16px 24px'
            }
        },

        title: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: `${theme.palette.text01} !important`,
            margin: 0,
            padding: 0
        },

        contentContainer: {
            position: 'relative',
            display: 'flex',
            padding: '24px',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',

            [`@media (max-width: ${MOBILE_BREAKPOINT}px)`]: {
                padding: '0'
            }
        },

        buttonContainer: {
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexGrow: 0,

            [`@media (max-width: ${MOBILE_BREAKPOINT}px)`]: {
                justifyContent: 'space-between',
                padding: '16px 24px'
            }
        },

        backContainer: {
            display: 'flex',
            alignItems: 'center',

            '& > button': {
                marginRight: '24px'
            }
        },

        closeIcon: {
            '&:focus': {
                boxShadow: 'none'
            }
        },

        content: {
            flexGrow: 1,
            overflowY: 'auto',
            width: '100%',
            boxSizing: 'border-box',

            [`@media (max-width: ${MOBILE_BREAKPOINT}px)`]: {
                padding: '0 24px'
            }
        },

        footer: {
            justifyContent: 'flex-end',

            '& button:last-child': {
                marginLeft: '16px'
            }
        }
    };
});

interface IObject {
    [key: string]: string | string[] | boolean | number | number[] | {} | undefined;
}

export interface IDialogTab {
    className?: string;
    component: ComponentType<any>;
    icon: Function;
    labelKey: string;
    name: string;
    props?: IObject;
    propsUpdateFunction?: (tabState: IObject, newProps: IObject) => IObject;
    submit?: Function;
}

interface IProps extends IBaseProps {
    defaultTab?: string;
    tabs: IDialogTab[];
}

const DialogWithTabs = ({
    className,
    defaultTab,
    titleKey,
    tabs
}: IProps) => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [ selectedTab, setSelectedTab ] = useState<string | undefined>(defaultTab ?? tabs[0].name);
    const [ tabStates, setTabStates ] = useState(tabs.map(tab => tab.props));
    const clientWidth = useSelector((state: IReduxState) => state['features/base/responsive-ui'].clientWidth);
    const [ isMobile, setIsMobile ] = useState(false);

    useEffect(() => {
        if (clientWidth <= MOBILE_BREAKPOINT) {
            !isMobile && setIsMobile(true);
        } else {
            isMobile && setIsMobile(false);
        }
    }, [ clientWidth, isMobile ]);

    useEffect(() => {
        if (isMobile) {
            setSelectedTab(undefined);
        } else {
            setSelectedTab(defaultTab ?? tabs[0].name);
        }
    }, [ isMobile ]);

    const back = useCallback(() => {
        setSelectedTab(undefined);
    }, []);

    const onClose = useCallback(() => {
        dispatch(hideDialog());
    }, []);

    const onClick = useCallback((tabName: string) => () => {
        setSelectedTab(tabName);
    }, []);

    const getTabProps = (tabId: number) => {
        const tabConfiguration = tabs[tabId];
        const currentTabState = tabStates[tabId];

        if (tabConfiguration.propsUpdateFunction) {
            return tabConfiguration.propsUpdateFunction(
                currentTabState ?? {},
                tabConfiguration.props ?? {});
        }

        return { ...currentTabState };
    };

    const onTabStateChange = useCallback((tabId: number, state: IObject) => {
        const newTabStates = [ ...tabStates ];

        newTabStates[tabId] = state;
        setTabStates(newTabStates);
    }, [ tabStates ]);

    const onSubmit = useCallback(() => {
        tabs.forEach(({ submit }, idx) => {
            submit?.(tabStates[idx]);
        });
        onClose();
    }, [ tabs, tabStates ]);

    const selectedTabIndex = useMemo(() => {
        if (selectedTab) {
            return tabs.findIndex(tab => tab.name === selectedTab);
        }

        return null;
    }, [ selectedTab ]);

    const selectedTabComponent = useMemo(() => {
        if (selectedTabIndex !== null) {
            const TabComponent = tabs[selectedTabIndex].component;

            return (
                <div
                    className = { tabs[selectedTabIndex].className }
                    key = { tabs[selectedTabIndex].name }>
                    <TabComponent
                        onTabStateChange = { onTabStateChange }
                        tabId = { selectedTabIndex }
                        { ...getTabProps(selectedTabIndex) } />
                </div>
            );
        }

        return null;
    }, [ selectedTabIndex, tabStates ]);

    const closeIcon = useMemo(() => (
        <ClickableIcon
            accessibilityLabel = { t('dialog.close') }
            className = { classes.closeIcon }
            icon = { IconCloseLarge }
            id = 'modal-header-close-button'
            onClick = { onClose } />
    ), [ onClose ]);

    return (
        <BaseDialog
            className = { cx(classes.dialog, className) }
            onClose = { onClose }
            size = 'large'>
            {(!isMobile || !selectedTab) && (
                <div className = { classes.sidebar }>
                    <div className = { classes.titleContainer }>
                        <h2 className = { classes.title }>{t(titleKey ?? '')}</h2>
                        {isMobile && closeIcon}
                    </div>
                    {tabs.map(tab => {
                        const label = t(tab.labelKey);

                        return (
                            <ContextMenuItem
                                accessibilityLabel = { label }
                                className = { cx(isMobile && classes.menuItemMobile) }
                                icon = { tab.icon }
                                key = { tab.name }
                                onClick = { onClick(tab.name) }
                                selected = { tab.name === selectedTab }
                                text = { label } />
                        );
                    })}
                </div>
            )}
            {(!isMobile || selectedTab) && (
                <div className = { classes.contentContainer }>
                    <div className = { classes.buttonContainer }>
                        {isMobile && (
                            <span className = { classes.backContainer }>
                                <ClickableIcon
                                    accessibilityLabel = { t('dialog.Back') }
                                    className = { classes.closeIcon }
                                    icon = { IconArrowBack }
                                    id = 'modal-header-back-button'
                                    onClick = { back } />
                                <h2 className = { classes.title }>
                                    {(selectedTabIndex !== null) && t(tabs[selectedTabIndex].labelKey)}
                                </h2>
                            </span>
                        )}
                        {closeIcon}
                    </div>
                    <div className = { classes.content }>
                        {selectedTabComponent}
                    </div>
                    <div
                        className = { cx(classes.buttonContainer, classes.footer) }>
                        <Button
                            accessibilityLabel = { t('dialog.Cancel') }
                            id = 'modal-dialog-cancel-button'
                            labelKey = { 'dialog.Cancel' }
                            onClick = { onClose }
                            type = 'tertiary' />
                        <Button
                            accessibilityLabel = { t('dialog.Ok') }
                            id = 'modal-dialog-ok-button'
                            labelKey = { 'dialog.Ok' }
                            onClick = { onSubmit } />
                    </div>
                </div>
            )}
        </BaseDialog>
    );
};

export default DialogWithTabs;
