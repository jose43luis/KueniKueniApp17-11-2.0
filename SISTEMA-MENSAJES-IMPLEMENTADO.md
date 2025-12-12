# Sistema de Mensajes Personalizados para Socios - KueniKueni

## 📋 Resumen
Se ha implementado un sistema completo de envío de mensajes personalizados para que el administrador pueda comunicarse directamente con los socios vía correo electrónico.

## 🎯 Funcionalidades Implementadas

### 1. Nueva Vista de Mensajes (admin-mensajes.html)
- **Ubicación**: Panel de administración → Enviar Mensajes
- **Acceso**: Solo para usuarios con rol "admin"

### 2. Características Principales

#### Selección de Destinatarios
- Lista desplegable con todos los socios activos
- Muestra nombre completo y email del socio seleccionado
- Ordenados alfabéticamente por nombre

#### Plantillas Predefinidas
Se incluyen 4 plantillas de mensajes:

1. **Bienvenida** 🎉
   - Mensaje de bienvenida a nuevos socios
   - Tono cálido y acogedor

2. **Agradecimiento** ❤️
   - Reconocimiento por ser parte de la familia
   - Mensaje de gratitud

3. **Recordatorio** 📌
   - Formato para recordatorios de eventos
   - Incluye espacios para detalles (fecha, hora, lugar)

4. **Felicitación** 🎊
   - Para celebrar logros o eventos especiales
   - Tono motivacional y positivo

#### Editor de Mensajes
- Campo de asunto personalizable
- Área de texto amplia con contador de caracteres
- Soporte para variable `{nombre}` que se reemplaza automáticamente
- Vista previa en tiempo real del mensaje formateado

#### Vista Previa
- Muestra el correo tal como lo recibirá el socio
- Incluye el formato corporativo de Kueni Kueni
- Actualización en tiempo real mientras se escribe

#### Historial de Mensajes
- Guarda los últimos 20 mensajes enviados en localStorage
- Muestra: destinatario, fecha, asunto y preview del contenido
- Útil para referencia y seguimiento

## 🎨 Diseño y Estilo

### Interfaz
- Diseño moderno con colores corporativos (#FF6B6B)
- Formulario intuitivo y fácil de usar
- Responsive design para diferentes dispositivos
- Íconos SVG para mejor apariencia

### Plantilla de Email
- Header con logo y nombre de Kueni Kueni
- Diseño profesional y atractivo
- Saludo personalizado con nombre del socio
- Firma del equipo
- Footer con información de contacto y redes sociales
- Enlaces a Facebook e Instagram

## 🔧 Implementación Técnica

### Archivos Creados

1. **admin-mensajes.html**
   - Vista principal del sistema de mensajes
   - Formulario completo con todas las funcionalidades

2. **styles/admin-mensajes.css**
   - Estilos específicos para la página de mensajes
   - ~400 líneas de CSS bien estructurado
   - Responsive y con animaciones

3. **javaScript/admin-mensajes.js**
   - Lógica completa del sistema
   - Integración con Supabase
   - Manejo de plantillas y vista previa
   - Envío de correos
   - Gestión del historial

4. **email-server/email-server.js** (endpoint agregado)
   - Nuevo endpoint: `/send-custom-message`
   - Usa la API de Brevo
   - Template HTML profesional

### Nuevo Endpoint de API

```javascript
POST https://kuenikueniapp17-11-2-0.onrender.com/send-custom-message

Body:
{
  "email": "socio@example.com",
  "nombre": "Juan Pérez",
  "asunto": "Gracias por tu apoyo",
  "mensaje": "Contenido del mensaje personalizado..."
}

Response (success):
{
  "success": true,
  "message": "Mensaje enviado correctamente",
  "messageId": "brevo-message-id"
}
```

### Integración con Base de Datos
- Lee la lista de socios desde la tabla `perfiles` en Supabase
- Filtro: solo usuarios con `rol = 'socio'`
- Campos utilizados: id, nombre_completo, email

## 📱 Flujo de Usuario

1. Admin entra a "Enviar Mensajes"
2. Selecciona un socio del listado
3. (Opcional) Carga una plantilla predefinida
4. Personaliza el asunto y mensaje
5. Revisa la vista previa
6. Hace clic en "Enviar Mensaje"
7. Aparece modal de confirmación
8. Confirma el envío
9. Sistema muestra loading mientras envía
10. Mensaje enviado → Notificación de éxito
11. Mensaje guardado en historial

## 🔐 Seguridad

- Verificación de autenticación con Supabase
- Validación de rol de administrador
- Validación de datos en frontend y backend
- Manejo de errores completo
- Protección contra inyección de código

## ✨ Características Adicionales

### Modal de Confirmación
- Previene envíos accidentales
- Muestra nombre y email del destinatario
- Opciones: Cancelar / Confirmar envío

### Loading Overlay
- Spinner animado durante el envío
- Mensaje de estado: "Enviando mensaje..."
- Bloquea la interfaz mientras procesa

### Notificaciones
- Notificación verde de éxito
- Notificación roja de error
- Auto-desaparecen después de 3 segundos
- Animación smooth de entrada/salida

### Botón Limpiar
- Resetea todo el formulario
- Limpia selección de socio
- Borra contenido del editor
- Resetea vista previa

## 📝 Variables en Mensajes

### Uso de {nombre}
```
Hola {nombre},

Gracias por ser parte de nuestra familia...
```

Se convierte automáticamente en:
```
Hola Juan Pérez,

Gracias por ser parte de nuestra familia...
```

## 🎯 Mejoras Futuras (Sugerencias)

1. **Envío masivo**: Seleccionar múltiples socios
2. **Plantillas guardadas**: Admin puede guardar sus propias plantillas
3. **Adjuntos**: Permitir adjuntar archivos
4. **Programación**: Enviar mensajes en fecha/hora específica
5. **Respuestas**: Sistema para ver respuestas de los socios
6. **Analytics**: Estadísticas de emails abiertos, clicks, etc.
7. **Filtros avanzados**: Segmentar socios por categorías

## 📍 Ubicación de Archivos

```
KueniKueniApp17-11-2.0-1/
├── admin-mensajes.html           # Nueva vista
├── styles/
│   └── admin-mensajes.css        # Nuevos estilos
├── javaScript/
│   └── admin-mensajes.js         # Nueva lógica
└── email-server/
    └── email-server.js           # Endpoint agregado
```

## 🚀 Actualización del Menú

La opción "Enviar Mensajes" se agregó al menú lateral en:
- ✅ admin-dashboard.html
- ✅ admin-eventos.html
- ⚠️ Pendiente actualizar otros archivos admin-*.html

### Código del Menú
```html
<a href="admin-mensajes.html" class="nav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
    <span>Enviar Mensajes</span>
</a>
```

## ✅ Testing

### Pruebas Recomendadas
1. Seleccionar diferentes socios
2. Probar cada plantilla
3. Editar y personalizar mensajes
4. Verificar variable {nombre}
5. Probar vista previa
6. Enviar mensaje real
7. Verificar recepción del email
8. Comprobar formato del email
9. Revisar historial
10. Probar botón limpiar

## 📧 Formato del Email

El email enviado incluye:
- Header con gradiente rojo corporativo
- Logo de Kueni Kueni (SVG)
- Saludo personalizado
- Contenido del mensaje (conserva saltos de línea)
- Firma elegante
- Footer con:
  - Logo footer
  - Información de la asociación
  - Dirección física
  - Enlaces a redes sociales
  - Copyright

## 🎨 Colores Corporativos Utilizados

- Primario: `#FF6B6B` (Rojo/Rosa)
- Secundario: `#FF5252` (Rojo más intenso)
- Texto: `#333333`
- Gris claro: `#F3F4F6`
- Gris medio: `#6B7280`
- Gris oscuro: `#374151`

## 🌐 Deployment

El servidor de correos ya está desplegado en:
- URL: `https://kuenikueniapp17-11-2-0.onrender.com`
- El nuevo endpoint está disponible automáticamente
- No requiere re-despliegue (auto-deploy activado)

## 📚 Documentación Adicional

Para más información sobre el servidor de correos y configuración de Brevo, consulta:
- `LEEME-EQUIPO.md`
- `SERVIDOR-DESPLEGADO.md`

---

**Fecha de Implementación**: Diciembre 2024
**Desarrollado para**: Kueni Kueni - Paso a Paso
**Versión**: 1.0
