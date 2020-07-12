import React from "react";
import PropTypes from "prop-types";
import { View, TextInput, Text } from "react-native";
import { INVALID_RED, LIGHT_GRAY } from "../../consts/colors";

const Form = ({ placeholder, invalid, errorMessage, value, onChange }) => {
  return (
    <>
      <View
        style={{
          ...styles.formContainer,
          borderColor: invalid ? INVALID_RED : LIGHT_GRAY,
        }}
      >
        <TextInput
          value={value}
          onChange={onChange}
          style={{ lineHeight: 20 }}
          placeholder={placeholder}
        />
      </View>
      {invalid ? (
        <Text style={{ color: INVALID_RED }}>{errorMessage}</Text>
      ) : null}
    </>
  );
};
Form.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  invalid: PropTypes.bool,
  errorMessage: PropTypes.string,
};

const styles = {
  formContainer: {
    height: 30,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    justifyContent: "center",
  },
};

export default Form;
