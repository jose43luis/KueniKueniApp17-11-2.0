// registro.js - Sistema de registro con validaciones completas

const EMAIL_SERVER_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    const registroForm = document.getElementById('registroForm');
    const nombreInput = document.getElementById('nombreCompleto');
    const emailInput = document.getElementById('email');
    const telefonoInput = document.getElementById('telefono');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    
    // Validación en tiempo real
    nombreInput.addEventListener('input', () => validarNombre());
    nombreInput.addEventListener('blur', () => validarNombre());
    
    emailInput.addEventListener('blur', () => validarEmail());
    
    telefonoInput.addEventListener('input', () => validarTelefono());
    telefonoInput.addEventListener('blur', () => validarTelefono());
    
    passwordInput.addEventListener('input', () => {
        validarPassword();
        mostrarRequisitosPassword();
    });
    passwordInput.addEventListener('focus', () => {
        document.getElementById('passwordRequirements').style.display = 'block';
    });
    
    passwordConfirmInput.addEventListener('input', () => validarPasswordConfirm());
    
    registroForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await procesarRegistro();
    });
});

/**
 * Validar nombre completo (solo letras y espacios)
 */
function validarNombre() {
    const nombre = document.getElementById('nombreCompleto').value.trim();
    const nombreError = document.getElementById('nombreError');
    
    if (!nombre) {
        nombreError.textContent = 'El nombre completo es obligatorio';
        return false;
    }
    
    // Solo letras, espacios y acentos
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombre)) {
        nombreError.textContent = 'El nombre solo puede contener letras';
        return false;
    }
    
    if (nombre.length < 3) {
        nombreError.textContent = 'El nombre debe tener al menos 3 caracteres';
        return false;
    }
    
    nombreError.textContent = '';
    return true;
}

/**
 * Validar email con dominios permitidos
 */
function validarEmail() {
    const email = document.getElementById('email').value.trim();
    const emailError = document.getElementById('emailError');
    
    if (!email) {
        emailError.textContent = 'El correo electrónico es obligatorio';
        return false;
    }
    
    // Validar formato básico
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        emailError.textContent = 'Formato de correo inválido';
        return false;
    }
    
    // Validar dominios permitidos
    const dominiosPermitidos = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
        'live.com', 'icloud.com', 'protonmail.com'
    ];
    
    const dominio = email.split('@')[1].toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
        emailError.textContent = 'Solo se permiten dominios comunes (gmail, hotmail, outlook, yahoo)';
        return false;
    }
    
    emailError.textContent = '';
    return true;
}

/**
 * Validar teléfono (solo números, 10 dígitos)
 */
function validarTelefono() {
    const telefono = document.getElementById('telefono').value.trim();
    const telefonoError = document.getElementById('telefonoError');
    
    // Eliminar caracteres no numéricos
    const telefonoLimpio = telefono.replace(/\D/g, '');
    document.getElementById('telefono').value = telefonoLimpio;
    
    if (!telefonoLimpio) {
        telefonoError.textContent = 'El teléfono es obligatorio';
        return false;
    }
    
    if (telefonoLimpio.length !== 10) {
        telefonoError.textContent = 'El teléfono debe tener exactamente 10 dígitos';
        return false;
    }
    
    telefonoError.textContent = '';
    return true;
}

/**
 * Validar contraseña con requisitos de seguridad
 */
function validarPassword() {
    const password = document.getElementById('password').value;
    const passwordError = document.getElementById('passwordError');
    
    const requisitos = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
    
    // Actualizar visualización de requisitos
    document.getElementById('req-length').className = requisitos.length ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-uppercase').className = requisitos.uppercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-lowercase').className = requisitos.lowercase ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-number').className = requisitos.number ? 'requirement valid' : 'requirement invalid';
    document.getElementById('req-special').className = requisitos.special ? 'requirement valid' : 'requirement invalid';
    
    // Verificar si cumple todos los requisitos
    const todosValidos = Object.values(requisitos).every(v => v);
    
    if (!password) {
        passwordError.textContent = 'La contraseña es obligatoria';
        return false;
    }
    
    if (!todosValidos) {
        passwordError.textContent = 'La contraseña no cumple con todos los requisitos';
        return false;
    }
    
    // Mostrar fortaleza
    const fortaleza = calcularFortaleza(requisitos);
    mostrarFortaleza(fortaleza);
    
    passwordError.textContent = '';
    return true;
}

/**
 * Calcular fortaleza de la contraseña
 */
function calcularFortaleza(requisitos) {
    const cumplidos = Object.values(requisitos).filter(v => v).length;
    
    if (cumplidos === 5) return 'strong';
    if (cumplidos >= 3) return 'medium';
    return 'weak';
}

/**
 * Mostrar fortaleza de la contraseña
 */
function mostrarFortaleza(fortaleza) {
    const strengthDiv = document.getElementById('passwordStrength');
    strengthDiv.style.display = 'block';
    
    const textos = {
        weak: 'Contraseña débil',
        medium: 'Contraseña media',
        strong: 'Contraseña fuerte'
    };
    
    strengthDiv.textContent = textos[fortaleza];
    strengthDiv.className = `password-strength strength-${fortaleza}`;
}

/**
 * Mostrar requisitos de contraseña
 */
function mostrarRequisitosPassword() {
    document.getElementById('passwordRequirements').style.display = 'block';
}

/**
 * Validar confirmación de contraseña
 */
function validarPasswordConfirm() {
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const passwordConfirmError = document.getElementById('passwordConfirmError');
    
    if (!passwordConfirm) {
        passwordConfirmError.textContent = 'Debes confirmar tu contraseña';
        return false;
    }
    
    if (password !== passwordConfirm) {
        passwordConfirmError.textContent = 'Las contraseñas no coinciden';
        return false;
    }
    
    passwordConfirmError.textContent = '';
    return true;
}

/**
 * Procesar registro
 */
async function procesarRegistro() {
    // Validar todos los campos
    const nombreValido = validarNombre();
    const emailValido = validarEmail();
    const telefonoValido = validarTelefono();
    const passwordValido = validarPassword();
    const passwordConfirmValido = validarPasswordConfirm();
    
    if (!nombreValido || !emailValido || !telefonoValido || !passwordValido || !passwordConfirmValido) {
        mostrarMensaje('Por favor corrige los errores en el formulario', 'error');
        return;
    }
    
    // Obtener valores
    const nombre = document.getElementById('nombreCompleto').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const password = document.getElementById('password').value;
    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;
    
    const registroBtn = document.getElementById('registroBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    try {
        // Mostrar loader
        registroBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        
        console.log('Registrando usuario:', email, 'Tipo:', tipoUsuario);
        
        // Verificar que el cliente de Supabase esté inicializado
        if (!window.supabaseClient) {
            throw new Error('Cliente de Supabase no inicializado');
        }
        
        // Verificar si el email ya existe
        const { data: usuarioExistente } = await window.supabaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .limit(1);
        
        if (usuarioExistente && usuarioExistente.length > 0) {
            mostrarMensaje('Este correo ya está registrado. Intenta iniciar sesión.', 'error');
            return;
        }
        
        // Crear usuario
        const { data: nuevoUsuario, error: errorUsuario } = await window.supabaseClient
            .from('usuarios')
            .insert({
                email: email,
                password_hash: password,
                nombre_completo: nombre,
                telefono: telefono,
                tipo_usuario: tipoUsuario,
                estado: 'activo'
            })
            .select()
            .single();
        
        if (errorUsuario) {
            console.error('Error al crear usuario:', errorUsuario);
            throw errorUsuario;
        }
        
        console.log('✅ Usuario creado:', nuevoUsuario.email);
        
        // Si es socio, crear registro en tabla socios
        if (tipoUsuario === 'socio') {
            console.log('Creando registro de socio...');
            
            const { error: errorSocio } = await window.supabaseClient
                .from('socios')
                .insert({
                    usuario_id: nuevoUsuario.id,
                    fecha_ingreso: new Date().toISOString().split('T')[0],
                    estado: 'activo',
                    total_eventos_asistidos: 0,
                    total_donaciones: 0
                });
            
            if (errorSocio) {
                console.error('Error al crear socio:', errorSocio);
            } else {
                console.log('✅ Socio creado exitosamente');
            }
        }
        
        // Enviar correo de bienvenida
        try {
            console.log('📧 Enviando correo de bienvenida...');
            const emailResponse = await fetch(`${EMAIL_SERVER_URL}/send-welcome-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: nuevoUsuario.email,
                    nombre: nuevoUsuario.nombre_completo
                })
            });
            
            if (emailResponse.ok) {
                console.log('✅ Correo de bienvenida enviado');
            } else {
                console.log('⚠️ No se pudo enviar correo (no crítico)');
            }
        } catch (emailError) {
            console.log('⚠️ Error al enviar correo (no crítico):', emailError);
        }
        
        mostrarMensaje(`¡Cuenta de ${tipoUsuario} creada exitosamente! Revisa tu correo.`, 'success');
        
        // Limpiar formulario
        document.getElementById('registroForm').reset();
        document.getElementById('passwordRequirements').style.display = 'none';
        document.getElementById('passwordStrength').style.display = 'none';
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = 'login.html?registered=true&tipo=' + tipoUsuario;
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarMensaje('Error al crear la cuenta. Por favor intenta de nuevo.', 'error');
    } finally {
        registroBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Mostrar mensaje
 */
function mostrarMensaje(mensaje, tipo) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${tipo}`;
    messageDiv.textContent = mensaje;
    container.appendChild(messageDiv);
    
    if (tipo !== 'success') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.3s';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
}

// Estilos adicionales
const style = document.createElement('style');
style.textContent = `
    .loader {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    #btnLoader {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .message {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: opacity 0.3s;
    }
    
    .message-error {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    .message-success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }
    
    .requirement {
        font-size: 0.875rem;
        padding: 4px 0;
    }
    
    .requirement.valid {
        color: #059669;
    }
    
    .requirement.valid::before {
        content: '✓ ';
    }
    
    .requirement.invalid {
        color: #dc2626;
    }
    
    .requirement.invalid::before {
        content: '✗ ';
    }
    
    .password-strength {
        margin-top: 0.5rem;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 600;
    }
    
    .strength-weak {
        background: #fee2e2;
        color: #dc2626;
    }
    
    .strength-medium {
        background: #fef3c7;
        color: #d97706;
    }
    
    .strength-strong {
        background: #d1fae5;
        color: #059669;
    }
`;
document.head.appendChild(style);
