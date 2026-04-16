import PropTypes from 'prop-types'
import PokemonCard from './PokemonCard'

/**
 * PokemonParty component displays the list of Pokemon in the party
 * and provides controls for adding new Pokemon
 */
function PokemonParty({ pokemonParty, availableMoves, onUpdatePokemon, onAddPokemon, onRemovePokemon }) {
  return (
    <section className="mb-8 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Pokemon Party ({pokemonParty.length}/6)
        </h2>
        <button
          onClick={onAddPokemon}
          disabled={pokemonParty.length >= 6}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
        >
          ➕ Add Pokemon
        </button>
      </div>
      
      {pokemonParty.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-xl">No Pokemon in your party yet!</p>
          <p className="mt-2">
            Click "Add Pokemon" to get started or upload a save file.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pokemonParty.map((pokemon, index) => (
            <PokemonCard
              key={pokemon.id || index}
              pokemon={pokemon}
              index={index}
              availableMoves={availableMoves}
              onUpdate={onUpdatePokemon}
              onRemove={onRemovePokemon}
            />
          ))}
        </div>
      )}
    </section>
  )
}

PokemonParty.propTypes = {
  pokemonParty: PropTypes.arrayOf(
    PropTypes.shape({
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
    })
  ).isRequired,
  availableMoves: PropTypes.arrayOf(PropTypes.string).isRequired,
  onUpdatePokemon: PropTypes.func.isRequired,
  onAddPokemon: PropTypes.func.isRequired,
  onRemovePokemon: PropTypes.func.isRequired
}

export default PokemonParty
