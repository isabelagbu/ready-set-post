export default function PlaceholderView({
  title,
  body
}: {
  title: string
  body: string
}): React.ReactElement {
  return (
    <div className="page placeholder">
      <header className="page-header">
        <h1>{title}</h1>
        <p className="sub">{body}</p>
      </header>
    </div>
  )
}
