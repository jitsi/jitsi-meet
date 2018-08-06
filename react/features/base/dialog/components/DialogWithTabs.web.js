// @flow

import Tabs from '@atlaskit/tabs';
import React, { Component } from 'react';

import { StatelessDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * The type of the React {@code Component} props of {@link DialogWithTabs}.
 */
export type Props = {

    /**
     * Function that closes the dialog.
     */
    closeDialog: Function,

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: number,

    /**
     * Disables dismissing the dialog when the blanket is clicked. Enabled
     * by default.
     */
    disableBlanketClickDismiss: boolean,

    /**
     * Callback invoked when the Save button has been pressed.
     */
    onSubmit: Function,


    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Information about the tabs that will be rendered.
     */
    tabs: Array<Object>

};

/**
 * The type of the React {@code Component} state of {@link DialogWithTabs}.
 */
type State = {

    /**
     * An array of the states of the tabs.
     */
    tabStates: Array<Object>
};

/**
 * A React {@code Component} for displaying a dialog with tabs.
 *
 * @extends Component
 */
class DialogWithTabs extends Component<Props, State> {
    /**
     * Initializes a new {@code DialogWithTabs} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            tabStates: this.props.tabs.map(tab => tab.props)
        };
        this._onSubmit = this._onSubmit.bind(this);
        this._onTabStateChange = this._onTabStateChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const onCancel = this.props.closeDialog;

        return (
            <StatelessDialog
                disableBlanketClickDismiss
                    = { this.props.disableBlanketClickDismiss }
                onCancel = { onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'settings.title'>
                <div className = 'settings-dialog'>
                    { this._renderTabs() }
                </div>
            </StatelessDialog>
        );
    }

    /**
     * Gets the props to pass into the tab component.
     *
     * @param {number} tabId - The index of the tab configuration within
     * {@link this.state.tabStates}.
     * @returns {Object}
     */
    _getTabProps(tabId) {
        const { tabs } = this.props;
        const { tabStates } = this.state;
        const tabConfiguration = tabs[tabId];
        const currentTabState = tabStates[tabId];

        if (tabConfiguration.propsUpdateFunction) {
            return tabConfiguration.propsUpdateFunction(
                currentTabState,
                tabConfiguration.props);
        }

        return { ...currentTabState };
    }

    /**
     * Renders the tabs from the tab information passed on props.
     *
     * @returns {void}
     */
    _renderTabs() {
        const { defaultTab = 0, t, tabs } = this.props;

        if (tabs.length === 1) {
            return this._renderTab({
                ...tabs[0],
                tabId: 0
            });
        }

        if (tabs.length > 1) {
            return (
                <Tabs
                    tabs = {
                        tabs.map(({ component, label, styles }, idx) => {
                            return {
                                content: this._renderTab({
                                    component,
                                    styles,
                                    tabId: idx
                                }),
                                defaultSelected: defaultTab === idx,
                                label: t(label)
                            };
                        })
                    } />);
        }

        logger.warn('No settings tabs configured to display.');

        return null;
    }

    /**
     * Renders a tab from the tab information passed as parameters.
     *
     * @param {Object} tabInfo - Information about the tab.
     * @returns {Component} - The tab.
     */
    _renderTab({ component, styles, tabId }) {
        const { closeDialog } = this.props;
        const TabComponent = component;

        return (
            <div className = { styles }>
                <TabComponent
                    closeDialog = { closeDialog }
                    mountCallback = { this.props.tabs[tabId].onMount }
                    onTabStateChange
                        = { this._onTabStateChange }
                    tabId = { tabId }
                    { ...this._getTabProps(tabId) } />
            </div>);
    }

    _onTabStateChange: (number, Object) => void;

    /**
     * Changes the state for a tab.
     *
     * @param {number} tabId - The id of the tab which state will be changed.
     * @param {Object} state - The new state.
     * @returns {void}
     */
    _onTabStateChange(tabId, state) {
        const tabStates = [ ...this.state.tabStates ];

        tabStates[tabId] = state;
        this.setState({ tabStates });
    }

    _onSubmit: () => void;

    /**
     * Submits the information filled in the dialog.
     *
     * @returns {void}
     */
    _onSubmit() {
        const { onSubmit, tabs } = this.props;

        tabs.forEach(({ submit }, idx) => {
            submit(this.state.tabStates[idx]);
        });

        onSubmit();
    }
}

export default translate(DialogWithTabs);
