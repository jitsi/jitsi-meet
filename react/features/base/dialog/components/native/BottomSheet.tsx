import React, { PureComponent, ReactNode } from 'react';
import { SafeAreaView, ScrollView, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IStore } from '../../../../app/types';
import SlidingView from '../../../react/components/native/SlidingView';
import { hideSheet } from '../../actions';

import { bottomSheetStyles as styles } from './styles';

/**
 * The type of {@code BottomSheet}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * Whether to add padding to scroll view.
     */
    addScrollViewPadding?: boolean;

    /**
     * The children to be displayed within this component.
     */
    children: ReactNode;

    /**
     * Redux Dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Handler for the cancel event, which happens when the user dismisses
     * the sheet.
     */
    onCancel?: Function;

    /**
     * Function to render a bottom sheet footer element, if necessary.
     */
    renderFooter?: () => React.ReactNode;

    /**
     * Function to render a bottom sheet header element, if necessary.
     */
    renderHeader?: Function;

    /**
     * Whether to show sliding view or not.
     */
    showSlidingView?: boolean;

    /**
     * The component's external style.
     */
    style?: Object;
};

/**
 * A component emulating Android's BottomSheet.
 */
class BottomSheet extends PureComponent<Props> {
    /**
     * Default values for {@code BottomSheet} component's properties.
     *
     * @static
     */
    static defaultProps = {
        addScrollViewPadding: true,
        showSlidingView: true
    };

    /**
     * Initializes a new instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new instance with.
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Handles the cancel event, when the user dismissed the sheet. By default we close it.
     *
     * @returns {void}
     */
    _onCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        } else {
            this.props.dispatch(hideSheet());
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            addScrollViewPadding,
            renderHeader,
            renderFooter,
            showSlidingView,
            style
        } = this.props;

        return (
            <SlidingView
                onHide = { this._onCancel }
                position = 'bottom'
                show = { Boolean(showSlidingView) }>
                <View
                    pointerEvents = 'box-none'
                    style = { styles.sheetContainer as ViewStyle }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.sheetAreaCover } />
                    { renderHeader?.() }
                    <SafeAreaView
                        style = { [
                            styles.sheetItemContainer,
                            renderHeader
                                ? styles.sheetHeader
                                : styles.sheet,
                            renderFooter && styles.sheetFooter,
                            style
                        ] }>
                        <ScrollView
                            bounces = { false }
                            showsVerticalScrollIndicator = { false }
                            style = { [
                                renderFooter && styles.sheet,
                                addScrollViewPadding && styles.scrollView
                            ] } >
                            { this.props.children }
                        </ScrollView>
                        { renderFooter?.() }
                    </SafeAreaView>
                </View>
            </SlidingView>
        );
    }
}

export default connect()(BottomSheet);
