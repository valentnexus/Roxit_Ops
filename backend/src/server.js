const env = require('./config/env');

try {
  env.assertConfig();
} catch (err) {
  console.error(`\n[CONFIG ERROR] ${err.message}\n`);
  process.exit(1);
}

const app = require('./app');

app.listen(env.port, () => {
  console.log(`Roxit Ops API berjalan di http://localhost:${env.port}  (${env.nodeEnv})`);
});
