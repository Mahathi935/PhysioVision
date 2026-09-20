/**
 * App.jsx — Root component with routing and global state
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Dashboard from './pages/Dashboard';
import ExerciseSetup from './pages/ExerciseSetup';
import CameraCheck from './pages/CameraCheck';
import ExerciseSession from './pages/ExerciseSession';
import Summary from './pages/Summary';
import History from './pages/History';
import { EXERCISES, DEFAULT_EXERCISE_ID } from './data/exerciseConfig';

const defaultExercise = EXERCISES[DEFAULT_EXERCISE_ID];

export default function App() {
  // Global exercise config — set in ExerciseSetup, used in session
  const [config, setConfig] = useState({
    minTargetAngle: defaultExercise.defaults.minTargetAngle,
    maxTargetAngle: defaultExercise.defaults.maxTargetAngle,
    repGoal: defaultExercise.defaults.repGoal,
  });

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/setup"
          element={<ExerciseSetup config={config} setConfig={setConfig} />}
        />
        <Route path="/camera-check" element={<CameraCheck />} />
        <Route
          path="/session"
          element={<ExerciseSession config={config} />}
        />
        <Route path="/summary" element={<Summary />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}
