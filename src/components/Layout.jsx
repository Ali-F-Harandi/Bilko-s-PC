/**
 * Header component displays the main header of the application
 */
function Header() {
  return (
    <header className="bg-red-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold text-center">
          Pokemon Save Editor
        </h1>
        <p className="text-center mt-2 text-red-100">
          Edit your Pokemon save files with ease
        </p>
      </div>
    </header>
  )
}

/**
 * Footer component displays the footer of the application
 */
function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <p>2024 Pokemon Save Editor. Built with React & Tailwind CSS.</p>
        <p className="text-gray-400 text-sm mt-2">
          This is a fan project and is not affiliated with Nintendo or The Pokemon Company.
        </p>
      </div>
    </footer>
  )
}

export { Header, Footer }
