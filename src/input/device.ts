import { create } from 'zustand'

interface DeviceState {
  /** True on tablets and phones, or the moment any touch is seen on a hybrid. */
  touch: boolean
}

/**
 * Whether to show touch controls and hide keyboard hints.
 *
 * `pointer: coarse` is the honest signal — it means the primary input is a
 * finger, not a mouse — so tablets get the controls from the first frame. A
 * laptop with a touchscreen reports a fine pointer, so it also flips on the
 * first actual touch, and stays on: someone who touched once will touch again.
 */
export const useDevice = create<DeviceState>(() => ({
  touch: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
}))

if (typeof window !== 'undefined') {
  const onFirstTouch = () => {
    useDevice.setState({ touch: true })
    window.removeEventListener('touchstart', onFirstTouch)
  }
  window.addEventListener('touchstart', onFirstTouch, { passive: true })
}
