/**
 * App.jsx — Root component with routing and global state
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExerciseSetup from './pages/ExerciseSetup';
import CameraCheck from './pages/CameraCheck';
import ExerciseInstructions from './pages/ExerciseInstructions';
import ExerciseSession from './pages/ExerciseSession';
import Summary from './pages/Summary';
import History from './pages/History';
import { EXERCISES, DEFAULT_EXERCISE_ID } from './data/exerciseConfig';

const defaultExercise = EXERCISES[DEFAULT_EXERCISE_ID];

export default function App() {
  // Selected exercise ID — drives setup, session, and summary
  const [selectedExerciseId, setSelectedExerciseId] = useState(DEFAULT_EXERCISE_ID);

  // Exercise config — set in ExerciseSetup, used in session
  const [config, setConfig] = useState({
    exerciseId: DEFAULT_EXERCISE_ID,
    exerciseName: defaultExercise.name,
    minTargetAngle: defaultExercise.defaults.minTargetAngle,
    maxTargetAngle: defaultExercise.defaults.maxTargetAngle,
    repGoal: defaultExercise.defaults.repGoal,
  });

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/setup"
            element={
              <RequireAuth>
                <ExerciseSetup
                  config={config}
                  setConfig={setConfig}
                  selectedExerciseId={selectedExerciseId}
                  setSelectedExerciseId={setSelectedExerciseId}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/camera-check"
            element={
              <RequireAuth>
                <CameraCheck config={config} />
              </RequireAuth>
            }
          />
          <Route
            path="/instructions"
            element={
              <RequireAuth>
                <ExerciseInstructions config={config} />
              </RequireAuth>
            }
          />
          <Route
            path="/session"
            element={
              <RequireAuth>
                <ExerciseSession config={config} />
              </RequireAuth>
            }
          />
          <Route
            path="/summary"
            element={
              <RequireAuth>
                <Summary />
              </RequireAuth>
            }
          />
          <Route
            path="/history"
            element={
              <RequireAuth>
                <History />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
