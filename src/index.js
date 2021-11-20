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

  const templateComponentNode = estree.body.find((node) => node.type === 'ExportDefaultDeclaration')
  if (templateComponentNode == null) {
    throw new Error('Page template does not have a default export.')
  }
  let templateComponentName =
    templateComponentNode.declaration.name || templateComponentNode.declaration.id.name

  for (const [index, node] of estree.body.entries()) {
    if (node.type !== 'VariableDeclaration') continue
    const declIndex = node.declarations.findIndex((d) => d.init.name === templateComponentName)
    if (declIndex !== -1) {
      templateComponentName = node.declarations[declIndex].id.name
      if (node.declarations.length > 1) {
        node.declarations.splice(declIndex)
      } else {
        estree.body.splice(index, 1)
      }
      break
    }
  }

  const staticProperties = estree.body.filter((node) => {
    if (node.type !== 'ExpressionStatement') return false
    if (node.expression.type !== 'AssignmentExpression') return false
    const left = node.expression.left
    if (left.type !== 'MemberExpression') return false
    if (left.object.name !== templateComponentName) return false
    return true
  })

  const mdxContentComponentName = 'MDXContent'

  /**
   * The mdx processor creates a `MDXContent` default export, so we need to move any static properties
   * defined on the default export of the provided template component over to `MDXContent`.
   */
  staticProperties.forEach((node) => {
    node.expression.left.object.name = mdxContentComponentName
  })

  return function transformer(tree) {
    tree.children.push({
      type: 'mdxjsEsm',
      data: { estree },
    })
  }
}
