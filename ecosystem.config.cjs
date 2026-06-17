module.exports = {
  apps: [{
    name: 'express-api',
    script: './src/index.mjs',
    instances: 2,
    exec_mode: 'cluster',
  }],
};
