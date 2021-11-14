export default function Layout(props) {
  return <main>{props.children}</main>
}

export async function getStaticProps() {
  return { props: { hello: 'world' } }
}
