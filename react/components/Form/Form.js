import React from "react";
import PropTypes from "prop-types";
import { View, TextInput, Text } from "react-native";
import { INVALID_RED, LIGHT_GRAY, VALID_GREEN } from "../../consts/colors";

const Form = ({ placeholder, valid, errorMessage, value, onChange }) => {
  const ValidIcon = ({ valid }) => {
    return (
      <View
        style={{
          height: 16,
          width: 16,
          borderRadius: 8,
          alignSelf: "center",
          backgroundColor: valid ? VALID_GREEN : INVALID_RED,
        }}
      >
        <Text
          style={{
            marginLeft: 1,
            fontSize: 10,
            alignSelf: "center",
            textAlignVertical: "center",
            lineHeight: 16,
            color: "white",
            fontWeight: "500",
          }}
        >
          {valid ? "✓" : "✕"}
        </Text>
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          ...styles.formContainer,
          borderColor: valid === false ? INVALID_RED : LIGHT_GRAY,
        }}
      >
        <TextInput
          value={value}
          onChange={onChange}
          style={{ lineHeight: 20, flex: 1 }}
          placeholder={placeholder}
        />
        {valid !== null && valid !== undefined ? (
          <ValidIcon valid={valid} />
        ) : null}
      </View>
      <Text
        style={{
          color: INVALID_RED,
          height: 20,
          marginTop: 4,
          marginBottom: 10,
        }}
      >
        {valid ? "" : errorMessage}
      </Text>
    </>
  );
};
Form.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  valid: PropTypes.bool,
  errorMessage: PropTypes.string,
};

const styles = {
  formContainer: {
    height: 30,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
};

export default Form;
