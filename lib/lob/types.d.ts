// Lob TypeScript SDK ships .d.ts but its exports map only declares "types"
// under the "node" condition; the "default" path resolves to .mjs without types
// under bundler-mode resolution. Re-declare the surface we use.
declare module "@lob/lob-typescript-sdk" {
  export class Configuration {
    constructor(opts: { username: string });
  }
  export class PostcardsApi {
    constructor(config: Configuration);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create(payload: any): Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(id: string): Promise<any>;
  }
}
