import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider } from "./context/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import BookDetailsScreen from "./screens/BookDetailsScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          headerShown: true,
          gestureEnabled: true
        }}>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'BookPulse',
              headerLeft: null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="BookDetails" 
            component={BookDetailsScreen}
            options={{
              headerBackTitleVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
