import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import Home from './components/Home';
import AddFile from './components/AddFile';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-file" element={<AddFile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
