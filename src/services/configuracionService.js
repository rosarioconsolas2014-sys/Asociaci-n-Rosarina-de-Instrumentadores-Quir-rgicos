import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore, initLocalStore } from './supabase.js';
import { INITIAL_CONFIGURACION } from './mockData.js';

initLocalStore();

export const configuracionService = {
  async getConfiguracion() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('key', 'institucional')
        .single();
      if (!error && data?.value) {
        return data.value;
      }
    }
    return getLocalStore('CONFIGURACION', INITIAL_CONFIGURACION);
  },

  async updateConfiguracion(nuevoValor) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('configuracion')
        .upsert({
          key: 'institucional',
          value: nuevoValor,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data.value;
    }

    setLocalStore('CONFIGURACION', nuevoValor);
    return nuevoValor;
  },
};
