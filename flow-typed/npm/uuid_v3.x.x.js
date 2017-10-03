// flow-typed signature: 615e568e95029d58f116dd157e320137
// flow-typed version: 2b95c0dfc1/uuid_v3.x.x/flow_>=v0.32.x

declare module "uuid" {
  declare class uuid {
    static (
      options?: {|
        random?: number[],
        rng?: () => number[] | Buffer
      |},
      buffer?: number[] | Buffer,
      offset?: number
    ): string,

    static v1(
      options?: {|
        node?: number[],
        clockseq?: number,
        msecs?: number | Date,
        nsecs?: number
      |},
      buffer?: number[] | Buffer,
      offset?: number
    ): string,

    static v4(
      options?: {|
        random?: number[],
        rng?: () => number[] | Buffer
      |},
      buffer?: number[] | Buffer,
      offset?: number
    ): string
  }
  declare module.exports: Class<uuid>;
}

declare module "uuid/v1" {
  declare class v1 {
    static (
      options?: {|
        node?: number[],
        clockseq?: number,
        msecs?: number | Date,
        nsecs?: number
      |},
      buffer?: number[] | Buffer,
      offset?: number
    ): string
  }

  declare module.exports: Class<v1>;
}

declare module "uuid/v4" {
  declare class v4 {
    static (
      options?: {|
        random?: number[],
        rng?: () => number[] | Buffer
      |},
      buffer?: number[] | Buffer,
      offset?: number
    ): string
  }

  declare module.exports: Class<v4>;
}

declare module "uuid/v5" {
  declare class v5 {
    static (
      name?: string | number[],
      namespace?: string | number[],
      buffer?: number[] | Buffer,
      offset?: number
    ): string
  }

  declare module.exports: Class<v5>;
}
