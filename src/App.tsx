import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Exercises from './pages/Exercises';
import ExerciseDetail from './pages/ExerciseDetail';
import Workouts from './pages/Workouts';
import Plan from './pages/Plan';
import History from './pages/History';
import Progress from './pages/Progress';
import ProgressPhotos from './pages/ProgressPhotos';
import ActiveWorkout from './pages/ActiveWorkout';
import About from './pages/About';
import UpdatePrompt from './components/UpdatePrompt';
import FloatingTimer from './components/FloatingTimer';

function App() {
  return (
    <BrowserRouter>
      <UpdatePrompt />
      <FloatingTimer />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="exercise/:exerciseId" element={<ExerciseDetail />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="plan" element={<Plan />} />
          <Route path="history" element={<History />} />
          <Route path="progress" element={<Progress />} />
          <Route path="photos" element={<ProgressPhotos />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route path="/workout/:workoutId" element={<ActiveWorkout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
