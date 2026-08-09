declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
      };
    };
    solflare?: {
      isSolflare?: boolean;
    };
  }
}

export {};
