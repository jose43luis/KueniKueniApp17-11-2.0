# 🚀 INSTRUCCIONES DE DEPLOYMENT - Sistema de Mensajes

## ✅ Archivos a Subir a GitHub

Asegúrate de subir estos archivos nuevos:

```bash
# Nuevos archivos HTML
admin-mensajes.html

# Nuevos archivos CSS
styles/admin-mensajes.css

# Nuevos archivos JavaScript
javaScript/admin-mensajes.js

# Archivos modificados
admin-dashboard.html
admin-eventos.html
admin-donaciones.html
email-server/email-server.js

# Documentación
SISTEMA-MENSAJES-IMPLEMENTADO.md
RESUMEN-SISTEMA-MENSAJES.md
INSTRUCCIONES-DEPLOYMENT-MENSAJES.md
```

---

## 📦 Proceso de Deployment

### Opción 1: Usar el Script Automático

1. **Ejecutar el script BAT**
   ```
   SUBIR-CAMBIOS-A-RENDER.bat
   ```

2. **Seguir las instrucciones en pantalla**
   - El script subirá todos los cambios automáticamente
   - Render detectará los cambios y hará auto-deploy

### Opción 2: Subida Manual

1. **Abrir Git Bash o Terminal**

2. **Agregar archivos**
   ```bash
   cd "C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1"
   
   git add admin-mensajes.html
   git add styles/admin-mensajes.css
   git add javaScript/admin-mensajes.js
   git add admin-dashboard.html
   git add admin-eventos.html
   git add admin-donaciones.html
   git add email-server/email-server.js
   git add *.md
   ```

3. **Hacer commit**
   ```bash
   git commit -m "Implementar sistema de mensajes personalizados para socios"
   ```

4. **Subir a GitHub**
   ```bash
   git push origin main
   ```

5. **Esperar auto-deploy**
   - Render detectará los cambios automáticamente
   - El deployment tomará ~2-3 minutos
   - Verificar en: https://dashboard.render.com

---

## ✅ Verificación Post-Deployment

### 1. Verificar el Servidor de Correos

Visita: `https://kuenikueniapp17-11-2-0.onrender.com`

Deberías ver:
```json
{
  "status": "OK",
  "message": "Servidor de correos Kueni Kueni funcionando con Brevo API",
  "timestamp": "2024-12-11T..."
}
```

### 2. Probar el Nuevo Endpoint

Puedes usar curl o Postman:

```bash
curl -X POST https://kuenikueniapp17-11-2-0.onrender.com/send-custom-message \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu_email@example.com",
    "nombre": "Prueba",
    "asunto": "Test",
    "mensaje": "Este es un mensaje de prueba"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Mensaje enviado correctamente",
  "messageId": "..."
}
```

### 3. Verificar la Interfaz

1. Ir a tu aplicación web
2. Iniciar sesión como admin
3. Verificar que aparezca "Enviar Mensajes" en el menú
4. Click en "Enviar Mensajes"
5. Verificar que cargue la lista de socios
6. Probar seleccionar un socio
7. Probar cargar una plantilla
8. Verificar la vista previa
9. Enviar un mensaje de prueba

---

## 🔍 Troubleshooting

### Problema: No aparece la opción en el menú

**Solución:**
1. Limpiar caché del navegador (Ctrl + Shift + Delete)
2. Hacer hard refresh (Ctrl + F5)
3. Verificar que el archivo admin-mensajes.html esté en el servidor

### Problema: Error al enviar mensaje

**Posibles causas:**
1. Servidor de correos no está activo
   - Verificar: https://kuenikueniapp17-11-2-0.onrender.com
   
2. Error en la API de Brevo
   - Verificar logs en Render Dashboard
   - Verificar que BREVO_API_KEY esté configurada

3. Socio no existe en la base de datos
   - Verificar en Supabase que el socio tenga email válido

### Problema: No carga la lista de socios

**Solución:**
1. Abrir consola del navegador (F12)
2. Ver errores en la pestaña Console
3. Verificar conexión con Supabase
4. Verificar que existan socios en la tabla `perfiles`

---

## 🔐 Variables de Entorno (Ya configuradas)

En Render Dashboard → Environment:

```
BREVO_API_KEY=xkeysib-tu-api-key
BREVO_USER=9cfd8c001@smtp-brevo.com
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
FRONTEND_URL=tu-dominio.com
```

**⚠️ No necesitas cambiar nada**, ya están configuradas.

---

## 📋 Checklist de Deployment

Antes de hacer push, verifica:

- [ ] Todos los archivos nuevos están en el repositorio
- [ ] admin-mensajes.html funciona localmente
- [ ] admin-mensajes.css se carga correctamente
- [ ] admin-mensajes.js no tiene errores de consola
- [ ] El nuevo endpoint está en email-server.js
- [ ] Los menús de otros archivos están actualizados
- [ ] No hay errores de sintaxis
- [ ] Las variables de entorno están configuradas

Después del deployment:

- [ ] El servidor responde en la URL de Render
- [ ] El endpoint /send-custom-message funciona
- [ ] La interfaz carga correctamente
- [ ] La lista de socios se muestra
- [ ] Las plantillas funcionan
- [ ] La vista previa se actualiza
- [ ] Se puede enviar un mensaje de prueba
- [ ] El email llega con el formato correcto
- [ ] El historial se guarda

---

## 🎯 Comandos Rápidos

### Verificar estado de Git
```bash
git status
```

### Ver cambios
```bash
git diff
```

### Ver historial
```bash
git log --oneline
```

### Deshacer cambios (antes de commit)
```bash
git checkout -- archivo.html
```

### Ver branches
```bash
git branch -a
```

---

## 📞 Contacto en Caso de Problemas

Si encuentras algún problema durante el deployment:

1. **Revisar logs de Render**
   - https://dashboard.render.com
   - Selecciona tu servicio
   - Ve a la pestaña "Logs"

2. **Revisar logs del navegador**
   - Presiona F12
   - Ve a Console
   - Busca errores en rojo

3. **Revisar documentación**
   - SISTEMA-MENSAJES-IMPLEMENTADO.md
   - LEEME-EQUIPO.md

---

## ⏱️ Tiempo Estimado de Deployment

- **Subida a GitHub**: 1-2 minutos
- **Auto-deploy en Render**: 2-3 minutos
- **Verificación**: 5 minutos
- **Total**: ~10 minutos

---

## ✨ ¡Listo!

Una vez completado el deployment, el sistema de mensajes estará 100% funcional y listo para usarse.

**Recuerda**: 
- El primer envío puede tardar un poco más
- Render mantiene el servidor activo por 15 minutos después de la última petición
- Haz pruebas con tu propio email primero

---

**Última actualización**: Diciembre 2024  
**Estado**: ✅ Listo para deployment
