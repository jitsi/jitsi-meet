// flow-typed signature: 3cf668e64747095cab0bb360cf2fb34f
// flow-typed version: d659bd0cb8/uuid_v3.x.x/flow_>=v0.32.x

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

declare module "uuid/v3" {
  declare class v3 {
    static (
      name?: string | number[],
      namespace?: string | number[],
      buffer?: number[] | Buffer,
      offset?: number
    ): string,

     static name: string,
     static DNS: string,
     static URL: string
  }

  declare module.exports: Class<v3>;
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
    ): string,

     static name: string,
     static DNS: string,
     static URL: string
  }

  declare module.exports: Class<v5>;
}
