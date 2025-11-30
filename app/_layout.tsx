import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Replaced the standard View with GestureHandlerRootView.
        This is required to make gestures (like swipe-to-delete) work.
      */}
      <GestureHandlerRootView style={styles.container}>
        {/* Global StatusBar configuration. 
          'light' makes text white (for dark backgrounds).
        */}
        <StatusBar style="light" backgroundColor="#111111" />
        
        {/* The Stack itself. 
          contentStyle sets the default background for all screens 
        */}
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: "#111111" }
          }} 
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
});