# PontoCerto

PontoCerto é um aplicativo para costureiras autônomas organizarem o trabalho do ateliê em um só lugar. Cadastre clientes, acompanhe encomendas e prazos, consulte a agenda de entregas e controle valores recebidos e pendentes.

## Recursos

- Cadastro de clientes, contatos, medidas e observações.
- Controle de encomendas, descrição das peças, prazos, provas, valores e situação.
- Registro de pagamentos e consulta de saldos pendentes.
- Agenda de entregas, incluindo encomendas atrasadas.
- Exportação e restauração de backup em **Ajustes e backup**.
- Armazenamento local no aparelho usando IndexedDB/Dexie; não precisa de conta ou servidor.
- Aplicativo Android empacotado com Capacitor. A interface e os recursos do app ficam dentro do APK e podem ser usados sem internet.

Os dados não são sincronizados entre aparelhos. Exporte backups regularmente. Desinstalar o app, limpar os dados dele ou perder o aparelho pode apagar os dados locais. Antes de atualizar, instale a nova versão sobre a anterior e não desinstale a versão existente.

## Requisitos para gerar o APK

- Node.js 22 ou superior e npm.
- Android Studio instalado e configurado.
- Android SDK Platform 36, Android SDK Build-Tools e Android SDK Command-line Tools instalados pelo SDK Manager do Android Studio.
- Licenças do Android SDK aceitas.

O Android Studio inclui o JDK adequado para o Gradle. Não é necessário hospedar o site nem conectar um celular para compilar.

## Criar o projeto Android com Capacitor

O Capacitor transforma o build web do PontoCerto em um projeto Android nativo. A configuração está em `capacitor.config.ts`:

- `appId`: identificador permanente do app (`com.pontocerto.app`); mantenha-o nas próximas versões.
- `appName`: nome exibido pelo Android (`PontoCerto`).
- `webDir`: pasta do build web que será copiada para o app (`dist/client`).

Na primeira configuração do projeto, na raiz do repositório, execute:

```sh
npm ci
npm run build
npx cap add android
npx cap sync android
```

`npx cap add android` cria a pasta `android/` com o projeto nativo Gradle. Execute esse comando apenas uma vez. Se a pasta `android/` já existir, não a recrie: use `npm run android:sync` para compilar a aplicação web e atualizar os arquivos Android com o Capacitor.

Para abrir o projeto nativo no Android Studio:

```sh
npm run android:open
```

## Gerar o APK de depuração

Na raiz do projeto, instale as dependências e gere o APK:

```sh
npm ci
npm run android:apk
```

O script compila a versão web, sincroniza os arquivos com o Capacitor e executa a compilação Android. Se o projeto Android ainda não foi criado, faça antes a configuração inicial descrita acima. O arquivo final será salvo em:

```text
PontoCerto.apk
```

O APK de depuração também fica disponível em `android/app/build/outputs/apk/debug/app-debug.apk`. Ele é adequado para testes e instalação direta, mas não é uma versão assinada para publicação na Play Store.

Comandos úteis:

```sh
npm run android:sync  # compila e sincroniza os arquivos web no projeto Android
npm run android:open  # abre o projeto Android no Android Studio
```

Se o SDK estiver em um caminho personalizado, configure `ANDROID_HOME` ou `ANDROID_SDK_ROOT` e o caminho do SDK no arquivo local `android/local.properties`. Esse arquivo é específico do computador e não deve ser enviado ao Git.

## Instalar e usar no Android

1. Transfira `PontoCerto.apk` para o celular, por cabo USB, compartilhamento de arquivos ou outro meio.
2. No Android, abra o APK e confirme a instalação. Se solicitado, permita temporariamente a instalação de apps da origem usada (por exemplo, o navegador ou o gerenciador de arquivos). Instale apenas APKs de uma origem confiável.
3. Abra o PontoCerto e cadastre clientes, encomendas e pagamentos. Os registros são salvos no próprio aparelho.
4. Para confirmar o uso sem rede, ative o modo avião, feche e reabra o app e confira os dados.
5. Em **Ajustes e backup**, use **Exportar backup** para guardar uma cópia JSON fora do app. Para recuperar dados, escolha **Restaurar backup** e selecione o arquivo; a restauração substitui os registros atuais.

Também é possível instalar por USB com o Android Platform Tools (`adb`) habilitado:

```sh
adb install -r PontoCerto.apk
```

Use `-r` para instalar uma atualização sem remover a versão anterior. Mantenha o mesmo identificador de app (`com.pontocerto.app`) nas versões futuras para permitir atualizações e preservar os dados locais.

## Desenvolvimento web

```sh
npm ci
npm run dev
```

Para validar a versão de produção web:

```sh
npm run build
```
