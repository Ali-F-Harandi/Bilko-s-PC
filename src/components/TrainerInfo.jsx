import PropTypes from 'prop-types'

/**
 * TrainerInfo component displays and allows editing of trainer information
 * including name and money.
 */
function TrainerInfo({ trainerName, trainerMoney, onNameChange, onMoneyChange }) {
  return (
    <section className="mb-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Trainer Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trainer Name
          </label>
          <input
            type="text"
            value={trainerName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter trainer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Money (₽)
          </label>
          <input
            type="number"
            value={trainerMoney}
            onChange={(e) => onMoneyChange(parseInt(e.target.value) || 0)}
            min={0}
            max={999999}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter money amount"
          />
        </div>
      </div>
    </section>
  )
}

TrainerInfo.propTypes = {
  trainerName: PropTypes.string.isRequired,
  trainerMoney: PropTypes.number.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onMoneyChange: PropTypes.func.isRequired
}

export default TrainerInfo
