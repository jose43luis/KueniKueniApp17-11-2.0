// donante-socio.js - Conversión de Donante a Socio

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Página Ser Socio inicializada');
    
    // ============================================
    // VERIFICAR AUTENTICACIÓN
    // ============================================
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    
    if (!isLoggedIn || userType !== 'donante') {
        console.warn('Acceso denegado: Usuario no es donante');
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar cliente Supabase
    if (!window.supabaseClient) {
        console.error('Error: Cliente Supabase no inicializado');
        mostrarMensajeError('Error de configuración. Por favor, recarga la página.');
        return;
    }
    
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================
    const btnConvertirSocio = document.getElementById('btnConvertirSocio');
    const confirmModal = document.getElementById('confirmModal');
    const closeModalBtn = document.getElementById('closeModal');
    const btnCancelar = document.getElementById('btnCancelar');
    const btnConfirmar = document.getElementById('btnConfirmar');
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Abrir modal de confirmación
    if (btnConvertirSocio) {
        btnConvertirSocio.addEventListener('click', function() {
            console.log('📋 Abriendo modal de confirmación');
            confirmModal.style.display = 'flex';
        });
    }
    
    // Cerrar modal - botón X
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', cerrarModal);
    }
    
    // Cerrar modal - botón Cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModal);
    }
    
    // Cerrar modal - click fuera
    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            cerrarModal();
        }
    });
    
    // Cerrar modal - tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && confirmModal.style.display === 'flex') {
            cerrarModal();
        }
    });
    
    // Confirmar conversión
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarConversion);
    }
    
    // ============================================
    // FUNCIONES
    // ============================================
    
    function cerrarModal() {
        console.log('❌ Cerrando modal');
        confirmModal.style.display = 'none';
    }
    
    async function confirmarConversion() {
        console.log('🔄 Iniciando proceso de conversión a socio');
        
        const btnText = btnConfirmar.querySelector('.btn-text');
        const btnLoader = btnConfirmar.querySelector('.btn-loader');
        
        // Obtener datos del usuario
        const userId = sessionStorage.getItem('userId');
        const userEmail = sessionStorage.getItem('userEmail');
        const userName = sessionStorage.getItem('userName');
        
        if (!userId || !userEmail) {
            console.error('Error: Faltan datos del usuario');
            mostrarMensajeError('Error: No se encontraron los datos del usuario');
            return;
        }
        
        try {
            // Deshabilitar botón y mostrar loader
            btnConfirmar.disabled = true;
            btnCancelar.disabled = true;
            closeModalBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-flex';
            
            console.log('📊 Datos del usuario:', { userId, userEmail, userName });
            
            // ============================================
            // PASO 1: Verificar que el usuario existe y es donante
            // ============================================
            console.log('1️⃣ Verificando usuario...');
            
            const { data: usuario, error: errorUsuario } = await window.supabaseClient
                .from('usuarios')
                .select('id, tipo_usuario, email, nombre_completo')
                .eq('id', userId)
                .single();
            
            if (errorUsuario) {
                console.error('Error al verificar usuario:', errorUsuario);
                throw new Error('No se pudo verificar tu cuenta. Intenta nuevamente.');
            }
            
            if (!usuario) {
                console.error('Usuario no encontrado en la base de datos');
                throw new Error('No se encontró tu cuenta en la base de datos.');
            }
            
            if (usuario.tipo_usuario !== 'donante') {
                console.warn('El usuario ya no es donante:', usuario.tipo_usuario);
                
                if (usuario.tipo_usuario === 'socio') {
                    mostrarMensajeExito('¡Ya eres socio! Redirigiendo...');
                    setTimeout(() => {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    throw new Error('Tu tipo de cuenta no permite esta conversión.');
                }
                return;
            }
            
            console.log('✅ Usuario verificado correctamente');
            
            // ============================================
            // PASO 2: Verificar que NO existe ya como socio
            // ============================================
            console.log('2️⃣ Verificando si ya existe en tabla socios...');
            
            const { data: socioExistente, error: errorVerificarSocio } = await window.supabaseClient
                .from('socios')
                .select('id')
                .eq('usuario_id', userId)
                .maybeSingle();
            
            if (errorVerificarSocio && errorVerificarSocio.code !== 'PGRST116') {
                console.error('Error al verificar socio:', errorVerificarSocio);
                throw new Error('Error al verificar tu estado de socio.');
            }
            
            if (socioExistente) {
                console.warn('El usuario ya existe en la tabla socios');
                mostrarMensajeInfo('Ya tienes un perfil de socio. Actualizando tu cuenta...');
                
                // Solo actualizar tipo_usuario
                const { error: errorUpdate } = await window.supabaseClient
                    .from('usuarios')
                    .update({ tipo_usuario: 'socio' })
                    .eq('id', userId);
                
                if (errorUpdate) {
                    console.error('Error al actualizar usuario:', errorUpdate);
                    throw new Error('Error al actualizar tu cuenta.');
                }
                
                mostrarMensajeExito('¡Conversión exitosa! Redirigiendo...');
                setTimeout(() => {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            console.log('✅ No existe registro previo en tabla socios');
            
            // ============================================
            // PASO 3: Calcular total de donaciones del usuario
            // ============================================
            console.log('3️⃣ Calculando total de donaciones...');
            
            const { data: donaciones, error: errorDonaciones } = await window.supabaseClient
                .from('donaciones')
                .select('monto')
                .eq('donante_email', userEmail)
                .eq('estado_pago', 'completado');
            
            let totalDonaciones = 0;
            if (donaciones && donaciones.length > 0) {
                totalDonaciones = donaciones.reduce((sum, d) => sum + parseFloat(d.monto), 0);
                console.log(`✅ Total donaciones: $${totalDonaciones}`);
            } else {
                console.log('ℹ️ No hay donaciones previas');
            }
            
            // ============================================
            // PASO 4: Actualizar tipo_usuario en tabla usuarios
            // ============================================
            console.log('4️⃣ Actualizando tipo de usuario a "socio"...');
            
            const { error: errorActualizarUsuario } = await window.supabaseClient
                .from('usuarios')
                .update({ 
                    tipo_usuario: 'socio',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
            
            if (errorActualizarUsuario) {
                console.error('Error al actualizar usuario:', errorActualizarUsuario);
                throw new Error('Error al actualizar tu tipo de cuenta.');
            }
            
            console.log('✅ Tipo de usuario actualizado correctamente');
            
            // ============================================
            // PASO 5: Crear registro en tabla socios
            // ============================================
            console.log('5️⃣ Creando registro en tabla socios...');
            
            const { data: nuevoSocio, error: errorCrearSocio } = await window.supabaseClient
                .from('socios')
                .insert({
                    usuario_id: userId,
                    fecha_ingreso: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                    total_eventos_asistidos: 0,
                    total_donaciones: totalDonaciones,
                    estado: 'activo',
                    notas: `Convertido de donante a socio el ${new Date().toLocaleDateString('es-MX')}`
                })
                .select()
                .single();
            
            if (errorCrearSocio) {
                console.error('Error al crear socio:', errorCrearSocio);
                
                // Si falla, intentar revertir el cambio en usuarios
                console.warn('⚠️ Revirtiendo cambio en tabla usuarios...');
                await window.supabaseClient
                    .from('usuarios')
                    .update({ tipo_usuario: 'donante' })
                    .eq('id', userId);
                
                throw new Error('Error al crear tu perfil de socio. Los cambios fueron revertidos.');
            }
            
            console.log('✅ Registro de socio creado:', nuevoSocio);
            
            // ============================================
            // PASO 6: Limpiar sesión y redirigir
            // ============================================
            console.log('6️⃣ Conversión completada exitosamente');
            
            mostrarMensajeExito('¡Felicidades! Ya eres socio de Kueni Kueni');
            
            // Esperar 2 segundos y redirigir al login
            setTimeout(() => {
                console.log('🔄 Limpiando sesión y redirigiendo...');
                sessionStorage.clear();
                window.location.href = 'login.html?mensaje=socio_nuevo';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error en el proceso de conversión:', error);
            
            // Mostrar mensaje de error
            mostrarMensajeError(error.message || 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
            
            // Reactivar botones
            btnConfirmar.disabled = false;
            btnCancelar.disabled = false;
            closeModalBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }
    
    // ============================================
    // FUNCIONES DE MENSAJES
    // ============================================
    
    function mostrarMensajeError(mensaje) {
        mostrarMensaje(mensaje, 'error');
    }
    
    function mostrarMensajeExito(mensaje) {
        mostrarMensaje(mensaje, 'success');
    }
    
    function mostrarMensajeInfo(mensaje) {
        mostrarMensaje(mensaje, 'info');
    }
    
    function mostrarMensaje(mensaje, tipo) {
        let container = document.getElementById('messageContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'messageContainer';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 99999; max-width: 400px;';
            document.body.appendChild(container);
        }
        
        // Limpiar mensajes anteriores
        container.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${tipo}`;
        messageDiv.textContent = mensaje;
        
        const estilos = {
            error: 'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;',
            success: 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;',
            info: 'background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;'
        };
        
        messageDiv.style.cssText = `
            padding: 1rem 1.5rem;
            margin-bottom: 0.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            font-weight: 500;
            ${estilos[tipo] || estilos.info}
        `;
        
        container.appendChild(messageDiv);
        
        // Auto-cerrar solo si no es success (porque el success redirige)
        if (tipo !== 'success') {
            setTimeout(() => {
                messageDiv.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => messageDiv.remove(), 300);
            }, 5000);
        }
    }
    
    console.log('✅ Sistema de conversión a socio listo');
});

// ============================================
// ESTILOS DE ANIMACIÓN
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .message {
        display: block;
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);