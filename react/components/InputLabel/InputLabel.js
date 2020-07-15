import React from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import { DARK_GRAY } from "../../consts/colors";

const InputLabel = ({ name, necessary }) => {
  return (
    <View style={{ flexDirection: "row", paddingBottom: 10 }}>
      {necessary ? (
        <Text style={{ fontSize: 16, color: "#ff4d4f", paddingRight: 4 }}>
          *
        </Text>
      ) : null}
      <Text style={{ fontSize: 16, color: DARK_GRAY }}>{name}</Text>
    </View>
  );
};
InputLabel.propTypes = {
  name: PropTypes.string.isRequired,
  necessary: PropTypes.bool,
};

export default InputLabel;
