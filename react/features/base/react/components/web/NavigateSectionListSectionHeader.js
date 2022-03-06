// @flow

import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';

import type { Section } from '../../Types';

import Text from './Text';

type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * A section containing the data to be rendered.
     */
    section: Section
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        root: {
            ...theme.mixins.navigateSectionlistText,
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '16px'
        }
    };
};

/**
 * Implements a React/Web {@link Component} that renders the section header of
 * the list.
 *
 * @augments Component
 */
class NavigateSectionListSectionHeader extends Component<Props> {
    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <Text className = { this.props.classes.root }>
                { this.props.section.title }
            </Text>
        );
    }
}

export default withStyles(styles)(NavigateSectionListSectionHeader);
