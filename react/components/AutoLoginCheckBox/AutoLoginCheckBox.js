import React from "react";
import PropTypes from "prop-types";
import { TouchableOpacity, Text } from "react-native";
import { MAIN_BLUE, LIGHT_GRAY } from "../../consts/colors";

const AutoLoginCheckBox = ({ checked, onChange }) => {
  const CheckedCheckBox = () => {
    return (
      <TouchableOpacity
        onPress={onChange}
        style={{
          backgroundColor: MAIN_BLUE,
          width: 18,
          height: 18,
          marginRight: 8,
          borderRadius: 3,
        }}
      >
        <Text
          style={{
            color: "white",
            alignSelf: "center",
            fontWeight: "500",
          }}
        >
          ✓
        </Text>
      </TouchableOpacity>
    );
  };

  const UncheckedCheckBox = () => {
    return (
      <TouchableOpacity
        onPress={onChange}
        style={{
          width: 18,
          height: 18,
          borderWidth: 1,
          borderColor: LIGHT_GRAY,
          marginRight: 8,
          borderRadius: 3,
        }}
      />
    );
  };

  return checked ? <CheckedCheckBox /> : <UncheckedCheckBox />;
};
AutoLoginCheckBox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
};

export default AutoLoginCheckBox;
