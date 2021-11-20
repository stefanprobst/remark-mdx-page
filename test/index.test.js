import * as path from 'path'

import { createFsFromVolume, Volume } from 'memfs'
import webpack from 'webpack'

import withPage from '../src/index.js'

function compiler(entry, pathname) {
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
              loader: '@mdx-js/loader',
              options: {
                remarkPlugins: [[withPage, { pathname }]],
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
        console.error(errors)
        reject(new Error(errors))
      }

      resolve(stats)
    })
  })
}

it('adds page template', async () => {
  const entry = path.join(process.cwd(), 'test', '__fixtures__', 'test.mdx')
  const pathname = path.join(process.cwd(), 'test', '__fixtures__', 'page.tsx')
  const stats = await compiler(entry, pathname)

  expect(stats.compilation.modules[0]._source._value).toMatchInlineSnapshot(`
    "/*@jsxRuntime automatic @jsxImportSource react*/
    import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from \\"react/jsx-runtime\\";
    const MDXLayout = function TestPage(props) {
      return _jsx(\\"main\\", {
        children: props.children
      });
    };
    export async function getStaticProps() {
      return {
        props: {
          hello: \\"world\\"
        }
      };
    }
    MDXContent.getLayout = function getLayout(page) {
      return page;
    };
    function MDXContent(props = {}) {
      const _components = Object.assign({
        h1: \\"h1\\",
        p: \\"p\\"
      }, props.components);
      const _content = _jsxs(_Fragment, {
        children: [_jsx(_components.h1, {
          children: \\"Heading\\"
        }), \\"\\\\n\\", _jsx(_components.p, {
          children: \\"Some text.\\"
        })]
      });
      return MDXLayout ? _jsx(MDXLayout, Object.assign({}, props, {
        children: _content
      })) : _content;
    }
    export default MDXContent;
    "
  `)
})
