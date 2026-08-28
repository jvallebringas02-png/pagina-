/* ==========================================
   remarket-db - Módulo de Autenticación
   Login, Registro, Sesión
   ========================================== */

import { supabase } from '../services/supabase-client.js';
import { CONFIG } from '../config.js';

// Estado de autenticación
let usuarioActual = null;

/**
 * Inicializa el módulo de autenticación
 */
export async function inicializarAuth() {
  console.log('🔐 Inicializando autenticación...');
  
  // Verificar si hay sesión activa
  const { data, error } = await supabase.auth.getUser();
  
  if (data?.user) {
    usuarioActual = data.user;
    console.log('✅ Sesión activa:', usuarioActual.email);
    actualizarUIUsuario(usuarioActual);
  } else {
    console.log('ℹ️ No hay sesión activa');
  }
}

/**
 * Inicia sesión con email y contraseña
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Resultado del login
 */
export async function iniciarSesion(email, password) {
  try {
    console.log('🔑 Iniciando sesión...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    usuarioActual = data.user;
    console.log('✅ Sesión iniciada:', usuarioActual.email);
    
    actualizarUIUsuario(usuarioActual);
    return { success: true, user: usuarioActual };

  } catch (error) {
    console.error('❌ Error en login:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Registra un nuevo usuario
 * @param {string} email
 * @param {string} password
 * @param {string} nombre
 * @returns {Promise<Object>} Resultado del registro
 */
export async function registrarse(email, password, nombre) {
  try {
    console.log('📝 Registrando usuario...');
    
    // Validar contraseña
    if (password.length < CONFIG.MIN_CONTRASENA_CARACTERES) {
      throw new Error(`La contraseña debe tener al menos ${CONFIG.MIN_CONTRASENA_CARACTERES} caracteres`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // Guardar nombre en la tabla de usuarios
    if (data.user) {
      await supabase.from('usuarios').insert({
        id: data.user.id,
        email: email,
        nombre: nombre,
        localidad: 'Trujillo',
        idioma: 'Español',
        intereses: ['General'],
        privacidad: 'Cualquier persona',
        alcance: 'Local'
      });
    }

    console.log('✅ Usuario registrado:', email);
    return { success: true, user: data.user };

  } catch (error) {
    console.error(' Error en registro:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía un Link Mágico (sin contraseña)
 * @param {string} email
 * @returns {Promise<Object>} Resultado
 */
export async function enviarLinkMagico(email) {
  try {
    console.log(' Enviando Link Mágico...');
    
    const { error } = await supabase.auth.signInWithOtp({
      email
    });

    if (error) throw error;

    console.log('✅ Link Mágico enviado a:', email);
    return { success: true };

  } catch (error) {
    console.error('❌ Error enviando Link Mágico:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cierra la sesión del usuario
 * @returns {Promise<Object>} Resultado
 */
export async function cerrarSesion() {
  try {
    console.log('🚪 Cerrando sesión...');
    
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    usuarioActual = null;
    console.log('✅ Sesión cerrada');
    
    actualizarUIUsuario(null);
    return { success: true };

  } catch (error) {
    console.error(' Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene el usuario actual
 * @returns {Object|null} Usuario actual
 */
export function getUsuarioActual() {
  return usuarioActual;
}

/**
 * Actualiza la UI según el estado de autenticación
 * @param {Object|null} user - Usuario o null
 */
function actualizarUIUsuario(user) {
  const btnUsuario = document.querySelector('.btn-usuario');
  const menuUsuario = document.querySelector('.menu-usuario');
  
  if (user) {
    // Usuario logueado
    if (btnUsuario) {
      btnUsuario.textContent = `👤 ${user.email.split('@')[0]}`;
    }
  } else {
    // Usuario no logueado
    if (btnUsuario) {
      btnUsuario.textContent = 'Mi Cuenta 👤';
    }
  }
}

/**
 * Valida el formato de email
 * @param {string} email
 * @returns {boolean}
 */
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida la fortaleza de la contraseña
 * @param {string} password
 * @returns {Object} Resultado de validación
 */
export function validarPassword(password) {
  if (password.length < CONFIG.MIN_CONTRASENA_CARACTERES) {
    return {
      valida: false,
      mensaje: `Mínimo ${CONFIG.MIN_CONTRASENA_CARACTERES} caracteres`
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return {
      valida: false,
      mensaje: 'Debe tener al menos una mayúscula'
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return {
      valida: false,
      mensaje: 'Debe tener al menos un número'
    };
  }
  
  return {
    valida: true,
    mensaje: 'Contraseña válida'
  };
}

export default {
  inicializarAuth,
  iniciarSesion,
  registrarse,
  enviarLinkMagico,
  cerrarSesion,
  getUsuarioActual,
  validarEmail,
  validarPassword
};