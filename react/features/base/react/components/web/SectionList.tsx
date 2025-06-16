import React, { Component } from 'react';

import { Section } from '../../types';

import Container from './Container';

interface IProps {

    /**
     * Rendered when the list is empty. Should be a rendered element.
     */
    ListEmptyComponent: Object;

    /**
     * Used to extract a unique key for a given item at the specified index.
     * Key is used for caching and as the react key to track item re-ordering.
     */
    keyExtractor: Function;

    /**
     * Defines what happens when  an item in the section list is clicked.
     */
    onItemClick: Function;

    /**
     * Returns a React component that renders each Item in the list.
     */
    renderItem: Function;

    /**
     * Returns a React component that renders the header for every section.
     */
    renderSectionHeader: Function;

    /**
     * An array of sections.
     */
    sections: Array<Section>;
}

/**
 * Implements a React/Web {@link Component} for displaying a list with
 * sections similar to React Native's {@code SectionList} in order to
 * facilitate cross-platform source code.
 *
 * @augments Component
 */
export default class SectionList extends Component<IProps> {
    /**
     * Renders the content of this component.
     *
     * @returns {React.ReactNode}
     */
    render() {
        const {
            ListEmptyComponent,
            renderSectionHeader,
            renderItem,
            sections,
            keyExtractor
        } = this.props;

        /**
         * If there are no recent items we don't want to display anything.
         */
        if (sections) {
            return (
                <Container
                    className = 'navigate-section-list'>
                    {
                        sections.length === 0
                            ? ListEmptyComponent
                            : sections.map((section, sectionIndex) => (
                                <Container
                                    key = { sectionIndex }>
                                    { renderSectionHeader(section) }
                                    { section.data
                                        .map((item, listIndex) => {
                                            const listItem = {
                                                item
                                            };

                                            return renderItem(listItem,
                                                keyExtractor(section,
                                                    listIndex));
                                        }) }
                                </Container>
                            )
                            )
                    }
                </Container>
            );
        }

        return null;
    }
}
