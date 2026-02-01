import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Exercises from './pages/Exercises';
import ExerciseDetail from './pages/ExerciseDetail';
import Workouts from './pages/Workouts';
import History from './pages/History';
import Progress from './pages/Progress';
import ActiveWorkout from './pages/ActiveWorkout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="exercise/:exerciseId" element={<ExerciseDetail />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="history" element={<History />} />
          <Route path="progress" element={<Progress />} />
        </Route>
        <Route path="/workout/:workoutId" element={<ActiveWorkout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
