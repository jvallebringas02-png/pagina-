/* ==========================================
   remarket-db - Módulo de Modales
   Control de apertura/cierre de ventanas emergentes
   ========================================== */

// Estado de modales activos
const modalesActivos = new Set();

/**
 * Abre un modal específico
 * @param {string} tipo - Tipo de modal (publicar, login, registro, etc.)
 * @param {Object} datos - Datos opcionales para el modal
 */
export async function abrirModal(tipo, datos = {}) {
  try {
    // Cargar el template del modal
    const template = await cargarTemplate(`modal-${tipo}.html`);
    
    // Crear el overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay activo';
    overlay.id = `modal-${tipo}`;
    overlay.innerHTML = template;
    
    // Agregar al DOM
    document.body.appendChild(overlay);
    modalesActivos.add(tipo);
    
    // Inicializar funcionalidades específicas del modal
    inicializarModal(tipo, datos);
    
    console.log(`✅ Modal ${tipo} abierto`);
  } catch (error) {
    console.error(`❌ Error al abrir modal ${tipo}:`, error);
  }
}

/**
 * Cierra un modal específico
 * @param {string} tipo - Tipo de modal a cerrar
 */
export function cerrarModal(tipo) {
  const modal = document.getElementById(`modal-${tipo}`);
  if (modal) {
    modal.classList.remove('activo');
    setTimeout(() => {
      modal.remove();
      modalesActivos.delete(tipo);
      console.log(`✅ Modal ${tipo} cerrado`);
    }, 300);
  }
}

/**
 * Cierra todos los modales activos
 */
export function cerrarTodosLosModales() {
  modalesActivos.forEach(tipo => cerrarModal(tipo));
}

/**
 * Carga un template HTML desde la carpeta templates/
 * @param {string} nombre - Nombre del archivo template
 * @returns {Promise<string>} HTML del template
 */
async function cargarTemplate(nombre) {
  try {
    const response = await fetch(`templates/${nombre}`);
    if (!response.ok) throw new Error(`Template no encontrado: ${nombre}`);
    return await response.text();
  } catch (error) {
    console.error(` Error cargando template ${nombre}:`, error);
    return `<div class="modal-content"><div class="modal-body"><p>Error al cargar el modal</p></div></div>`;
  }
}

/**
 * Inicializa funcionalidades específicas de cada modal
 * @param {string} tipo - Tipo de modal
 * @param {Object} datos - Datos para el modal
 */
function inicializarModal(tipo, datos) {
  switch (tipo) {
    case 'publicar':
      inicializarModalPublicar();
      break;
    case 'login':
      inicializarModalLogin();
      break;
    case 'registro':
      inicializarModalRegistro();
      break;
    case 'configuracion':
      inicializarModalConfiguracion(datos);
      break;
    case 'compartir':
      inicializarModalCompartir(datos);
      break;
    case 'reportar':
      inicializarModalReportar(datos);
      break;
    case 'qr':
      inicializarModalQR(datos);
      break;
    case 'declaracion-chat':
      inicializarDeclaracionChat();
      break;
  }
}

/**
 * Inicializa el modal de Publicar
 */
function inicializarModalPublicar() {
  // Validación de título (máximo 100 caracteres)
  const tituloInput = document.getElementById('titulo-publicacion');
  const contadorTitulo = document.getElementById('contador-titulo');
  if (tituloInput && contadorTitulo) {
    tituloInput.addEventListener('input', (e) => {
      const longitud = e.target.value.length;
      contadorTitulo.textContent = `${longitud}/100`;
      if (longitud > 100) {
        e.target.value = e.target.value.substring(0, 100);
        contadorTitulo.textContent = '100/100';
      }
    });
  }

  // Validación de descripción (máximo 500 caracteres)
  const descInput = document.getElementById('descripcion-publicacion');
  const contadorDesc = document.getElementById('contador-descripcion');
  if (descInput && contadorDesc) {
    descInput.addEventListener('input', (e) => {
      const longitud = e.target.value.length;
      contadorDesc.textContent = `${longitud}/500`;
      if (longitud > 500) {
        e.target.value = e.target.value.substring(0, 500);
        contadorDesc.textContent = '500/500';
      }
    });
  }

  // Selección de modalidad
  document.querySelectorAll('.opcion-modalidad').forEach(opcion => {
    opcion.addEventListener('click', (e) => {
      document.querySelectorAll('.opcion-modalidad').forEach(o => o.classList.remove('seleccionada'));
      e.currentTarget.classList.add('seleccionada');
    });
  });

  // Selección de alcance
  document.querySelectorAll('.opcion-alcance').forEach(opcion => {
    opcion.addEventListener('click', (e) => {
      document.querySelectorAll('.opcion-alcance').forEach(o => o.classList.remove('seleccionada'));
      e.currentTarget.classList.add('seleccionada');
    });
  });

  // Botón de continuar
  const btnContinuar = document.getElementById('btn-continuar-publicar');
  if (btnContinuar) {
    btnContinuar.addEventListener('click', () => {
      // Abrir modal de declaración jurada
      abrirModal('declaracion-jurada');
    });
  }
}

/**
 * Inicializa el modal de Login
 */
function inicializarModalLogin() {
  // Tabs de Login/Registro
  const tabs = document.querySelectorAll('.tab-login');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('activa'));
      e.target.classList.add('activa');
    });
  });
}

/**
 * Inicializa el modal de Registro
 */
function inicializarModalRegistro() {
  // Validación de contraseña
  const passwordInput = document.getElementById('password-registro');
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      if (password.length < 8) {
        passwordInput.style.borderColor = '#e74c3c';
      } else {
        passwordInput.style.borderColor = '#2ecc71';
      }
    });
  }
}

/**
 * Inicializa el modal de Configuración
 */
function inicializarModalConfiguracion(datos) {
  // Cargar intereses del usuario
  if (datos.intereses) {
    datos.intereses.forEach(interes => {
      const checkbox = document.querySelector(`input[value="${interes}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  // Guardar configuración
  const btnGuardar = document.getElementById('btn-guardar-config');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
      const intereses = Array.from(document.querySelectorAll('.interes-item input:checked'))
        .map(cb => cb.value);
      console.log('💾 Configuración guardada:', { intereses });
      cerrarModal('configuracion');
    });
  }
}

/**
 * Inicializa el modal de Compartir
 */
function inicializarModalCompartir(datos) {
  // Copiar enlace
  const btnCopiar = document.getElementById('btn-copiar-enlace');
  if (btnCopiar) {
    btnCopiar.addEventListener('click', () => {
      const enlace = `https://remarket-db.com/publicacion/${datos.id}`;
      navigator.clipboard.writeText(enlace).then(() => {
        alert('✅ Enlace copiado al portapapeles');
      });
    });
  }
}

/**
 * Inicializa el modal de Reportar
 */
function inicializarModalReportar(datos) {
  const btnEnviar = document.getElementById('btn-enviar-reporte');
  if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
      const motivo = document.getElementById('motivo-reporte').value;
      console.log('🚩 Reporte enviado:', { publicacionId: datos.id, motivo });
      alert('✅ Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.');
      cerrarModal('reportar');
    });
  }
}

/**
 * Inicializa el modal de QR
 */
function inicializarModalQR(datos) {
  // Generar código QR (simulado)
  const contenedorQR = document.getElementById('qr-imagen');
  if (contenedorQR) {
    contenedorQR.innerHTML = `<div style="font-size:8rem;text-align:center;">📱</div>`;
  }
}

/**
 * Inicializa la Declaración Jurada de Chat
 */
function inicializarDeclaracionChat() {
  const btnAceptar = document.getElementById('btn-aceptar-declaracion');
  if (btnAceptar) {
    btnAceptar.addEventListener('click', () => {
      console.log('✅ Declaración Jurada de Chat aceptada');
      cerrarModal('declaracion-chat');
    });
  }
}

// Cerrar modal al hacer clic en el overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const modalId = e.target.id.replace('modal-', '');
    cerrarModal(modalId);
  }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalesActivos.size > 0) {
    const ultimoModal = Array.from(modalesActivos).pop();
    cerrarModal(ultimoModal);
  }
});