import { Toggle } from '@/components/ui/toggle'

interface ToggleBarProps {
  showSuggested: boolean
  onToggle: (next: boolean) => void
}

export function ToggleBar({ showSuggested, onToggle }: ToggleBarProps) {
  return (
    <div className="flex items-center justify-end">
      <Toggle
        pressed={showSuggested}
        onPressedChange={onToggle}
        aria-label="Toggle suggested blocks"
        className="font-handwrite text-lg"
      >
        Suggested blocks
      </Toggle>
    </div>
  )
}
