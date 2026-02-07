import React, { useMemo, lazy, Suspense } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@store/authStore";
import { ActivityIndicator, Text } from "react-native";
import { rootNavigatorStyles as styles } from "./RootNavigator.styles";
import { useI18n } from "../i18n/I18nProvider";
import { useTheme } from "../theme/theme";
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
const PixScreen = lazy(() =>
  import("../screens/Pix/PixScreen").then((m) => ({
    default: m.PixScreen,
  }))
);
const DigitalCardsScreen = lazy(() =>
  import("../screens/Cards/DigitalCardsScreen").then((m) => ({
    default: m.DigitalCardsScreen,
  }))
);
const RegisterScreen = lazy(() =>
  import("../screens/Auth/RegisterScreen").then((m) => ({
    default: m.RegisterScreen,
  }))
);
const AddTransactionScreen = lazy(() =>
  import("../screens/Transactions/AddTransactionScreen").then((m) => ({
    default: m.AddTransactionScreen,
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
const LazyPix = withSuspense(PixScreen);
const LazyDigitalCards = withSuspense(DigitalCardsScreen);
const LazyRegister = withSuspense(RegisterScreen);
const LazyAddTransaction = withSuspense(AddTransactionScreen);
const LazyTasks = withSuspense(TasksScreen);
const LazyPomodoro = withSuspense(PomodoroScreen);
const LazyFocusMode = withSuspense(FocusModeScreen);
const LazyChat = withSuspense(ChatScreen);
const LazyAccessibility = withSuspense(AccessibilityScreen);

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
          let iconName: React.ComponentProps<typeof MaterialIcons>["name"] =
            "help";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Tasks") iconName = "check-circle";
          else if (route.name === "Pomodoro") iconName = "timer";
          else if (route.name === "FocusMode") iconName = "self-improvement";
          else if (route.name === "Chat") iconName = "chat";
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
      <Tab.Screen
        name="Chat"
        component={LazyChat}
        options={{
          tabBarLabel: t("tabs.chat"),
          headerTitle: t("chat.title"),
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
        name="Pix"
        component={LazyPix}
        options={{ title: t("titles.pix") }}
      />
      <AppStack.Screen
        name="DigitalCards"
        component={LazyDigitalCards}
        options={{ title: t("titles.digitalCards") }}
      />
      <AppStack.Screen
        name="AddTransaction"
        component={LazyAddTransaction}
        options={{
          presentation: "modal",
          title: t("titles.newTransaction"),
        }}
      />
      <AppStack.Screen
        name="Accessibility"
        component={LazyAccessibility}
        options={{ title: t("accessibility.title") }}
      />
    </AppStack.Navigator>
  );
}
