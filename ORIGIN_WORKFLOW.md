# Flujo obligatorio de ORIGIN Hub

Este documento se aplica a Fabrizio, Helmy, Dario y Santino.

## Antes de trabajar

1. Lee este archivo.
2. Ejecuta `git status`.
3. Cambia a `main` y ejecuta `git pull`. No partas de una copia desactualizada.
4. Crea una rama para la tarea: `feature/nombre-tarea`, `fix/nombre-error` o `firebase/nombre-cambio`.
5. Nunca desarrolles directamente en `main`. Si Fabrizio pide expresamente trabajar en `FABRIZIO-CAMBIOS`, respeta esa rama para sus cambios.

## Durante el trabajo

Comprende la arquitectura antes de editar, revisa `git diff`, conserva el trabajo ajeno y resuelve conflictos sin sobrescribirlo. No subas secretos, `.env.local`, service accounts, contraseñas ni tokens. Prueba lo que implementas. No migres datos demo a producción sin revisión.

## Cambios visuales y funcionales

Ejecuta `npm run lint`, `npm run build` y `npm run dev`. Entrega la URL local exacta (normalmente `http://localhost:3000`) y escribe: «Puedes revisar tus cambios aquí: ...». Indica el puerto real si cambia.

## Firebase

`firestore.rules` en el repositorio es la fuente de verdad. Si modificas reglas, `firebase.json`, índices, Auth o la estructura de Firestore:

1. Explica el cambio y compara las reglas anteriores con las nuevas mediante `git diff`.
2. Inicia el emulador y ejecuta `npm run test:rules`.
3. Verifica accesos permitidos y denegados, sin ampliar permisos innecesariamente.
4. Ejecuta lint y build.
5. Solo entonces considera `firebase deploy --only firestore:rules --project originboard-db142`.

No publiques reglas abiertas para resolver errores. No edites reglas directamente en Firebase Console salvo emergencia autorizada.

## Cierre

Antes del push comprueba `git status` y `git diff`: ningún secreto o credencial, ninguna regresión, lint y build correctos. Haz un commit descriptivo, sube tu rama y abre un Pull Request. No hagas `push --force` ni pushes directos a `main` en el flujo normal. Integra a `main` únicamente con aprobación explícita del dueño del proyecto.

En conflictos, identifica los archivos afectados y conserva ambas funcionalidades cuando sea posible; nunca uses `--force` ni elimines trabajo ajeno.

## Prompt para iniciar una sesión

> Lee primero ORIGIN_WORKFLOW.md y respeta todas sus reglas. Antes de modificar nada revisa git status, actualiza desde main y trabaja exclusivamente en una rama segura. Analiza el estado actual del proyecto y no sobrescribas trabajo de otros integrantes. Al terminar ejecuta las pruebas necesarias, lint y build, y levanta el entorno local. Dame el enlace local exacto para revisar visualmente el resultado. No hagas push a main. Si modificas Firebase Security Rules, debes probarlas primero en Firebase Emulator, compararlas con las anteriores y no desplegarlas si existe cualquier error o ampliación insegura de permisos.

Una instrucción expresa del dueño para una entrega concreta puede autorizar su integración a `main` una vez terminada y verificada; nunca permite omitir comprobaciones de seguridad.
