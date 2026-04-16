import PropTypes from 'prop-types'

const typeColors = {
  fire: 'bg-pokemon-fire',
  water: 'bg-pokemon-water',
  grass: 'bg-pokemon-grass',
  electric: 'bg-pokemon-electric',
  psychic: 'bg-pokemon-psychic',
  ice: 'bg-pokemon-ice',
  dragon: 'bg-pokemon-dragon',
  dark: 'bg-pokemon-dark',
  fairy: 'bg-pokemon-fairy',
  normal: 'bg-pokemon-normal',
  fighting: 'bg-pokemon-fighting',
  flying: 'bg-pokemon-flying',
  poison: 'bg-pokemon-poison',
  ground: 'bg-pokemon-ground',
  rock: 'bg-pokemon-rock',
  bug: 'bg-pokemon-bug',
  ghost: 'bg-pokemon-ghost',
  steel: 'bg-pokemon-steel'
}

/**
 * PokemonCard component displays an individual Pokemon's information
 * and allows editing of its stats, moves, and nickname.
 */
function PokemonCard({ pokemon, index, onUpdate, onRemove, availableMoves }) {
  const updateField = (field, value) => {
    onUpdate(index, { [field]: value })
  }

  const updateMove = (moveIndex, newMove) => {
    const newMoves = [...(pokemon.moves || [])]
    newMoves[moveIndex] = newMove
    onUpdate(index, { moves: newMoves })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header with ID, Nickname, and Remove button */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-800">
            #{String(pokemon.id || index + 1).padStart(3, '0')}
          </span>
          <input
            type="text"
            value={pokemon.nickname || pokemon.name}
            onChange={(e) => updateField('nickname', e.target.value)}
            className="text-xl font-semibold text-gray-800 border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent"
            placeholder={pokemon.name}
          />
        </div>
        <button
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 font-bold"
          aria-label={`Remove ${pokemon.name}`}
        >
          ✕
        </button>
      </div>

      {/* Type badges */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {(pokemon.type || []).map((type) => (
          <span
            key={type}
            className={`${typeColors[type] || 'bg-gray-400'} text-white text-xs px-2 py-1 rounded-full capitalize`}
          >
            {type}
          </span>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <StatInput
          label="Level"
          value={pokemon.level || 5}
          onChange={(val) => updateField('level', val)}
          min={1}
          max={100}
        />
        <StatInput
          label="HP"
          value={pokemon.hp || 20}
          onChange={(val) => updateField('hp', val)}
          min={1}
          max={pokemon.maxHp || 999}
        />
        <StatInput
          label="Max HP"
          value={pokemon.maxHp || 20}
          onChange={(val) => updateField('maxHp', val)}
          min={1}
          max={999}
        />
        <StatInput
          label="Attack"
          value={pokemon.attack || 10}
          onChange={(val) => updateField('attack', val)}
          min={1}
          max={999}
        />
        <StatInput
          label="Defense"
          value={pokemon.defense || 10}
          onChange={(val) => updateField('defense', val)}
          min={1}
          max={999}
        />
        <StatInput
          label="Speed"
          value={pokemon.speed || 10}
          onChange={(val) => updateField('speed', val)}
          min={1}
          max={999}
        />
      </div>

      {/* Experience slider */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1">
          Experience: {pokemon.exp || 0}
        </label>
        <input
          type="range"
          value={pokemon.exp || 0}
          onChange={(e) => updateField('exp', parseInt(e.target.value) || 0)}
          min={0}
          max={1000000}
          step={100}
          className="w-full"
        />
      </div>

      {/* Moves selection */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Moves</label>
        <div className="space-y-1">
          {(pokemon.moves || []).map((move, moveIndex) => (
            <select
              key={moveIndex}
              value={move}
              onChange={(e) => updateMove(moveIndex, e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {availableMoves.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * StatInput is a reusable input field for Pokemon stats
 */
function StatInput({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        min={min}
        max={max}
        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
      />
    </div>
  )
}

StatInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired
}

PokemonCard.propTypes = {
  pokemon: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    nickname: PropTypes.string,
    level: PropTypes.number,
    hp: PropTypes.number,
    maxHp: PropTypes.number,
    attack: PropTypes.number,
    defense: PropTypes.number,
    speed: PropTypes.number,
    exp: PropTypes.number,
    type: PropTypes.arrayOf(PropTypes.string),
    moves: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  index: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  availableMoves: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default PokemonCard
