import { Settings } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, GlobalStyles } from "../constants/theme";

type HeaderProps = {
  title: string;
  onPressProfile: () => void;
  onPressSettings: () => void;
};

export const Header: React.FC<HeaderProps> = ({ title, onPressSettings }) => (
  <View style={GlobalStyles.headerContainer}>
    {/* Empty View acts as a spacer to keep the Title centered */}
    <View style={{ width: 36 }} /> 
    
    <Text style={styles.logoTitle}>{title}</Text>
    
    <TouchableOpacity style={GlobalStyles.headerIconBtn} onPress={onPressSettings}>
      <Settings size={20} color={Colors.text} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  logoTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 28, // Slightly smaller for sans-serif balance
    fontFamily: "Outfit_700Bold", // <--- Modern Geometric Font
    color: Colors.text, // <--- Back to White
    letterSpacing: 2, // Wider spacing for a premium look
    textTransform: "uppercase", // Makes it look like a proper logo
    marginTop: 2,
  },
});