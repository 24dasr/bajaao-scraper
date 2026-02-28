import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Settings, List, Activity, Music } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Alerts from './pages/Alerts';
import Watchlist from './pages/Watchlist';
import GuitarData from '../data/guitars.json';

function App() {
  const [guitars, setGuitars] = useState(GuitarData);

  return (
    <Router>
      <div className="min-h-screen bg-charcoal-950 text-white font-sans selection:bg-amber-500 selection:text-white flex flex-col">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-charcoal-900/80 backdrop-blur-md border-b border-charcoal-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <Music className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">Bajaao<span className="text-white">Tracker</span></span>
            </Link>

            <nav className="flex gap-1 md:gap-4">
              <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-charcoal-800 transition-all">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/watchlist" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-charcoal-800 transition-all">
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Watchlist</span>
              </Link>
              <Link to="/alerts" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-charcoal-800 transition-all">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard data={guitars} />} />
            <Route path="/watchlist" element={<Watchlist data={guitars} />} />
            <Route path="/alerts" element={<Alerts data={guitars} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-charcoal-900 border-t border-charcoal-800 mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
            <p>BajaaoTracker &copy; {new Date().getFullYear()}</p>
            <p className="mt-2 opacity-60">Not affiliated with Bajaao.com. For tracking and educational purposes only.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
