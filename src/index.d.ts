import type { Plugin } from 'unified'

export interface Options {
  pathname: string
}

declare const withPage: Plugin<[Options]>

export default withPage
