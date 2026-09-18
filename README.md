# ORIGIN Hub

Espacio privado del equipo ORIGIN para ideas, proyectos y tareas. Next.js 16, Firebase Authentication, Cloud Firestore y Firebase Admin en rutas de servidor. Lee [ORIGIN_WORKFLOW.md](./ORIGIN_WORKFLOW.md) antes de trabajar.

## Configuración

Requisitos: Node.js 20+, npm y Java 21 para el emulador.

```bash
npm install
npm run lint
npm run build
npm run test:rules
npm run dev
```

Abre http://localhost:3000. No hay registro público ni modo demo. La aplicación necesita un usuario de Firebase Authentication y un documento `users/{uid}` activo.

Copia `.env.example` a `.env.local` y completa las seis variables web. Para operaciones Admin, usa las tres variables `FIREBASE_ADMIN_*` solo en el servidor. Localmente también puedes usar `FIREBASE_ADMIN_PROJECT_ID` junto con `GOOGLE_APPLICATION_CREDENTIALS`, apuntando a un JSON guardado fuera del repositorio. La clave privada debe conservar sus saltos de línea o codificarse con `\n` literales; nunca se debe compartir ni añadir a Git. El Project ID de Admin debe coincidir con el de la Web App. En Vercel configura las nueve variables (sin `GOOGLE_APPLICATION_CREDENTIALS`) para cada entorno que vayas a desplegar y vuelve a desplegar para aplicar cambios.

## Primer usuario

En Firebase Console, habilita Authentication > Sign-in method > Email/Password. Crea la cuenta inicial en Authentication > Users > Add user, con el correo y la contraseña temporal facilitados por el dueño del proyecto. Copia su UID. En Firestore Database > Data crea `users/{uid}` con:

```json
{
  "uid": "UID_REAL",
  "email": "CORREO_REAL",
  "displayName": "Fabrizio Salamanca",
  "status": "active",
  "mustChangePassword": true,
  "createdAt": "FECHA_ISO",
  "updatedAt": "FECHA_ISO"
}
```

Las fechas deben ser cadenas ISO 8601. No guardes ninguna contraseña en Firestore. Tras iniciar sesión, la aplicación exige cambiarla. Si el servicio Admin todavía no tiene credenciales, la creación de otros usuarios mostrará un error de configuración y no cambiará la sesión actual.

Las credenciales Admin se obtienen en Firebase Console > Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada. Del JSON descarga `project_id`, `client_email` y `private_key` a las variables de servidor correspondientes; conserva el JSON fuera del repositorio y nunca lo subas. En Vercel introduce las variables en Project Settings > Environment Variables para Production y los otros entornos que uses. Verifica Authentication > Settings > Authorized domains (localhost y dominio de Vercel), y Authentication > Templates > Password reset para el correo de restablecimiento.

## Datos y reglas

Colecciones: `users`, `users/{uid}/ideaVotes`, `ideas`, `projects` y `tasks`. Los miembros activos con contraseña establecida tienen los mismos permisos funcionales. Firestore niega todas las escrituras de perfiles desde clientes; la creación y gestión de usuarios pasa por Firebase Admin en `/api/users`. El cambio de contraseña temporal confirma el perfil por `/api/account/password-complete`.

`firestore.rules` es la fuente de verdad. Compara el diff y ejecuta `npm run test:rules` antes de desplegar, usando explícitamente `firebase deploy --only firestore:rules --project originboard-db142` después de verificar el proyecto y el usuario inicial. Las pruebas usan un proyecto ficticio y el emulador; no tocan producción. No migres automáticamente los datos de demo del navegador.

El inicio de sesión utiliza persistencia local o de sesión según «Recordarme», sin almacenar contraseñas. La recuperación envía el enlace oficial de Firebase; no recupera una contraseña anterior. Las páginas privadas se ocultan mientras se valida la sesión. Los cambios en Firestore se observan en tiempo real.

## Votación

Un miembro activo distinto del autor puede votar una vez por idea. El comprobante privado vive en `users/{uid}/ideaVotes/{ideaId}` y la transacción actualiza los totales. Al llegar a dos apoyos o rechazos, la idea se aprueba o rechaza. Las ideas aprobadas pueden convertirse en proyectos.
