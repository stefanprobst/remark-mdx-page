import { transformFileSync } from '@swc/core'
import { Parser } from 'acorn'
import jsx from 'acorn-jsx'

const parser = Parser.extend(jsx())

export default function attacher(options) {
  if (options.pathname == null) return undefined

  const { code } = transformFileSync(options.pathname, {
    sourceMaps: false,
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        dynamicImport: false,
      },
      target: 'es2022',
      transform: {
        react: {
          // runtime: 'automatic',
          development: false,
          useBuiltins: true,
        },
      },
    },
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
  const templateComponentName =
    templateComponentNode.declaration.name || templateComponentNode.declaration.id.name

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
