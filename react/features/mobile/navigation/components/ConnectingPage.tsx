import React from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView, Text, View, ViewStyle } from "react-native";

import JitsiScreen from "../../../base/modal/components/JitsiScreen";
import LoadingIndicator from "../../../base/react/components/native/LoadingIndicator";

import { TEXT_COLOR, navigationStyles } from "./styles";
import { connect } from "react-redux";

interface IProps {
    _waitingText: string;
}

const ConnectingPage = (props: IProps) => {
    const { t } = useTranslation();

    return (
        <JitsiScreen style={navigationStyles.connectingScreenContainer}>
            <View style={navigationStyles.connectingScreenContent as ViewStyle}>
                <SafeAreaView>
                    <LoadingIndicator color={TEXT_COLOR} size="large" />
                    {/* <Text style={navigationStyles.connectingScreenText}>
                        {`${t("connectingOverlay.joiningRoom")} ${
                            props._waitingText
                        }`}
                    </Text> */}
                    {props._waitingText!='' && props._waitingText!=undefined && props._waitingText!=null ? 
                    
                     <Text style = { navigationStyles.connectingScreenText }>
                        { props._waitingText }
                    </Text> 
                    :
                    <Text style={navigationStyles.connectingScreenText}>
                    {t("connectingOverlay.joiningRoom")}
                </Text>
                    }
                </SafeAreaView>
            </View>
        </JitsiScreen>
    );
};

function _mapStateToProps(state: IReduxState) {
    const { waitingText } = state["features/base/conference"];

    return {
        _waitingText: waitingText,
    };
}

export default connect(_mapStateToProps)(ConnectingPage);
