# Guia de Correção: Google Login no Android (Dispositivos Físicos)

Este documento descreve as etapas necessárias para corrigir o erro de login do Google no Android, que geralmente ocorre devido a discrepâncias de configuração no Firebase Console e no arquivo `google-services.json`.

## 1. Obter o SHA-1 do Ambiente de Desenvolvimento

Para que o Google Login funcione em um dispositivo físico, o Firebase precisa conhecer a assinatura digital (SHA-1) da chave usada para compilar o app.

No terminal, execute:
```bash
cd android && ./gradlew signingReport
```
Procure pela seção `Variant: debug` ou `Variant: release` (dependendo de como você está gerando o app) e anote o valor de **SHA1**.

**Seus Fingerprints Gerados (Ambiente Atual):**
- **SHA-1:** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **SHA-256:** `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`

Seus Fingerprints Gerados:
   - SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   - SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C

## 2. Configuração no Firebase Console

1. Vá para o [Firebase Console](https://console.firebase.google.com/).
2. Selecione o seu projeto (**projeto-bytebank** ou o novo projeto **mindease**).
3. Clique no ícone de engrenagem (Configurações do Projeto) > **Geral**.
4. Role até a seção "Seus aplicativos".
5. Se você ainda não tem um app Android com o pacote `com.mindease.android`, clique em **Adicionar aplicativo** e registre-o com esse ID de pacote.
6. No app `com.mindease.android`, clique em **Adicionar impressão digital** e cole o **SHA-1** que você obteve no passo 1.
   - *Dica: Adicione tanto o SHA-1 de Debug quanto o de Release se já tiver o de release.*

## 3. Configuração no Google Cloud Console (OAuth Client IDs)

1. Vá para o [Google Cloud Console - Credenciais](https://console.cloud.google.com/apis/credentials).
2. Certifique-se de estar no projeto correto.
3. Você verá uma lista de "IDs do cliente OAuth 2.0".
4. Identifique o **Web client (Auto-created for Google Sign-in)**. Este é o seu **Web Client ID**.
   - Ele deve terminar em `.apps.googleusercontent.com`.
   - **IMPORTANTE:** No Android, usamos o **Web Client ID** na configuração do plugin, não o Android Client ID.

## 4. Atualizar o arquivo `.env`

Certifique-se de que seu arquivo `.env` local contenha as seguintes variáveis atualizadas:

```env
# Web Client ID (Obtido no Google Cloud Console - Tipo: Web Application)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=102802199932-dro8udnia2hu7k6bmnkhij4m97gooqck.apps.googleusercontent.com

# iOS Client ID (Obtido no Google Cloud Console ou GoogleService-Info.plist - Tipo: iOS)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=102802199932-3c8av88ho09numo7u87evflujm83v3sn.apps.googleusercontent.com
```

## 5. Substituir o `google-services.json`

Se você fez alterações no Firebase (como adicionar o SHA-1), é recomendável baixar a versão mais recente:
1. No Firebase Console, clique no botão de download do `google-services.json` para o app `com.mindease.android`.
2. Substitua o arquivo na raiz do projeto.

## 6. Limpar e Recompilar

Após estas alterações, limpe o cache e recompile o app para o dispositivo:

```bash
npx expo run:android --device
```

---
**Resumo técnico do que foi corrigido no código:**
- Atualizado o pacote de `com.bytebankapp.android` para `com.mindease.android` no `google-services.json`.
- Mapeado as variáveis `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` e `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` no `app.json` para que fiquem disponíveis via `Constants.expoConfig.extra`.
- Corrigido o `GoogleAuthService.ts` para parar de usar um ID hardcoded e passar a usar o Web Client ID correto via variáveis de ambiente.
