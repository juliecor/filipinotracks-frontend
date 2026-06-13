/**
 * Lightweight one-shot confetti burst — no dependencies. Rendered briefly
 * when the plotted lot closes cleanly. Particle directions are derived from
 * the index so the burst is deterministic (no Math.random needed).
 */
import { motion } from 'framer-motion'
import { GOLD, GOLD_LIGHT, NAVY } from '../theme/theme'

const COLORS = [GOLD, GOLD_LIGHT, '#16A34A', NAVY, '#FFFFFF']
const COUNT = 28

export default function SuccessBurst() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.3, duration: 0.4 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}
    >
      {Array.from({ length: COUNT }).map((_, i) => {
        const angle = (i / COUNT) * Math.PI * 2
        const dist = 90 + (i % 5) * 26
        const x = Math.cos(angle) * dist
        const y = Math.sin(angle) * dist
        const size = 6 + (i % 3) * 3
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y: y + 40, opacity: 0, rotate: (i % 2 ? 1 : -1) * 320 }}
            transition={{ duration: 1.1 + (i % 4) * 0.12, ease: 'easeOut' }}
            style={{
              position: 'absolute', left: '50%', top: '42%',
              width: size, height: size * 1.6, borderRadius: 2,
              background: COLORS[i % COLORS.length],
            }}
          />
        )
      })}
    </motion.div>
  )
}
