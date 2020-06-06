// @flow

import React, { Component } from 'react';

import type { Section } from '../../Types';

import Text from './Text';

type Props = {

    /**
     * A section containing the data to be rendered
     */
    section: Section
}

/**
 * Implements a React/Web {@link Component} that renders the section header of
 * the list
 *
 * @extends Component
 */
export default class NavigateSectionListSectionHeader extends Component<Props> {
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
