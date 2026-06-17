import frog from '@/frog.png'

export function FrogMascot() {
  return (
    <div className="flex justify-end">
      <img src={frog} alt="Ribbit the frog" className="h-40 w-40 object-contain" />
    </div>
  )
}
