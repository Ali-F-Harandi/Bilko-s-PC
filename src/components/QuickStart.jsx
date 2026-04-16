import PropTypes from 'prop-types'

/**
 * QuickStart component provides a button to load sample data for testing
 */
function QuickStart({ onLoadSample }) {
  return (
    <section className="mb-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Quick Start
      </h2>
      <p className="text-gray-600 mb-4">
        Want to try out the editor? Click the button below to load sample Pokemon data!
      </p>
      <button
        onClick={onLoadSample}
        className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
      >
        🎮 Load Sample Data
      </button>
    </section>
  )
}

QuickStart.propTypes = {
  onLoadSample: PropTypes.func.isRequired
}

export default QuickStart
