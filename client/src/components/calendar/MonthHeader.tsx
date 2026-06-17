export function MonthHeader() {
  const now = new Date()
  const label = now
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()

  return <h1 className="font-display text-7xl leading-none text-plum">{label}</h1>
}
