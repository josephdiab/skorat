import React, { useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Colors,
  FontSize,
  GlobalStyles,
  Radius,
  Shadows,
  Spacing,
} from "../constants/theme";
import { UserProfile } from "../constants/types";
import { PlayerStorage } from "../services/player_storage";

type PlayerAutocompleteProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlayer?: (profile: UserProfile) => void;
  placeholder?: string;
  zIndex?: number;
};

export const PlayerAutocomplete: React.FC<PlayerAutocompleteProps> = ({
  value,
  onChangeText,
  onSelectPlayer,
  placeholder = "Player name",
  zIndex = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);

  const handleChangeText = async (text: string) => {
    onChangeText(text);

    // Search immediately - no debounce needed for local storage
    if (text.trim().length >= 1) {
      const results = await PlayerStorage.searchByPrefix(text, 5);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Trigger initial search if there's already text
    if (value.trim().length >= 1) {
      PlayerStorage.searchByPrefix(value, 5).then(setSuggestions);
    }
  };

  const handleBlur = () => {
    // Small delay to allow tap on suggestion to register
    setTimeout(() => {
      setIsFocused(false);
      setSuggestions([]);
    }, 150);
  };

  const handleSelectSuggestion = (profile: UserProfile) => {
    onChangeText(profile.name);
    onSelectPlayer?.(profile);
    setSuggestions([]);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <View style={[styles.container, { zIndex }]}>
      <TextInput
        style={GlobalStyles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {showDropdown && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((profile, index) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.suggestionRow,
                  index === suggestions.length - 1 && styles.suggestionRowLast,
                ]}
                onPress={() => handleSelectSuggestion(profile)}
                activeOpacity={0.7}
              >
                <Text style={styles.avatar}>{profile.avatar}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: "hidden",
    ...Shadows.md,
    zIndex: 1000,
    elevation: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    gap: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    fontSize: FontSize.xl,
  },
  name: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
