export default function Layout(props): JSX.Element {
  return <main>{props.children}</main>
}

export async function getStaticProps() {
  return { props: { hello: 'world' } }
}
