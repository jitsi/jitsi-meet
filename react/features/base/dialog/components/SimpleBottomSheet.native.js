// @flow

import React, { Component } from 'react';
import {
    Modal,
    Text,
    TouchableHighlight,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { Icon } from '../../font-icons';

import { simpleBottomSheet as styles } from './styles';

/**
 * Underlay color for the buttons on the sheet.
 *
 * @type {string}
 */
const BUTTON_UNDERLAY_COLOR = '#eee';

type Option = {

    /**
     * Name of the icon which will be rendered on the right.
     */
    iconName: string,

    /**
     * True if the element is selected (will be highlighted in blue),
     * false otherwise.
     */
    selected: boolean,

    /**
     * Text which will be rendered in the row.
     */
    text: string
};


/**
 * The type of {@code SimpleBottomSheet}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * Handler for the cancel event, which happens when the user dismisses
     * the sheet.
     */
    onCancel: Function,

    /**
     * Handler for the event when an option has been selected in the sheet.
     */
    onSubmit: Function,

    /**
     * Array of options which will be rendered as rows.
     */
    options: Array<Option>
};

/**
 * A component emulating Android's BottomSheet, in a simplified form.
 * It supports text options with an icon, which the user can tap. The style has
 * been implemented following the Material Design guidelines for bottom
 * sheets: https://material.io/guidelines/components/bottom-sheets.html
 *
 * For all intents and purposes, this component has been designed to work and
 * behave as a {@code Dialog}.
 */
class SimpleBottomSheet extends Component<Props> {
    /**
     * Initializes a new {@code SimpleBottomSheet} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onButtonPress = this._onButtonPress.bind(this);
        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Modal
                animationType = { 'slide' }
                onRequestClose = { this._onCancel }
                transparent = { true }
                visible = { true }>
                <View style = { styles.container }>
                    <TouchableWithoutFeedback
                        onPress = { this._onCancel } >
                        <View style = { styles.overlay } />
                    </TouchableWithoutFeedback>
                    <View style = { styles.sheet }>
                        <View style = { styles.rowsWrapper }>
                            { this._renderOptions() }
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    _onButtonPress: (?Object) => void;

    /**
     * Handle pressing of one of the options. The sheet will be hidden and the
     * onSubmit prop will be called with the selected option.
     *
     * @param {Object} option - The option which the user selected.
     * @private
     * @returns {void}
     */
    _onButtonPress(option) {
        const { onSubmit } = this.props;

        onSubmit && onSubmit(option);
    }

    _onCancel: () => void;

    /**
     * Cancels the dialog by calling the onCancel prop callback.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        const { onCancel } = this.props;

        onCancel && onCancel();
    }

    /**
     * Renders sheet rows based on the options prop.
     *
     * @private
     * @returns {Array} - Array of rows to be rendered in the sheet.
     */
    _renderOptions() {
        return this.props.options.map(
            (option, index) => this._renderRow(option, index));
    }

    /**
     * Renders a single row of the sheet.
     *
     * @param {Object} option - Single option which needs to be rendered.
     * @param {int} index - Option index, used as a key for React.
     * @private
     * @returns {ReactElement} - A row element with an icon and text.
     */
    _renderRow(option, index) {
        const { iconName, selected, text } = option;
        const selectedStyle = selected ? styles.rowSelectedText : {};

        return (
            <TouchableHighlight
                key = { index }

                // TODO The following disables an eslint error alerting about a
                // known potential/theoretical performance pernalty:
                //
                // A bind call or arrow function in a JSX prop will create a
                // brand new function on every single render. This is bad for
                // performance, as it will result in the garbage collector being
                // invoked way more than is necessary. It may also cause
                // unnecessary re-renders if a brand new function is passed as a
                // prop to a component that uses reference equality check on the
                // prop to determine if it should update.
                //
                // I'm not addressing the potential/theoretical performance
                // penalty at the time of this writing because it doesn't seem
                // to me that it's a practical performance penalty in the case.
                //
                // eslint-disable-next-line react/jsx-no-bind
                onPress = { this._onButtonPress.bind(this, option) }
                underlayColor = { BUTTON_UNDERLAY_COLOR } >
                <View style = { styles.row } >
                    <Icon
                        name = { iconName }
                        style = { [ styles.rowIcon, selectedStyle ] } />
                    <View style = { styles.rowPadding } />
                    <Text style = { [ styles.rowText, selectedStyle ] } >
                        { text }
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }
}

export default connect()(SimpleBottomSheet);
