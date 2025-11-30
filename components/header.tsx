import { Settings, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, GlobalStyles } from "../constants/theme";

type HeaderProps = {
  title: string;
  onPressProfile: () => void;
  onPressSettings: () => void;
};

export const Header: React.FC<HeaderProps> = ({ title, onPressProfile, onPressSettings }) => (
  <View style={GlobalStyles.headerContainer}>
    <TouchableOpacity style={GlobalStyles.headerIconBtn} onPress={onPressProfile}>
      {/* Replaced Emoji with Lucide Icon */}
      <User size={20} color={Colors.text} />
    </TouchableOpacity>
    
    <Text style={GlobalStyles.headerTitle}>{title}</Text>
    
    <TouchableOpacity style={GlobalStyles.headerIconBtn} onPress={onPressSettings}>
      {/* Replaced Emoji with Lucide Icon */}
      <Settings size={20} color={Colors.text} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  // No local styles needed as we use GlobalStyles and Lucide props
});