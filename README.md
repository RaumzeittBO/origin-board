# ORIGIN Hub

ORIGIN Hub es la plataforma interna de ORIGIN para registrar ideas, convertirlas en proyectos, organizar tareas y mantener visible el trabajo del equipo. Este primer MVP funciona por completo en local y está preparado para incorporar Firebase, GitHub y Vercel cuando existan los proyectos definitivos.

## Stack

- Next.js con App Router
- TypeScript
- Tailwind CSS
- ESLint
- Firebase SDK
- Persistencia local desacoplada mediante repositorios

## Instalación

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y selecciona **Entrar en modo demo**.

Para comprobar una versión de producción:

```bash
npm run lint
npm run build
npm start
```

## Variables de entorno

Copia `.env.example` como `.env.local` solo cuando tengas la configuración Web App real de Firebase:

```bash
cp .env.example .env.local
```

En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Completa estas variables sin comitear el archivo:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Modo local

Si las seis variables de Firebase no están completas, la aplicación utiliza `LocalWorkspaceRepository`. Los datos se guardan en `localStorage` bajo una única clave y sobreviven a las recargas del navegador. La interfaz consume el contrato `WorkspaceRepository`, no accede directamente a `localStorage`.

El usuario demo es Fabrizio, con el rol **Founder / Product & Technology**. No utiliza una contraseña ficticia. Los datos iniciales pueden editarse o eliminarse desde la propia aplicación.

## Firebase futuro

`src/lib/firebase.ts` solo lee variables de entorno y no contiene credenciales. El selector de repositorios activa `FirebaseWorkspaceRepository` cuando la configuración está completa. Las colecciones previstas son:

| Colección | Contenido principal |
| --- | --- |
| `users` | `id`, `name`, `area`, `status` |
| `ideas` | `id`, `title`, `description`, `category`, `status`, autor y fechas |
| `projects` | `id`, `name`, `description`, `status`, `priority`, propietario, miembros, `sourceIdeaId` y fechas |
| `tasks` | `id`, `title`, `description`, `projectId`, asignación, estado, prioridad y fechas |

`firestore.rules` contiene una base restrictiva: bloquea usuarios anónimos, exige autor en ideas y deja puntos claros para incorporar roles y workspaces. Debe revisarse y probarse en el emulador antes de desplegar. `firebase.json` referencia esas reglas sin asociar el código a ningún Project ID. `.firebaserc.example` es solo una plantilla.

Antes de activar Firebase en producción también se sustituirá la sesión demo por Firebase Authentication. Las reglas incluidas ya asumen usuarios autenticados, por lo que no deben publicarse hasta completar ese flujo.

## GitHub futuro

El repositorio local no tiene ningún remote inventado. Cuando exista el repositorio definitivo:

```bash
git remote add origin URL_REAL
git push -u origin main
```

Recomendación de ramas:

- `main`: versión estable y verificada.
- `feature/nombre-tarea`: una rama breve por cambio o funcionalidad.

## Vercel futuro

No hace falta `vercel.json`; Vercel detecta Next.js automáticamente. Al crear el proyecto, configura las mismas seis variables `NEXT_PUBLIC_FIREBASE_*` en los entornos necesarios y ejecuta un despliegue después de que Firebase Authentication, Firestore y sus reglas estén listos.

## Arquitectura

```text
src/
├── app/                 # Rutas, layouts y estilos
├── components/          # Shell, navegación y UI reutilizable
├── context/             # Estado y operaciones de la aplicación
├── data/                # Datos demo editables
├── lib/                 # Inicialización de Firebase
├── repositories/        # Contrato, repositorio local y Firestore
└── types/                # Modelos de dominio
```

## Flujo de trabajo diario del equipo

1. Actualiza `main`: `git pull origin main`.
2. Crea tu rama: `git switch -c feature/nombre-tarea`.
3. Trabaja y prueba la aplicación con `npm run dev`.
4. Antes de compartir, ejecuta `npm run lint` y `npm run build`.
5. Guarda cambios: `git add .` y `git commit -m "tipo: descripción breve"`.
6. Publica tu rama: `git push -u origin feature/nombre-tarea`.
7. Abre un Pull Request para revisión. Cuando sea aprobado, intégralo en `main`.

## Nunca hacer

- nunca subir `.env.local`
- nunca subir contraseñas
- nunca subir API Keys privadas
- nunca trabajar directamente sobre `main` cuando ya exista colaboración
- nunca hacer push antes de verificar que la aplicación funciona

## Información necesaria para la siguiente etapa

Consulta [SETUP_NEXT_STEPS.md](./SETUP_NEXT_STEPS.md). Allí se especifican los datos mínimos de GitHub, Firebase y Vercel que deberá aportar el propietario, sin solicitar secretos innecesarios.

## Votación de ideas

Las categorías disponibles son Juegos, Software, Pagina Web, Apps y Upgrade. Cada idea puede incluir opcionalmente hasta tres imágenes de referencia, optimizadas antes de guardarse. Cada miembro activo distinto del autor puede emitir un único like o dislike. El primer total que alcance 2 cierra la votación: APPROVED o REJECTED. Solo las ideas aprobadas pueden convertirse en proyectos. Editar una idea conserva sus votos y estado. Las categorías antiguas deben seleccionarse al editar.

En Firebase los totales son públicos para los miembros, mientras los comprobantes se guardan en users/{uid}/ideaVotes/{ideaId}, legibles únicamente por su dueño. La transacción y firestore.rules impiden votos duplicados y cambios arbitrarios de totales. Las reglas deben desplegarse antes de habilitar la función en Firebase. El administrador del proyecto conserva acceso a los datos.

El acceso actual de la aplicación sigue siendo una demo de Fabrizio: no hay autenticación Firebase implementada. Para usar la votación entre personas y dispositivos es necesario conectar Firebase Authentication y vincular cada perfil de miembro con su UID. En modo local los datos y comprobantes se guardan en este navegador; no ofrecen anonimato ni protección contra manipulación de localStorage.

Pruebas de lógica y persistencia local: node --test tests/idea-voting.test.cjs.
