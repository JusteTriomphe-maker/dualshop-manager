const { spawn } = require('child_process');

console.log('Démarrage de DualShop (Backend + Web)...');

// Utilisation de shell: true pour être compatible toutes plateformes (notamment Windows)
const backend = spawn('npm', ['run', 'backend:dev'], { stdio: 'inherit', shell: true });
const web = spawn('npm', ['run', 'web:dev'], { stdio: 'inherit', shell: true });

function cleanup() {
  console.log('\nArrêt des serveurs DualShop...');
  try {
    backend.kill();
  } catch (e) {}
  try {
    web.kill();
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Le backend s'est arrêté avec le code d'erreur ${code}`);
  } else {
    console.log('Le backend s\'est arrêté.');
  }
  cleanup();
});

web.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Le serveur web s'est arrêté avec le code d'erreur ${code}`);
  } else {
    console.log('Le serveur web s\'est arrêté.');
  }
  cleanup();
});
