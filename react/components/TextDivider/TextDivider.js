import React from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import Line from "../Line/Line";

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
      <Line />
      <Text
        style={{
          paddingHorizontal: 10,
          fontSize: 16,
          fontWeight: "200",
        }}
      >
        {text}
      </Text>
      <Line />
    </View>
  );
};
TextDivider.propTypes = {
  style: PropTypes.object,
  text: PropTypes.string.isRequired,
};

export default TextDivider;
