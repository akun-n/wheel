import { useMemo, useState } from 'react'

type PeoplePanelProps = {
  names: string[]
  pickedIndex: number | null
  disabled: boolean
  onAddOne: (name: string) => void
  onAddMany: (text: string) => void
  onRemoveAt: (index: number) => void
  onShuffle: () => void
  onSortAZ: () => void
  onClearAll: () => void
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many
}

export function PeoplePanel({
  names,
  pickedIndex,
  disabled,
  onAddOne,
  onAddMany,
  onRemoveAt,
  onShuffle,
  onSortAZ,
  onClearAll,
}: PeoplePanelProps) {
  const [nameInput, setNameInput] = useState('')
  const [bulkInput, setBulkInput] = useState('')

  const countLabel = useMemo(() => {
    const c = names.length
    return `${c} ${plural(c, 'person', 'people')}`
  }, [names.length])

  return (
    <div className="peoplePanel">
      <div className="panelHeader">
        <div className="panelTitle">People</div>
        <div className="panelMeta">{countLabel}</div>
      </div>

      <div className="panelActions">
        <button type="button" className="secondary" onClick={onShuffle} disabled={disabled || names.length < 2}>
          Shuffle
        </button>
        <button type="button" className="secondary" onClick={onSortAZ} disabled={disabled || names.length < 2}>
          Sort A–Z
        </button>
        <button type="button" className="danger" onClick={onClearAll} disabled={disabled || names.length === 0}>
          Clear
        </button>
      </div>

      <div className="panelSection">
        <div className="fieldRow">
          <input
            className="textInput"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Add a name…"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              onAddOne(nameInput)
              setNameInput('')
            }}
          />
          <button
            type="button"
            onClick={() => {
              onAddOne(nameInput)
              setNameInput('')
            }}
            disabled={disabled}
          >
            Add
          </button>
        </div>
      </div>

      <div className="panelSection">
        <div className="sectionLabel">Bulk add (one per line)</div>
        <textarea
          className="textArea"
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          placeholder={'Ali\nBeatriz\nCharles'}
          disabled={disabled}
          rows={5}
        />
        <div className="sectionFooter">
          <button
            type="button"
            className="secondary"
            disabled={disabled}
            onClick={() => {
              onAddMany(bulkInput)
              setBulkInput('')
            }}
          >
            Add lines
          </button>
        </div>
      </div>

      <div className="panelSection">
        <div className="sectionLabel">List</div>
        {names.length === 0 ? (
          <div className="emptyState">No people yet.</div>
        ) : (
          <ul className="nameList">
            {names.map((name, index) => (
              <li key={`${index}-${name}`} className={index === pickedIndex ? 'nameItem picked' : 'nameItem'}>
                <span className="nameText">{name}</span>
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => onRemoveAt(index)}
                  disabled={disabled}
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

