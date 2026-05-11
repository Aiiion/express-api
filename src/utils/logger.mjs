const isProduction = () => process.env.NODE_ENV === 'production';

export const devLog = (...args) => {
  if (isProduction()) return;
  console.log(...args);
};

export const devError = (...args) => {
  if (isProduction()) return;
  console.error(...args);
};
