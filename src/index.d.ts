import type { Plugin } from 'unified'

export interface Options {
  /** Path to page template. */
  template: string
  /** Imports to add, e.g. components which are referenced in the `props` option. */
  imports?: Array<string>
  /** Serialized props, passed to the mdx component. */
  props?: string
}

declare const withPage: Plugin<[Options]>

export default withPage
