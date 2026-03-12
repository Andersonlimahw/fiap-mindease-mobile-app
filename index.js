import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Registrar handler de mensagens em background ANTES do registerRootComponent
// Isso é obrigatório para o Android receber notificações quando o app está em background/quit
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM] Background message received:', remoteMessage.messageId);
});

registerRootComponent(App);

