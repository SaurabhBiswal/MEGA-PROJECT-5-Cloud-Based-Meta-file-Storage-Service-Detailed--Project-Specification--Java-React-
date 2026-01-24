import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recent from './pages/Recent';
import Shared from './pages/Shared';
import Starred from './pages/Starred';
import TrashPage from './pages/Trash';
import PublicView from './pages/PublicView';
import Profile from './pages/Profile';
import Layout from './components/layout/Layout';
// import PrivateRoute from './components/PrivateRoute'; // Create this later if needed

// Temporary protected route wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="122339887922-jgecduc7f9bt5h6416jik4ter7vcgf2a.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public-view/:token" element={<PublicView />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Redirect / to /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="starred" element={<Starred />} />
            <Route path="recent" element={<Recent />} />
            <Route path="shared" element={<Shared />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
