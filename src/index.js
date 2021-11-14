import { readFileSync } from 'fs'

import { Parser } from 'acorn'
import jsx from 'acorn-jsx'

const jsxParser = Parser.extend(jsx())

export default function attacher(options) {
  if (options.pathname == null) return undefined

  const fileContent = readFileSync(options.pathname, { encoding: 'utf-8' })
  const estree = jsxParser.parse(fileContent, { sourceType: 'module', ecmaVersion: 'latest' })

  return function transformer(tree) {
    tree.children.push({
      type: 'mdxjsEsm',
      data: { estree },
    })
  }
}
