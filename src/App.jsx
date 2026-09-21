/**
 * App.jsx — Root component with routing and global state
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
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
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/setup"
          element={
            <ExerciseSetup
              config={config}
              setConfig={setConfig}
              selectedExerciseId={selectedExerciseId}
              setSelectedExerciseId={setSelectedExerciseId}
            />
          }
        />
        <Route path="/camera-check" element={<CameraCheck config={config} />} />
        <Route path="/instructions" element={<ExerciseInstructions config={config} />} />
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
