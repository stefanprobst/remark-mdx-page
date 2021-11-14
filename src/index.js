import { promises as fs } from 'fs'

import { Parser } from 'acorn'
import jsx from 'acorn-jsx'

const jsxParser = Parser.extend(jsx())

export default function attacher(options) {
  if (options.pathname == null) return undefined

  return async function transformer(tree) {
    const fileContent = await fs.readFile(options.pathname, { encoding: 'utf-8' })
    const estree = jsxParser.parse(fileContent, { sourceType: 'module', ecmaVersion: 'latest' })

    tree.children.push({
      type: 'mdxjsEsm',
      data: { estree },
    })
  }
}
