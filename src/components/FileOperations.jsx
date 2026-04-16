import PropTypes from 'prop-types'

/**
 * FileOperations component handles file upload, new save creation, and download
 */
function FileOperations({ fileName, hasSaveData, onFileUpload, onCreateNew, onDownload, error }) {
  return (
    <section className="mb-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        File Operations
      </h2>
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
          <span>📤 Upload Save</span>
          <input
            type="file"
            accept=".json"
            onChange={onFileUpload}
            className="hidden"
          />
        </label>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          📄 New Save
        </button>
        <button
          onClick={onDownload}
          disabled={!hasSaveData}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          💾 Download Save
        </button>
        {fileName && (
          <span className="text-gray-600 italic">
            Current file: {fileName}
          </span>
        )}
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </section>
  )
}

FileOperations.propTypes = {
  fileName: PropTypes.string,
  hasSaveData: PropTypes.bool.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  error: PropTypes.string
}

export default FileOperations
