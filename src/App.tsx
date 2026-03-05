import './App.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PeoplePanel } from './components/PeoplePanel.tsx'
import { Wheel } from './components/Wheel.tsx'

// Put the person/people you want to win here (repeatable order). Empty = normal random wheel.
const RIGGED_PICK_ORDER: string[] = []
const DEFAULT_NAMES = [
  'Lara',
  'Mina',
  'Zehra',
  'Rüzgar'
]

function normalizeName(input: string) {
  return input.trim().replaceAll(/\s+/g, ' ')
}

function App() {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const riggedCursorRef = useRef(0)

  useEffect(() => {
    if (pickedIndex == null) return
    if (pickedIndex < 0 || pickedIndex >= names.length) setPickedIndex(null)
  }, [names.length, pickedIndex])

  const pickedName = useMemo(() => {
    if (pickedIndex == null) return null
    return names[pickedIndex] ?? null
  }, [names, pickedIndex])

  useEffect(() => {
    if (spinning) setShowWinner(false)
  }, [spinning])

  const riggedPick = useCallback((currentNames: string[]) => {
    if (RIGGED_PICK_ORDER.length === 0) return null
    const target = RIGGED_PICK_ORDER[riggedCursorRef.current % RIGGED_PICK_ORDER.length] ?? ''
    riggedCursorRef.current += 1
    const needle = normalizeName(target).toLowerCase()
    if (!needle) return null
    const idx = currentNames.findIndex((n) => normalizeName(n).toLowerCase() === needle)
    return idx >= 0 ? idx : null
  }, [])

  function addOne(name: string) {
    const n = normalizeName(name)
    if (!n) return
    setNames((prev) => [...prev, n])
  }

  function addMany(text: string) {
    const lines = text
      .split(/\r?\n/g)
      .map((x) => normalizeName(x))
      .filter(Boolean)
    if (!lines.length) return
    setNames((prev) => [...prev, ...lines])
  }

  function removeAt(index: number) {
    setNames((prev) => prev.filter((_, i) => i !== index))
    setPickedIndex((prev) => (prev === index ? null : prev != null && prev > index ? prev - 1 : prev))
  }

  function clearAll() {
    setNames([])
    setPickedIndex(null)
  }

  function shuffle() {
    setNames((prev) => {
      const copy = [...prev]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    })
    setPickedIndex(null)
  }

  function sortAZ() {
    setNames((prev) => [...prev].sort((a, b) => a.localeCompare(b)))
    setPickedIndex(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandTitle">Wheel</div>
          <div className="brandSubtitle">Wheel of Names</div>
        </div>
        <div className="topbarHint">
          {names.length < 2 ? 'Add at least 2 people to spin.' : spinning ? 'Spinning…' : 'Ready.'}
        </div>
      </header>

      {showWinner && pickedName && (
        <div
          className="winnerOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Winner"
          onClick={() => setShowWinner(false)}
        >
          <div className="winnerBox" onClick={(e) => e.stopPropagation()}>
            <div className="winnerTitle">Winner</div>
            <div className="winnerName">{pickedName}</div>
            <div className="winnerButtons">
              <button type="button" className="secondary" onClick={() => setShowWinner(false)}>
                Close
              </button>
              <button
                type="button"
                disabled={spinning || pickedIndex == null}
                onClick={() => {
                  if (pickedIndex == null) return
                  removeAt(pickedIndex)
                  setShowWinner(false)
                }}
              >
                Remove winner
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <main className="stage">
          <div className="wheelCard">
            <Wheel
              names={names}
              spinning={spinning}
              setSpinning={setSpinning}
              onPick={(index) => {
                setPickedIndex(index)
                setShowWinner(true)
              }}
              riggedPick={riggedPick}
            />
            <div className="resultRow" aria-live="polite">
              <div className="resultLabel">Result</div>
              <div className="resultValue">{pickedName ?? '—'}</div>
              <div className="resultActions">
                <button
                  type="button"
                  className="secondary"
                  disabled={spinning || pickedIndex == null}
                  onClick={() => {
                    if (pickedIndex == null) return
                    removeAt(pickedIndex)
                  }}
                >
                  Remove winner
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside className="panel">
          <PeoplePanel
            names={names}
            pickedIndex={pickedIndex}
            disabled={spinning}
            onAddOne={addOne}
            onAddMany={addMany}
            onRemoveAt={removeAt}
            onShuffle={shuffle}
            onSortAZ={sortAZ}
            onClearAll={clearAll}
          />
        </aside>
      </div>
    </div>
  )
}

export default App
