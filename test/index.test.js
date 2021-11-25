import * as path from 'path'

import { createFsFromVolume, Volume } from 'memfs'
import webpack from 'webpack'

import withPage from '../src/index.js'

function compiler(entry, template, imports, props) {
  const compiler = webpack({
    mode: 'none',
    entry,
    output: {
      path: path.join(process.cwd(), 'test'),
      filename: 'bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.mdx$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', { targets: { node: 14 } }]],
                plugins: ['@babel/plugin-transform-react-jsx'],
              },
            },
            {
              loader: '@mdx-js/loader',
              options: {
                jsx: true,
                recmaPlugins: [[withPage, { template, imports, props, jsx: false }]],
              },
            },
          ],
        },
      ],
    },
  })

  compiler.outputFileSystem = createFsFromVolume(new Volume())

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err)
      }
      if (stats.hasErrors()) {
        const errors = stats.toJson().errors
        // eslint-disable-next-line no-console
        console.error(errors)
        reject(new Error(errors))
      }

      resolve(stats)
    })
  })
}

it('adds page template', async () => {
  const entry = path.join(process.cwd(), 'test', '__fixtures__', 'test.mdx')
  const template = path.join(process.cwd(), 'test', '__fixtures__', 'page.tsx')
  const imports = []
  const props = `{ components: { Comment: () => null } }`
  const stats = await compiler(entry, template, imports, props)

  expect(stats.compilation.modules[0]._source._value).toMatchInlineSnapshot(`
    "import { jsx as _jsx } from \\"react/jsx-runtime\\";
    import { Fragment as _Fragment } from \\"react/jsx-runtime\\";
    import { jsxs as _jsxs } from \\"react/jsx-runtime\\";

    /*@jsxRuntime automatic @jsxImportSource react*/
    function MDXContent(props = {}) {
      const {
        wrapper: MDXLayout
      } = props.components || {};
      return MDXLayout ? /*#__PURE__*/_jsx(MDXLayout, { ...props,
        children: /*#__PURE__*/_jsx(_createMdxContent, {})
      }) : _createMdxContent();

      function _createMdxContent() {
        const _components = Object.assign({
          h1: \\"h1\\",
          p: \\"p\\"
        }, props.components);

        return /*#__PURE__*/_jsxs(_Fragment, {
          children: [/*#__PURE__*/_jsx(_components.h1, {
            children: \\"Heading\\"
          }), \\"\\\\n\\", /*#__PURE__*/_jsx(_components.p, {
            children: \\"Some text.\\"
          })]
        });
      }
    }

    function TestPage(props) {
      return /*#__PURE__*/_jsx(\\"main\\", {
        children: props.children
      });
    }

    export async function getStaticProps() {
      return {
        props: {
          hello: \\"world\\"
        }
      };
    }
    const Page = __Page;

    Page.getLayout = function getLayout(page) {
      return page;
    };

    export default function __Page(props) {
      const layoutProps = {
        components: {
          Comment: () => null
        }
      };
      const mdxProps = { ...layoutProps,
        ...props
      };
      return /*#__PURE__*/_jsx(TestPage, { ...mdxProps,
        children: /*#__PURE__*/_jsx(MDXContent, { ...mdxProps
        })
      });
    }"
  `)
})
