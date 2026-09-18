# Vani: desarrollo y sincronización

Desde esta carpeta ejecuta `npm ci` y `npm run dev`.
Copia `.env.example` a `.env.local` y añade la URL base y la clave pública de Supabase.
En Vercel configura las mismas variables para Production y Preview.

## Base de datos

Aplica una vez `supabase/migrations/20260918_workspace_sync.sql` en el SQL Editor
 del proyecto. Crea `vani_workspaces` y la función `save_vani_workspace`.
RLS restringe lectura, inserción y modificación al usuario autenticado propietario.
La función verifica además el identificador de la cuenta y la revisión esperada.
No se necesitan claves secretas en el navegador.

## Uso

- Sin sesión, los apuntes permanecen en este navegador.
- Con sesión, los cambios se guardan en Supabase tras una breve pausa al escribir.
- La app consulta cambios de otros dispositivos cada 15 segundos mientras está visible,
  y también al volver a la pestaña o recuperar la conexión.
- La primera vez, usa **Importar apuntes de este navegador** y **Añadir a mi cuenta**.
  Es una importación adicional, no reemplaza la nube ni borra el original. No la repitas
  salvo que quieras otra copia. Localhost y el dominio público tienen datos locales separados.
- Cada cuenta tiene una copia local y borradores pendientes separados. Sin conexión
  puedes editar una cuenta que ya se cargó en ese navegador; los cambios se reintentan después.
  Para acceder desde otro dispositivo, espera a **Sincronizado con Supabase**.
- Si ambos dispositivos editaron, la app pide elegir entre la nube y los cambios locales.
  Guarda la versión descartada en localStorage bajo `vani_workspace:<user-id>:backup:*`.
  Las copias de recuperación contienen JSON con `materias`; no se borran automáticamente.
- La sincronización opera sobre todas las materias de una cuenta como un conjunto.
  No combina automáticamente ediciones simultáneas de dos dispositivos.

`npm test` cubre reconexión, conflictos, importación, respuestas tardías, cuotas locales
 y varias pestañas. `npm run build` comprueba la compilación y `npm run lint` analiza el código.
