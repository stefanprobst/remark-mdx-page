import type { ReactNode } from 'react'

interface PageProps {
  children?: ReactNode
}

export default function Page(props: PageProps): JSX.Element {
  return <main>{props.children}</main>
}

export async function getStaticProps() {
  return { props: { hello: 'world' } }
}

Page.getLayout = function getLayout(page) {
  return page
}
