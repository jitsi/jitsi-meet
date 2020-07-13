import React, { useState } from "react";
import PropTypes from "prop-types";
import { View, TextInput, Text, Image, TouchableOpacity } from "react-native";
import { INVALID_RED, LIGHT_GRAY, VALID_GREEN } from "../../consts/colors";
import { eye_visible, eye_invisible } from "../../assets";

const ValidIcon = ({ validity }) => {
  return (
    <View
      style={{
        height: 16,
        width: 16,
        borderRadius: 8,
        alignSelf: "center",
        marginLeft: 7,
        backgroundColor: validity ? VALID_GREEN : INVALID_RED,
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
        {validity ? "✓" : "✕"}
      </Text>
    </View>
  );
};

const VisibilityButton = ({ visiblity, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ justifyContent: "center" }}>
      <Image
        source={visiblity ? eye_invisible : eye_visible}
        style={{ height: 16, width: 16 }}
      />
    </TouchableOpacity>
  );
};

const Form = ({ placeholder, valid, errorMessage, value, onChange, type }) => {
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const onPressVisibilityButton = () => {
    setPasswordVisibility(!passwordVisibility);
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
          secureTextEntry={type === "password" ? passwordVisibility : false}
          type={type === "password" ? "password" : "none"}
          autoCapitalize={"none"}
          value={value}
          onChange={onChange}
          style={{ lineHeight: 20, flex: 1 }}
          placeholder={placeholder}
        />
        {type === "password" ? (
          <VisibilityButton
            visiblity={passwordVisibility}
            onPress={onPressVisibilityButton}
          />
        ) : null}
        {valid !== null && valid !== undefined ? (
          <ValidIcon validity={valid} />
        ) : null}
      </View>
      <Text style={{ ...styles.errorMessage }}>
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
  type: PropTypes.oneOf(["password", "email"]),
};

const styles = {
  formContainer: {
    height: 30,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorMessage: {
    color: INVALID_RED,
    height: 20,
    marginTop: 4,
    marginBottom: 10,
  },
};

export default Form;
