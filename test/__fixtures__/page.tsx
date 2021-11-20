import type { ReactNode } from 'react'

interface TestPageProps {
  children?: ReactNode
}

export default function TestPage(props: TestPageProps): JSX.Element {
  return <main>{props.children}</main>
}

export async function getStaticProps() {
  return { props: { hello: 'world' } }
}

const Page = TestPage as any

Page.getLayout = function getLayout(page) {
  return page
}
