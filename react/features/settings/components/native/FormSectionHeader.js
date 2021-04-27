// @flow

import React, { Component } from 'react';
import { List } from 'react-native-paper';

import { translate } from '../../../base/i18n';
import { Icon, IconArrowDown, IconArrowUp } from '../../../base/icons';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link FormSectionHeader}
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

type State = {

    /**
     * State variable for the expanding sections.
     */
    expandList: boolean
}


/**
 * Implements a React {@code Component} which renders a section header on a
 * form.
 */
class FormSectionHeader extends Component<Props, State> {

    /**
     * Initializes a new {@code FormSectionHeader} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            expandList: false
        };

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        const { children, style, t, title } = this.props;

        return (
            <List.Accordion
                expanded = { this.state.expandList }
                onPress = { this._onPress }
                right = { props =>
                    (<Icon
                        { ...props }
                        src = { this.state.expandList ? IconArrowDown : IconArrowUp }
                        style = { this.state.expandList ? styles.sectionOpen : styles.sectionClose } />) }
                style = { [
                    styles.formSectionTitle,
                    style
                ] }
                title = { t(title) }>
                { children }
            </List.Accordion>
        );
    }

    _onPress: () => void;

    /**
     * Callback to expand the section list.
     *
     * @returns {void}
     */
    _onPress() {
        this.setState({
            expandList: !this.state.expandList
        });
    }
}

export default translate(FormSectionHeader);
