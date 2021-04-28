// @flow

import React, { useState } from 'react';
import { List } from 'react-native-paper';

import { translate } from '../../../base/i18n';
import { Icon, IconArrowDown, IconArrowUp } from '../../../base/icons';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link FormSectionAccordion}
 */
type Props = {

    /**
     * The children to be displayed within this Link.
     */
    children: React$Node,

    /**
     * An external style object passed to the component.
     */
    style: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The i18n key of the text label of the section.
     */
    title: string
}

/**
 * Section accordion on settings form.
 *
 * @returns {React$Element<any>}
 */
function FormSectionAccordion({ children, style, t, title }: Props) {
    const [ expandSection, setExpandSection ] = useState(false);

    /**
     * Press handler for expanding form section.
     *
     * @returns {void}
     */
    function onPress() {
        setExpandSection(!expandSection);
    }

    return (
        <List.Accordion
            expanded = { expandSection }
            onPress = { onPress }
            /* eslint-disable-next-line react/jsx-no-bind */
            right = { props =>
                (<Icon
                    { ...props }
                    src = { expandSection ? IconArrowDown : IconArrowUp }
                    style = { expandSection ? styles.sectionOpen : styles.sectionClose } />) }
            style = { [
                styles.formSectionTitle,
                style
            ] }
            title = { t(title) }>
            { children }
        </List.Accordion>
    );
}

export default translate(FormSectionAccordion);
