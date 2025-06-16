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
            flexDirection: 'row-reverse',
            alignItems: 'center',

            '& > button': {
                marginRight: '24px'
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

        header: {
            order: -1,
            paddingBottom: theme.spacing(4)
        },

        footer: {
            justifyContent: 'flex-end',
            paddingTop: theme.spacing(4),

            '& button:last-child': {
                marginLeft: '16px'
            }
        }
    };
});

interface IObject {
    [key: string]: unknown;
}

export interface IDialogTab<P> {
    cancel?: Function;
    className?: string;
    component: ComponentType<any>;
    icon: Function;
    labelKey: string;
    name: string;
    props?: IObject;
    propsUpdateFunction?: (tabState: IObject, newProps: P, tabStates?: (IObject | undefined)[]) => P;
    submit?: Function;
}

interface IProps extends IBaseProps {
    defaultTab?: string;
    tabs: IDialogTab<any>[];
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
    const [ userSelected, setUserSelected ] = useState(false);
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
            setSelectedTab(defaultTab);
        } else {
            setSelectedTab(defaultTab ?? tabs[0].name);
        }
    }, [ isMobile ]);

    const onUserSelection = useCallback((tabName?: string) => {
        setUserSelected(true);
        setSelectedTab(tabName);
    }, []);

    const back = useCallback(() => {
        onUserSelection(undefined);
    }, []);


    // the userSelected state is used to prevent setting focus when the user
    // didn't actually interact (for the first rendering for example)
    useEffect(() => {
        if (userSelected) {
            document.querySelector<HTMLElement>(isMobile
                ? `.${classes.title}`
                : `#${`dialogtab-button-${selectedTab}`}`
            )?.focus();
            setUserSelected(false);
        }
    }, [ isMobile, userSelected, selectedTab ]);

    const onClose = useCallback((isCancel = true) => {
        if (isCancel) {
            tabs.forEach(({ cancel }) => {
                cancel && dispatch(cancel());
            });
        }
        dispatch(hideDialog());
    }, []);

    const onClick = useCallback((tabName: string) => () => {
        onUserSelection(tabName);
    }, []);

    const onTabKeyDown = useCallback((index: number) => (event: React.KeyboardEvent<HTMLDivElement>) => {
        let newTab: IDialogTab<any> | null = null;

        if (event.key === 'ArrowUp') {
            newTab = index === 0 ? tabs[tabs.length - 1] : tabs[index - 1];
        }

        if (event.key === 'ArrowDown') {
            newTab = index === tabs.length - 1 ? tabs[0] : tabs[index + 1];
        }

        if (newTab !== null) {
            onUserSelection(newTab.name);
        }
    }, [ tabs.length ]);

    const onMobileKeyDown = useCallback((tabName: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === ' ' || event.key === 'Enter') {
            onUserSelection(tabName);
        }
    }, [ classes.contentContainer ]);

    const getTabProps = (tabId: number) => {
        const tabConfiguration = tabs[tabId];
        const currentTabState = tabStates[tabId];

        if (tabConfiguration.propsUpdateFunction) {
            return tabConfiguration.propsUpdateFunction(
                currentTabState ?? {},
                tabConfiguration.props ?? {},
                tabStates);
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
        onClose(false);
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
            accessibilityLabel = { t('dialog.accessibilityLabel.close') }
            icon = { IconCloseLarge }
            id = 'modal-header-close-button'
            onClick = { onClose } />
    ), [ onClose ]);

    return (
        <BaseDialog
            className = { cx(classes.dialog, className) }
            onClose = { onClose }
            size = 'large'
            titleKey = { titleKey }>
            {(!isMobile || !selectedTab) && (
                <div
                    aria-orientation = 'vertical'
                    className = { classes.sidebar }
                    role = { isMobile ? undefined : 'tablist' }>
                    <div className = { classes.titleContainer }>
                        <h1
                            className = { classes.title }
                            tabIndex = { -1 }>
                            {t(titleKey ?? '')}
                        </h1>
                        {isMobile && closeIcon}
                    </div>
                    {tabs.map((tab, index) => {
                        const label = t(tab.labelKey);

                        /**
                         * When not on mobile, the items behave as tabs,
                         * that's why we set `controls`, `role` and `selected` attributes
                         * only when not on mobile, they are useful only for the tab behavior.
                         */
                        return (
                            <ContextMenuItem
                                accessibilityLabel = { label }
                                className = { cx(isMobile && classes.menuItemMobile) }
                                controls = { isMobile ? undefined : `dialogtab-content-${tab.name}` }
                                icon = { tab.icon }
                                id = { `dialogtab-button-${tab.name}` }
                                key = { tab.name }
                                onClick = { onClick(tab.name) }
                                onKeyDown = { isMobile ? onMobileKeyDown(tab.name) : onTabKeyDown(index) }
                                role = { isMobile ? undefined : 'tab' }
                                selected = { tab.name === selectedTab }
                                text = { label } />
                        );
                    })}
                </div>
            )}
            {(!isMobile || selectedTab) && (
                <div
                    className = { classes.contentContainer }
                    tabIndex = { isMobile ? -1 : undefined }>
                    {/* DOM order is important for keyboard users: show whole heading first when on mobile… */}
                    {isMobile && (
                        <div className = { cx(classes.buttonContainer, classes.header) }>
                            <span className = { classes.backContainer }>
                                <h1
                                    className = { classes.title }
                                    tabIndex = { -1 }>
                                    {(selectedTabIndex !== null) && t(tabs[selectedTabIndex].labelKey)}
                                </h1>
                                <ClickableIcon
                                    accessibilityLabel = { t('dialog.Back') }
                                    icon = { IconArrowBack }
                                    id = 'modal-header-back-button'
                                    onClick = { back } />
                            </span>
                            {closeIcon}
                        </div>
                    )}
                    {tabs.map(tab => (
                        <div
                            aria-labelledby = { isMobile ? undefined : `${tab.name}-button` }
                            className = { cx(classes.content, tab.name !== selectedTab && 'hide') }
                            id = { `dialogtab-content-${tab.name}` }
                            key = { tab.name }
                            role = { isMobile ? undefined : 'tabpanel' }
                            tabIndex = { isMobile ? -1 : 0 }>
                            { tab.name === selectedTab && selectedTabComponent }
                        </div>
                    ))}
                    {/* But show the close button *after* tab panels when not on mobile (using tabs).
                    This is so that we can tab back and forth tab buttons and tab panels easily. */}
                    {!isMobile && (
                        <div className = { cx(classes.buttonContainer, classes.header) }>
                            {closeIcon}
                        </div>
                    )}
                    <div
                        className = { cx(classes.buttonContainer, classes.footer) }>
                        <Button
                            accessibilityLabel = { t('dialog.accessibilityLabel.Cancel') }
                            id = 'modal-dialog-cancel-button'
                            labelKey = { 'dialog.Cancel' }
                            onClick = { onClose }
                            type = 'tertiary' />
                        <Button
                            accessibilityLabel = { t('dialog.accessibilityLabel.Ok') }
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
