import { Toggle } from '@/components/ui/toggle'

export function ToggleBar() {
  return (
    <div className="flex items-center justify-end">
      <Toggle aria-label="Toggle suggested blocks" className="font-handwrite text-sm">
        Suggested blocks
      </Toggle>
    </div>
  )
}
