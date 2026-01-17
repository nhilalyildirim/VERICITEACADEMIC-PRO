// Replaces /// <reference types="vite/client" /> to avoid "Cannot find type definition file" error

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'mammoth';
declare module 'pdfjs-dist';
