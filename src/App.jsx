import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Home from './pages/Home';
import MyProfile from './pages/MyProfile';
import MyRecipes from './pages/MyRecipes';
import TopPicks from './pages/TopPicks';
import ShoppingList from './pages/ShoppingList';
import ContactUs from './pages/ContactUs';
import Questionnaire from './pages/Questionnaire';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/my-profile" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
            <Route path="/my-recipes" element={<PrivateRoute><MyRecipes /></PrivateRoute>} />
            <Route path="/shopping-list" element={<PrivateRoute><ShoppingList /></PrivateRoute>} />
            <Route path="/top-picks" element={<PrivateRoute><TopPicks /></PrivateRoute>} />
            <Route path="/questionnaire" element={<PrivateRoute><Questionnaire /></PrivateRoute>} />

            <Route path="/contact-us" element={<ContactUs />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
