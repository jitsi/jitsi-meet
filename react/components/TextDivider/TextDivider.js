import React from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import { LIGHT_GRAY } from "../../consts/colors";

const HorizontalLine = () => {
  return (
    <View style={{ height: 1, flex: 1, backgroundColor: LIGHT_GRAY }}></View>
  );
};
const TextDivider = ({ style, text }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 20,
        ...style,
      }}
    >
      <HorizontalLine />
      <Text
        style={{
          paddingHorizontal: 10,
          fontSize: 16,
          fontWeight: "200",
        }}
      >
        {text}
      </Text>
      <HorizontalLine />
    </View>
  );
};
TextDivider.propTypes = {
  style: PropTypes.object,
  text: PropTypes.string.isRequired,
};

export default TextDivider;
