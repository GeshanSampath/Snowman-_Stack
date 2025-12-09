import React, { useEffect, useRef } from 'react'

export default function Snowfall({ count = 80 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = canvas.width = innerWidth
    let h = canvas.height = innerHeight

    const createParticles = () => {
      const arr = []
      for (let i = 0; i < count; i++) {
        arr.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 3 + 1, d: Math.random() * 1 })
      }
      return arr
    }

    let particles = createParticles()
    let angle = 0
    let raf
    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      angle += 0.01
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.y += Math.cos(angle + p.d) + 0.5 + p.r/2
        p.x += Math.sin(angle) * 0.5
        if (p.y > h + 5) p.y = -10
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = 'white'
        ctx.fill()
      }
      raf = requestAnimationFrame(loop)
    }

    loop()

    const onResize = () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
  }, [count])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
