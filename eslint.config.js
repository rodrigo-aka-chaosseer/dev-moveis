const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  // Os index.ts das Edge Functions rodam no Deno (imports `npm:` e global
  // `Deno`), que o resolvedor do ESLint do app não entende. São checados com
  // `deno check`; o `_shared` puro continua no lint normal.
  { ignores: ["dist/*", ".expo/*", "supabase/functions/**/index.ts"] },
];
