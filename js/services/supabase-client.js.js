/* ==========================================
   remarket-db - Cliente de Supabase
   Conexión con la base de datos
   ========================================== */

import { CONFIG } from '../config.js';

// Configuración del cliente de Supabase
// Nota: En producción, usar la librería oficial @supabase/supabase-js
// Por ahora, implementación ligera con fetch

class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
    this.headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Realiza una consulta a una tabla
   * @param {string} tabla - Nombre de la tabla
   * @returns {Object} Objeto con métodos de consulta
   */
  from(tabla) {
    return {
      select: (columns = '*') => this._buildQuery(tabla, 'select', columns),
      insert: (data) => this._buildQuery(tabla, 'insert', null, data),
      update: (data) => this._buildQuery(tabla, 'update', null, data),
      delete: () => this._buildQuery(tabla, 'delete', null)
    };
  }

  /**
   * Construye y ejecuta una consulta
   */
  _buildQuery(tabla, metodo, columns, data) {
    let url = `${this.url}/rest/v1/${tabla}`;
    let options = {
      method: 'GET',
      headers: this.headers
    };

    switch (metodo) {
      case 'select':
        url += `?select=${columns}`;
        break;
      case 'insert':
        options.method = 'POST';
        options.body = JSON.stringify(data);
        break;
      case 'update':
        options.method = 'PATCH';
        options.body = JSON.stringify(data);
        break;
      case 'delete':
        options.method = 'DELETE';
        break;
    }

    return {
      eq: (column, value) => {
        url += `&${column}=eq.${value}`;
        return this._executeQuery(url, options);
      },
      ilike: (column, value) => {
        url += `&${column}=ilike.${value}`;
        return this._executeQuery(url, options);
      },
      order: (column, { ascending = true } = {}) => {
        url += `&order=${column}.${ascending ? 'asc' : 'desc'}`;
        return this._executeQuery(url, options);
      },
      single: () => {
        url += '&limit=1';
        return this._executeQuery(url, options).then(result => {
          if (result.data && Array.isArray(result.data)) {
            return { data: result.data[0], error: result.error };
          }
          return result;
        });
      },
      then: (resolve, reject) => {
        this._executeQuery(url, options).then(resolve).catch(reject);
      }
    };
  }

  /**
   * Ejecuta la consulta HTTP
   */
  async _executeQuery(url, options) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error en consulta Supabase:', error);
      return { data: null, error };
    }
  }

  /**
   * Autenticación de usuarios
   */
  get auth() {
    return {
      getUser: async () => {
        try {
          const response = await fetch(`${this.url}/auth/v1/user`, {
            headers: this.headers
          });
          if (!response.ok) return { data: { user: null }, error: new Error('No autenticado') };
          const user = await response.json();
          return { data: { user }, error: null };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
      signInWithPassword: async ({ email, password }) => {
        try {
          const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ email, password })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error_description || 'Error de autenticación');
          localStorage.setItem('supabase_token', data.access_token);
          return { data: { user: data.user, session: data }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      signUp: async ({ email, password }) => {
        try {
          const response = await fetch(`${this.url}/auth/v1/signup`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ email, password })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error_description || 'Error de registro');
          return { data: { user: data.user }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      signOut: async () => {
        localStorage.removeItem('supabase_token');
        return { error: null };
      }
    };
  }

  /**
   * Almacenamiento (Storage)
   */
  get storage() {
    return {
      from: (bucket) => ({
        upload: async (path, file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${this.url}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.anonKey}`
              },
              body: formData
            });
            if (!response.ok) throw new Error('Error al subir archivo');
            return { data: { path }, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        getPublicUrl: (path) => {
          return {
            data: {
              publicUrl: `${this.url}/storage/v1/object/public/${bucket}/${path}`
            }
          };
        }
      })
    };
  }
}

// Crear instancia del cliente
export const supabase = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

export default supabase;