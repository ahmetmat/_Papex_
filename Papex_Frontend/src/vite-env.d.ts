/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REGISTRY_CONTRACT_ID?: string;
  readonly VITE_MARKETPLACE_CONTRACT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


