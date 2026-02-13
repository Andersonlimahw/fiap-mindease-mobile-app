import React, { useMemo, lazy, Suspense } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@store/authStore";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { rootNavigatorStyles as styles } from "./RootNavigator.styles";
import { useI18n } from "../i18n/I18nProvider";
import { useTheme, type AppTheme } from "../theme/theme";
import { Loading } from "../components/Loading";

// Telas críticas (carregadas imediatamente)
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { OnboardingScreen } from "../screens/Onboarding/OnboardingScreen";
import { HomeScreen } from "../screens/Home/HomeScreen";

// Lazy loading de telas secundárias
const UserScreen = lazy(() =>
  import("../screens/User/UserScreen").then((m) => ({
    default: m.UserScreen,
  }))
);

const RegisterScreen = lazy(() =>
  import("../screens/Auth/RegisterScreen").then((m) => ({
    default: m.RegisterScreen,
  }))
);
const TasksScreen = lazy(() =>
  import("../screens/Tasks/TasksScreen").then((m) => ({
    default: m.TasksScreen,
  }))
);
const PomodoroScreen = lazy(() =>
  import("../screens/Pomodoro/PomodoroScreen").then((m) => ({
    default: m.PomodoroScreen,
  }))
);
const FocusModeScreen = lazy(() =>
  import("../screens/FocusMode/FocusModeScreen").then((m) => ({
    default: m.FocusModeScreen,
  }))
);
const ChatScreen = lazy(() =>
  import("../screens/Chat/ChatScreen").then((m) => ({
    default: m.ChatScreen,
  }))
);
const AccessibilityScreen = lazy(() =>
  import("../screens/Accessibility/AccessibilityScreen").then((m) => ({
    default: m.AccessibilityScreen,
  }))
);
const ContentReaderScreen = lazy(() =>
  import("../screens/ContentReader/ContentReaderScreen").then((m) => ({
    default: m.ContentReaderScreen,
  }))
);

/**
 * HOC para envolver componentes lazy em Suspense
 */
function withSuspense<P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<Loading />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Componentes com Suspense
const LazyUser = withSuspense(UserScreen);
const LazyRegister = withSuspense(RegisterScreen);
const LazyTasks = withSuspense(TasksScreen);
const LazyPomodoro = withSuspense(PomodoroScreen);
const LazyFocusMode = withSuspense(FocusModeScreen);
const LazyChat = withSuspense(ChatScreen);
const LazyAccessibility = withSuspense(AccessibilityScreen);
const LazyContentReader = withSuspense(ContentReaderScreen);

type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

type AppTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Pomodoro: undefined;
  FocusMode: undefined;
  Chat: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
const AppStack = createNativeStackNavigator();

import { MaterialIcons } from "@expo/vector-icons";

/**
 * Custom 3D floating button for the center tab (Chat)
 * Similar to Mercado Livre/Mercado Pago FAB style
 */
function CenterTabButton({
  onPress,
  accessibilityLabel,
  theme,
}: {
  onPress?: () => void;
  accessibilityLabel?: string;
  theme: AppTheme;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={centerButtonStyles.wrapper}
    >
      {/* Outer shadow layer for 3D depth */}
      <View
        style={[
          centerButtonStyles.shadowLayer,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          },
        ]}
      />
      {/* Main button */}
      <View
        style={[
          centerButtonStyles.button,
          {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.surface,
          },
        ]}
      >
        {/* Inner highlight for 3D effect */}
        <View
          style={[
            centerButtonStyles.highlight,
            { backgroundColor: theme.colors.accent },
          ]}
        />
        <MaterialIcons name="chat" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const centerButtonStyles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    top: -20,
    width: 64,
    height: 64,
  },
  shadowLayer: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    top: 8,
    opacity: 0.4,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    opacity: 0.25,
  },
});

function AppTabs() {
  const theme = useTheme();
  const { t } = useI18n();
  const commonTabOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.muted,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      },
      tabBarHideOnKeyboard: true,
    }),
    [theme]
  );
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabOptions,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<
            string,
            React.ComponentProps<typeof MaterialIcons>["name"]
          > = {
            Home: "home",
            Tasks: "check-circle",
            Pomodoro: "timer",
            FocusMode: "self-improvement",
            Chat: "chat",
          };

          const iconName = icons[route.name] || "help";

          // Chat icon is rendered inside the custom button
          if (route.name === "Chat") {
            return null;
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t("tabs.home"), headerTitle: t("titles.home") }}
      />
      <Tab.Screen
        name="Tasks"
        component={LazyTasks}
        options={{
          tabBarLabel: t("tabs.tasks"),
          headerTitle: t("tasks.title"),
        }}
      />
      {/* Chat in the center with 3D floating button */}
      <Tab.Screen
        name="Chat"
        component={LazyChat}
        options={{
          tabBarLabel: "",
          headerTitle: t("chat.title"),
          tabBarButton: (props) => (
            <CenterTabButton
              onPress={props.onPress as () => void}
              accessibilityLabel={t("tabs.chat")}
              theme={theme}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Pomodoro"
        component={LazyPomodoro}
        options={{
          tabBarLabel: t("tabs.pomodoro"),
          headerTitle: t("pomodoro.title"),
        }}
      />
      <Tab.Screen
        name="FocusMode"
        component={LazyFocusMode}
        options={{
          tabBarLabel: t("tabs.focusMode"),
          headerTitle: t("focusMode.title"),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading, isAuthenticated, isHydrated } = useAuth();
  const { t } = useI18n();
  const theme = useTheme();

  if (loading || user === undefined || !isHydrated) {
    return (
      <Text style={[styles.loading, { color: theme.colors.text }]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </Text>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <AuthStack.Navigator
        key={"auth"}
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "push",
          fullScreenGestureEnabled: true,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <AuthStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            // Onboarding entra com fade para dar sensação de leveza
            animation: "fade",
          }}
        />
        <AuthStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            // Login mantém push padrão lateral
            animation: "slide_from_right",
          }}
        />
        <AuthStack.Screen
          name="Register"
          component={LazyRegister}
          options={{
            // Registro sobe de baixo para cima (modal-like)
            animation: "slide_from_bottom",
          }}
        />
      </AuthStack.Navigator>
    );
  }

  return (
    <AppStack.Navigator
      key={"app"}
      initialRouteName="App"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AppStack.Screen
        name="App"
        component={AppTabs}
        options={{ title: t("common.appName"), headerShown: false }}
      />
      <AppStack.Screen
        name="User"
        component={LazyUser}
        options={{ title: t("titles.myAccount") }}
      />
      <AppStack.Screen
        name="Accessibility"
        component={LazyAccessibility}
        options={{ title: t("accessibility.title") }}
      />
      <AppStack.Screen
        name="ContentReader"
        component={LazyContentReader}
        options={{
          title: t("contentReader.title"),
          presentation: "modal",
        }}
      />
    </AppStack.Navigator>
  );
}
