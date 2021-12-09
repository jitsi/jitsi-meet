// @flow

import React, { useCallback, useState } from 'react';
import { List } from 'react-native-paper';

import { translate } from '../../../../base/i18n';
import { Icon, IconArrowDown, IconArrowUp } from '../../../../base/icons';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link FormSectionAccordion}.
 */
type Props = {

    /**
     * Is the section an accordion or not.
     */
    accordion: boolean,

    /**
     * The children to be displayed within this Link.
     */
    children: React$Node,

    /**
     * Whether the accordion is expandable.
     */
    expandable: boolean,

    /**
     * The i18n key of the text label of the section.
     */
    label: string,

    /**
     * An external style object passed to the component.
     */
    style: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Section accordion on settings form.
 *
 * @returns {React$Element<any>}
 */
function FormSectionAccordion({ accordion, children, expandable, label, style, t }: Props) {
    const [ expandSection, setExpandSection ] = useState(false);
    const onPress = useCallback(() => {
        setExpandSection(!expandSection);
    });

    return (
        <List.Accordion
            expanded = { expandSection || !expandable }
            onPress = { onPress }
            /* eslint-disable-next-line react/jsx-no-bind */
            right = { props =>
                accordion && <Icon
                    { ...props }
                    src = { expandSection ? IconArrowUp : IconArrowDown }
                    style = { expandSection ? styles.sectionOpen : styles.sectionClose } /> }
            style = { [
                styles.formSectionTitle,
                style
            ] }
            title = { t(label) }
            titleStyle = {
                expandSection || !expandable
                    ? styles.formSectionTitleActive : styles.formSectionTitleInActive }>
            { children }
        </List.Accordion>
    );
}

export default translate(FormSectionAccordion);
