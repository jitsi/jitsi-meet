declare module 'uuid' {
  // v1 (Timestamp)
  declare type V1Options = {|
    node?: $ReadOnlyArray<number>,
    clockseq?: number,
    msecs?: number,
    nsecs?: number,
    random?: $ReadOnlyArray<number>,
    rng?: () => $ReadOnlyArray<number>,
  |};

  declare export function v1(options?: V1Options): string;

  declare export function v1(
    options: V1Options | null,
    buffer: Array<number>,
    offset?: number
  ): Array<number>;

  // v3 (Namespace)
  declare function v3Impl(
    name: string | $ReadOnlyArray<number>,
    namespace: string | $ReadOnlyArray<number>
  ): string;

  declare function v3Impl(
    name: string | $ReadOnlyArray<number>,
    namespace: string | $ReadOnlyArray<number>,
    buffer: Array<number>,
    offset?: number
  ): Array<number>;

  declare export var v3: {|
    [[call]]: typeof v3Impl,
    DNS: string,
    URL: string,
  |};

  // v4 (Random)
  declare type V4Options = {|
    random?: $ReadOnlyArray<number>,
    rng?: () => $ReadOnlyArray<number>,
  |};

  declare export function v4(options?: V4Options): string;

  declare export function v4(
    options: V4Options | null,
    buffer: Array<number>,
    offset?: number
  ): Array<number>;

  // v5 (Namespace)
  declare function v5Impl(
    name: string | $ReadOnlyArray<number>,
    namespace: string | $ReadOnlyArray<number>
  ): string;

  declare function v5Impl(
    name: string | $ReadOnlyArray<number>,
    namespace: string | $ReadOnlyArray<number>,
    buffer: Array<number>,
    offset?: number
  ): Array<number>;

  declare export var v5: {|
    [[call]]: typeof v5Impl,
    DNS: string,
    URL: string,
  |};
}
