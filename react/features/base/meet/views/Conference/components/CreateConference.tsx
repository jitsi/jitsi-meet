import _ from "lodash";
import React from "react";
import { WithTranslation } from "react-i18next";
import { connect as reactReduxConnect } from "react-redux";

// @ts-ignore
import { IReduxState } from "../../../../../app/types";
import type { AbstractProps } from "../../../../../conference/components/AbstractConference";
import { AbstractConference, abstractMapStateToProps } from "../../../../../conference/components/AbstractConference";
import Prejoin from "../../../../../prejoin/components/web/Prejoin";
import { translate } from "../../../../i18n/functions";
import { SET_PREJOIN_PAGE_VISIBILITY } from "../../../../../prejoin/actionTypes";
import { get8x8BetaJWT } from "../../../../connection/options8x8";
import { appNavigate } from "../../../../../app/actions.web";

/**
 * The type of the React {@code Component} props of {@link CreateConference}.
 */
interface IProps extends AbstractProps, WithTranslation {
    dispatch: any;
}

/**
 * The conference page of the Web application.
 */
class CreateConference extends AbstractConference<IProps, any> {
    _onCreateConference = async () => {
        this.props.dispatch({ type: SET_PREJOIN_PAGE_VISIBILITY, value: false });

        const meetTokenCreator = await get8x8BetaJWT(localStorage.getItem("xNewToken") || "");

        if (meetTokenCreator?.room) {
            this.props.dispatch(appNavigate(meetTokenCreator.room));
        }
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return <Prejoin createConference={this._onCreateConference} />;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        ...abstractMapStateToProps(state),
    };
}

export default translate(reactReduxConnect(_mapStateToProps)(CreateConference));
