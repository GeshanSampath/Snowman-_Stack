import React from 'react'

export default function Snowball({ x, y, r = 24, img }) {
  // use img if provided, otherwise render a circle
  if (img) {
    return (
      <img
        src={img}
        alt="snowball"
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%'
        }}
        draggable={false}
      />
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: 'white',
        border: '2px solid #d0d0d0',
        boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.10)'
      }}
      draggable={false}
    />
  )
}
