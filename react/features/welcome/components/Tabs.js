// @flow
import React, { Component } from 'react';

import Tab from './Tab';

/**
 * The type of the React {@code Component} props of {@link Tabs}
 */
type Props = {

    /**
     * Handler for selecting the tab.
     */
    onSelect: Function,

    /**
     * The index of the selected tab.
     */
    selected: number,

    /**
     * Tabs information.
     */
    tabs: Object
};

/**
 * A React component that implements tabs.
 *
 */
export default class Tabs extends Component<Props> {
    static defaultProps = {
        tabs: [],
        selected: 0
    };

    /**
     * Implements the React Components's render method.
     *
     * @inheritdoc
     */
    render() {
        const { onSelect, selected, tabs } = this.props;
        const { content = null } = tabs.length
            ? tabs[Math.min(selected, tabs.length - 1)]
            : {};

        return (
            <div className = 'tab-container'>
                <div className = 'tab-content'>
                    { content }
                </div>
                { tabs.length > 1 ? (
                    <div className = 'tab-buttons'>
                        {
                            tabs.map((tab, index) => (
                                <Tab
                                    index = { index }
                                    isSelected = { index === selected }
                                    key = { index }
                                    label = { tab.label }
                                    onSelect = { onSelect } />
                            ))
                        }
                    </div>) : null
                }
            </div>
        );
    }
}
