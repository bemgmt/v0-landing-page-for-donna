"use client"

import React from "react"

/**
 * Beautiful brain loading screen for Donna
 * Matches the design from donna_grid_dashboard.php
 */
export default function GridLoading() {
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center">
      {/* Main loading content */}
      <div className="flex flex-col items-center justify-center">
        {/* Brain logo with pulse animation */}
        <div className="text-6xl mb-4 animate-pulse">
          🧠
        </div>

        {/* DONNA text */}
        <div className="text-4xl font-light mb-8 tracking-wider">
          DONNA
        </div>

        {/* Spinning loader */}
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>

        {/* Loading text */}
        <div className="text-lg text-white/80 mb-8">
          Loading Interactive Grid...
        </div>
      </div>

      {/* Fallback message (appears after delay) */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center max-w-md">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <p className="text-sm text-white/70 mb-3">
            If this takes too long, you can access individual modules:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a
              href="/sales"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              Sales
            </a>
            <a
              href="/marketing"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              Marketing
            </a>
            <a
              href="/chatbot"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              Chatbot
            </a>
            <a
              href="/secretary"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              Secretary
            </a>
          </div>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/15 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>
    </div>
  )
}
