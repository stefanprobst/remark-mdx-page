import { readFileSync } from 'fs'

import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import { transformSync } from 'esbuild'

const parser = Parser.extend(jsx())

export default function attacher(options) {
  const template = options?.template
  if (template == null) {
    throw new Error('No page template provided.')
  }

  const fileContent = readFileSync(options.template, { encoding: 'utf-8' })

  const { code } = transformSync(fileContent, {
    sourcefile: options.template,
    jsx: 'preserve',
    minify: false,
    sourcemap: false,
    treeShaking: false,
    loader: 'tsx',
  })

  const estree = parser.parse(code, {
    sourceFile: options.template,
    sourceType: 'module',
    ecmaVersion: 'latest',
  })

  const imports = parser.parse((options.imports ?? []).join('\n'), {
    sourceFile: options.template,
    sourceType: 'module',
    ecmaVersion: 'latest',
  }).body

  const props = parser.parse(`const props = ` + options.props ?? `{}`, {
    sourceFile: options.template,
    sourceType: 'module',
    ecmaVersion: 'latest',
  }).body[0].declarations[0].init

  const mdxComponentName = 'MDXContent'
  const wrapperComponentName = '__Page'

  const pageTemplateComponentIndex = estree.body.findIndex(
    (node) => node.type === 'ExportDefaultDeclaration',
  )
  const pageTemplateComponent = estree.body[pageTemplateComponentIndex]
  if (pageTemplateComponentIndex === -1) {
    throw new Error('Page template does not have a default export.')
  }
  const declaration = pageTemplateComponent.declaration

  let pageTemplateComponentIdentifier

  if (declaration?.type === 'Identifier') {
    pageTemplateComponentIdentifier = declaration
    estree.body.splice(pageTemplateComponentIndex, 1)
  } else if (declaration?.type === 'FunctionDeclaration') {
    pageTemplateComponentIdentifier = declaration.id
    estree.body.splice(pageTemplateComponentIndex, 1, declaration)
  }

  estree.body.forEach((node) => {
    if (node.type !== 'VariableDeclaration') return
    node.declarations.forEach((declaration) => {
      if (declaration.init.name === pageTemplateComponentIdentifier.name) {
        declaration.init.name = wrapperComponentName
      }
    })
  })

  /**
   * ```
   * export default function __Page(props) {
   *   // populated by options.props
   *   const layoutProps = {}
   *   const mdxProps = { ...layoutProps, ...props }
   *   return (
   *     <AboutPage {...props}>
   *       <MDXContent {...mdxProps} />
   *     </AboutPage>
   *   )
   * }
   * ```
   */
  const node = {
    type: 'ExportDefaultDeclaration',
    declaration: {
      type: 'FunctionDeclaration',
      id: {
        type: 'Identifier',
        name: wrapperComponentName,
      },
      expression: false,
      generator: false,
      async: false,
      params: [
        {
          type: 'Identifier',
          name: 'props',
        },
      ],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: {
                  type: 'Identifier',
                  name: 'layoutProps',
                },
                init: props,
              },
            ],
            kind: 'const',
          },
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: {
                  type: 'Identifier',
                  name: 'mdxProps',
                },
                init: {
                  type: 'ObjectExpression',
                  properties: [
                    {
                      type: 'SpreadElement',
                      argument: {
                        type: 'Identifier',
                        name: 'layoutProps',
                      },
                    },
                    {
                      type: 'SpreadElement',
                      argument: {
                        type: 'Identifier',
                        name: 'props',
                      },
                    },
                  ],
                },
              },
            ],
            kind: 'const',
          },
          {
            type: 'ReturnStatement',
            argument: {
              type: 'JSXElement',
              openingElement: {
                type: 'JSXOpeningElement',
                attributes: [
                  {
                    type: 'JSXSpreadAttribute',
                    argument: {
                      type: 'Identifier',
                      name: 'props',
                    },
                  },
                ],
                name: {
                  type: 'JSXIdentifier',
                  name: pageTemplateComponentIdentifier.name,
                },
                selfClosing: false,
              },
              closingElement: {
                type: 'JSXClosingElement',
                name: {
                  type: 'JSXIdentifier',
                  name: pageTemplateComponentIdentifier.name,
                },
              },
              children: [
                {
                  type: 'JSXElement',
                  openingElement: {
                    type: 'JSXOpeningElement',
                    attributes: [
                      {
                        type: 'JSXSpreadAttribute',
                        argument: {
                          type: 'Identifier',
                          name: 'mdxProps',
                        },
                      },
                    ],
                    name: {
                      type: 'JSXIdentifier',
                      name: mdxComponentName,
                    },
                    selfClosing: true,
                  },
                  closingElement: null,
                  children: [],
                },
              ],
            },
          },
        ],
      },
    },
  }

  estree.body.push(...imports)
  estree.body.push(node)

  return function transformer(tree) {
    const defaultExportIndex = tree.body.findIndex(
      (node) => node.type === 'ExportDefaultDeclaration',
    )
    if (defaultExportIndex !== -1) {
      tree.body.splice(defaultExportIndex, 1)
    }

    tree.body.push(...estree.body)
  }
}
