import { readFileSync } from 'fs'

import { parse } from '@typescript-eslint/typescript-estree'

export default function attacher(options) {
  if (options.pathname == null) return undefined

  const fileContent = readFileSync(options.pathname, { encoding: 'utf-8' })
  const estree = parse(fileContent, { filePath: options.pathname })

  return function transformer(tree) {
    tree.children.push({
      type: 'mdxjsEsm',
      data: { estree },
    })
  }
}
