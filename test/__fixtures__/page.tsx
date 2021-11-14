import type { ReactNode } from 'react'

interface LayoutProps {
  children?: ReactNode
}

export default function Layout(props: LayoutProps): JSX.Element {
  return <main>{props.children}</main>
}

export async function getStaticProps() {
  return { props: { hello: 'world' } }
}
