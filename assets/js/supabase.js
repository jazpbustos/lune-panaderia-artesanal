window.LuneSupabase = (() => {
  const config = window.LUNE_CONFIG || {};
  const canConnect = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = canConnect
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

  return {
    client,
    isReady: Boolean(client)
  };
})();
