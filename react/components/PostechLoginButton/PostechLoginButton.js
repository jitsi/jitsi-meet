import React from "react";
import PropTypes from "prop-types";
import { TouchableOpacity, Image, Text } from "react-native";
import { POSTECH_COLOR } from "../../consts/colors";
import { postech_logo_mini } from "../../assets";

const PostechLoginButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: POSTECH_COLOR,
        height: 40,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={postech_logo_mini}
        alt="postech"
        style={{ marginRight: 5 }}
      />
      <Text style={{ color: "#ffffff", fontSize: 16 }}>POSTECH</Text>
    </TouchableOpacity>
  );
};
PostechLoginButton.propTypes = {
  onPress: PropTypes.func,
};

export default PostechLoginButton;
