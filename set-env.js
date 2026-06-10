const fs = require('fs');
const targetPath = './src/environments/environment.prod.ts';

const envConfigFile = `export const environment = {
  production: true,
  supabaseurl: 'https://ucboptqvvhbbikqfujve.supabase.co',
  supabasekey: 'sb_publishable_hLCLfWnggZ21PdpQvejAPQ_iMmkcy-y',
  geminiApiKey: '${process.env.GEMINI_API_KEY || ''}',
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Variables de entorno inyectadas exitosamente en environment.prod.ts');
