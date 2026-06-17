const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_LABEL_WIDTH = 48

export function WeekNav() {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous week"
        className="font-handwrite text-2xl text-plum"
      >
        ◀
      </button>
      <div
        className="grid flex-1"
        style={{ gridTemplateColumns: `${TIME_LABEL_WIDTH}px repeat(7, 1fr)` }}
      >
        <div />
        {days.map((day) => (
          <div key={day} className="text-center font-handwrite text-xl text-plum">
            {day}
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Next week"
        className="font-handwrite text-2xl text-plum"
      >
        ▶
      </button>
    </div>
  )
}
