import { useAudio } from '../audio/audio'

/** One toggle, shared by every screen. Persists with the rest of the progress. */
export function MuteButton() {
  const muted = useAudio((s) => s.muted)
  const toggle = useAudio((s) => s.toggle)
  return (
    <button
      className="mute"
      onClick={toggle}
      aria-label={muted ? 'Unmute' : 'Mute'}
      aria-pressed={muted}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
