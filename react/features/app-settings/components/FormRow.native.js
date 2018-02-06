// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getSafetyOffset } from '../../base/react';
import { ASPECT_RATIO_WIDE } from '../../base/responsive-ui';

import styles, { ANDROID_UNDERLINE_COLOR, CONTAINER_PADDING } from './styles';

/**
 * The type of the React {@code Component} props of {@link FormRow}
 */
type Props = {

    /**
     * The current aspect ratio of the screen.
     */
    _aspectRatio: Symbol,

    /**
     *
     */
    children: Object,

    /**
     * Prop to decide if a row separator is to be rendered.
     */
    fieldSeparator: boolean,

    /**
     * The i18n key of the text label of the form field.
     */
    i18nLabel: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Implements a React {@code Component} which renders a standardized row on a
 * form. The component should have exactly one child component.
 */
class FormRow extends Component<Props> {
    /**
     * Initializes a new {@code FormRow} instance.
     *
     * @param {Object} props - Component properties.
     */
    constructor(props) {
        super(props);

        React.Children.only(this.props.children);
        this._getDefaultFieldProps = this._getDefaultFieldProps.bind(this);
        this._getRowStyle = this._getRowStyle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @override
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        // Some field types need additional props to look good and standardized
        // on a form.
        const newChild = React.cloneElement(
            this.props.children,
            this._getDefaultFieldProps(this.props.children)
        );

        return (
            <View
                style = { this._getRowStyle() } >
                <View style = { styles.fieldLabelContainer } >
                    <Text style = { styles.text } >
                        { t(this.props.i18nLabel) }
                    </Text>
                </View>
                <View style = { styles.fieldValueContainer } >
                    { newChild }
                </View>
            </View>
        );
    }

    _getDefaultFieldProps: (field: Component<*, *>) => Object;

    /**
     * Assembles the default props to the field child component of this form
     * row.
     *
     * Currently tested/supported field types:
     *     - TextInput
     *     - Switch (needs no addition props ATM).
     *
     * @private
     * @param {Object} field - The field (child) component.
     * @returns {Object}
     */
    _getDefaultFieldProps(field: Object) {
        if (field && field.type) {
            switch (field.type.displayName) {
            case 'TextInput':
                return {
                    style: styles.textInputField,
                    underlineColorAndroid: ANDROID_UNDERLINE_COLOR
                };
            }
        }

        return {};
    }

    _getRowStyle: () => Array<Object>;

    /**
     * Assembles the row style array based on the row's props. For padding, see
     * comment in functions.js.
     *
     * @private
     * @returns {Array<Object>}
     */
    _getRowStyle() {
        const rowStyle = [
            styles.fieldContainer
        ];

        if (this.props.fieldSeparator) {
            rowStyle.push(styles.fieldSeparator);
        }

        if (this.props._aspectRatio === ASPECT_RATIO_WIDE) {
            const safeOffset = Math.max(
                getSafetyOffset() - CONTAINER_PADDING, 0
            );

            rowStyle.push({
                marginLeft: safeOffset,
                marginRight: safeOffset
            });
        }

        return rowStyle;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code FormRow}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Object}
 */
export function _mapStateToProps(state: Object) {
    return {
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio
    };
}

export default translate(connect(_mapStateToProps)(FormRow));
