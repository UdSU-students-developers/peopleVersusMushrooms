declare module '*.png' {
  const src: string;
  export default src;
}

declare module 'md5' {
  function md5(value: string): string;
  export = md5;
}
