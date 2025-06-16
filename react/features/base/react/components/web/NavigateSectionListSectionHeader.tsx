import React, { Component } from 'react';

import { Section } from '../../types';

import Text from './Text';

interface IProps {

    /**
     * A section containing the data to be rendered.
     */
    section: Section;
}

/**
 * Implements a React/Web {@link Component} that renders the section header of
 * the list.
 *
 * @augments Component
 */
export default class NavigateSectionListSectionHeader extends Component<IProps> {
    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <Text className = 'navigate-section-section-header'>
                { this.props.section.title }
            </Text>
        );
    }
}
