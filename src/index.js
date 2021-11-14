import { readFileSync } from 'fs'

import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import { transformSync } from 'esbuild'

const parser = Parser.extend(jsx())

export default function attacher(options) {
  if (options.pathname == null) return undefined

  const fileContent = readFileSync(options.pathname, { encoding: 'utf-8' })

  const { code } = transformSync(fileContent, {
    sourcefile: options.pathname,
    jsx: 'preserve',
    minify: false,
    sourcemap: false,
    treeShaking: false,
    loader: 'tsx',
  })

  const estree = parser.parse(code, {
    sourceFile: options.pathname,
    sourceType: 'module',
    ecmaVersion: 'latest',
  })

  return function transformer(tree) {
    tree.children.push({
      type: 'mdxjsEsm',
      data: { estree },
    })
  }
}
