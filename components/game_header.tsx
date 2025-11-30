import { ArrowLeft, MoreVertical } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, GlobalStyles } from "../constants/theme";

type GameHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  onMenu?: () => void;
};

export const GameHeader: React.FC<GameHeaderProps> = ({ title, subtitle, onBack, onMenu }) => {
  return (
    <View style={GlobalStyles.headerContainer}>
      <TouchableOpacity onPress={onBack} style={GlobalStyles.headerIconBtn}>
        <ArrowLeft size={20} color={Colors.text} />
      </TouchableOpacity>
      
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={GlobalStyles.headerTitle}>{title}</Text>
        <Text style={GlobalStyles.textSmall}>{subtitle}</Text>
      </View>

      <TouchableOpacity style={GlobalStyles.headerIconBtn} onPress={onMenu}>
        <MoreVertical size={20} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
};