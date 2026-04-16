import { useState, useCallback } from 'react'
import {
  Header,
  Footer,
  FileOperations,
  TrainerInfo,
  PokemonParty,
  QuickStart
} from './components'

const samplePokemon = [
  { id: 1, name: 'Bulbasaur', type: ['grass', 'poison'], baseStats: { hp: 45, attack: 49, defense: 49 } },
  { id: 4, name: 'Charmander', type: ['fire'], baseStats: { hp: 39, attack: 52, defense: 43 } },
  { id: 7, name: 'Squirtle', type: ['water'], baseStats: { hp: 44, attack: 48, defense: 65 } },
  { id: 25, name: 'Pikachu', type: ['electric'], baseStats: { hp: 35, attack: 55, defense: 40 } },
  { id: 150, name: 'Mewtwo', type: ['psychic'], baseStats: { hp: 106, attack: 110, defense: 90 } },
]

const availableMoves = [
  'Tackle', 'Scratch', 'Quick Attack', 'Thunder Shock', 
  'Ember', 'Water Gun', 'Vine Whip', 'Psychic',
  'Hyper Beam', 'Thunderbolt', 'Flamethrower', 'Surf',
  'Earthquake', 'Shadow Ball', 'Ice Beam', 'Brick Break'
]

function App() {
  const [saveData, setSaveData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState(null)
  const [trainerName, setTrainerName] = useState('Red')
  const [trainerMoney, setTrainerMoney] = useState(3000)
  const [pokemonParty, setPokemonParty] = useState([])

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return
    setFileName(file.name)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        setSaveData(data)
        if (data.trainer) {
          setTrainerName(data.trainer.name || 'Red')
          setTrainerMoney(data.trainer.money || 3000)
        }
        if (data.pokemon && Array.isArray(data.pokemon)) {
          setPokemonParty(data.pokemon.slice(0, 6))
        } else {
          setPokemonParty([])
        }
      } catch (err) {
        setError('Invalid save file format. Please upload a valid JSON file.')
      }
    }
    reader.onerror = () => setError('Error reading file.')
    reader.readAsText(file)
  }, [])

  const updatePokemon = useCallback((index, updates) => {
    setPokemonParty(prev => {
      const newParty = [...prev]
      newParty[index] = { ...newParty[index], ...updates }
      return newParty
    })
  }, [])

  const addPokemon = useCallback(() => {
    if (pokemonParty.length >= 6) {
      setError('Party is full! Maximum 6 Pokemon allowed.')
      return
    }
    const newPokemon = {
      id: Date.now(),
      name: 'Pikachu',
      level: 5,
      hp: 35,
      maxHp: 35,
      type: ['electric'],
      moves: ['Quick Attack', 'Thunder Shock'],
      attack: 55,
      defense: 40,
      speed: 90,
      exp: 0,
      nickname: ''
    }
    setPokemonParty(prev => [...prev, newPokemon])
  }, [pokemonParty.length])

  const removePokemon = useCallback((index) => {
    setPokemonParty(prev => prev.filter((_, i) => i !== index))
  }, [])

  const downloadSaveFile = useCallback(() => {
    const updatedSaveData = {
      trainer: {
        name: trainerName,
        money: trainerMoney,
        badges: saveData?.trainer?.badges || []
      },
      pokemon: pokemonParty,
      lastModified: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(updatedSaveData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pokemon-save-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [trainerName, trainerMoney, pokemonParty, saveData])

  const createNewSave = useCallback(() => {
    const newSave = {
      trainer: { name: 'Red', money: 3000, badges: [] },
      pokemon: [],
      created: new Date().toISOString()
    }
    setSaveData(newSave)
    setTrainerName('Red')
    setTrainerMoney(3000)
    setPokemonParty([])
    setFileName('new-save.json')
    setError(null)
  }, [])

  const getTypeColor = (type) => {
    const colors = {
      fire: 'bg-pokemon-fire', water: 'bg-pokemon-water', grass: 'bg-pokemon-grass',
      electric: 'bg-pokemon-electric', psychic: 'bg-pokemon-psychic', ice: 'bg-pokemon-ice',
      dragon: 'bg-pokemon-dragon', dark: 'bg-pokemon-dark', fairy: 'bg-pokemon-fairy',
      normal: 'bg-pokemon-normal', fighting: 'bg-pokemon-fighting', flying: 'bg-pokemon-flying',
      poison: 'bg-pokemon-poison', ground: 'bg-pokemon-ground', rock: 'bg-pokemon-rock',
      bug: 'bg-pokemon-bug', ghost: 'bg-pokemon-ghost', steel: 'bg-pokemon-steel'
    }
    return colors[type] || 'bg-gray-400'
  }

  const loadSampleData = useCallback(() => {
    setPokemonParty(samplePokemon.map(p => ({ ...p, level: 50, hp: p.baseStats.hp * 2, maxHp: p.baseStats.hp * 2, attack: p.baseStats.attack * 2, defense: p.baseStats.defense * 2, speed: 50, exp: 10000, moves: ['Tackle', 'Quick Attack'] })))
    setTrainerName('Ash')
    setTrainerMoney(50000)
    setSaveData({ trainer: { name: 'Ash', money: 50000 }, pokemon: samplePokemon })
    setFileName('sample-save.json')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <FileOperations
          fileName={fileName}
          hasSaveData={!!saveData}
          onFileUpload={handleFileUpload}
          onCreateNew={createNewSave}
          onDownload={downloadSaveFile}
          error={error}
        />

        <TrainerInfo
          trainerName={trainerName}
          trainerMoney={trainerMoney}
          onNameChange={setTrainerName}
          onMoneyChange={setTrainerMoney}
        />

        <PokemonParty
          pokemonParty={pokemonParty}
          availableMoves={availableMoves}
          onUpdatePokemon={updatePokemon}
          onAddPokemon={addPokemon}
          onRemovePokemon={removePokemon}
        />

        <QuickStart onLoadSample={loadSampleData} />
      </main>

      <Footer />
    </div>
  )
}

export default App
