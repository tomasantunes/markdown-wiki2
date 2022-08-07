import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import Home from './components/Home';
import AddFile from './components/AddFile';
import AddCategory from './components/AddCategory';
import AddTag from './components/AddTag';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-file" element={<AddFile />} />
        <Route path="/add-category" element={<AddCategory />} />
        <Route path="/add-tag" element={<AddTag />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
