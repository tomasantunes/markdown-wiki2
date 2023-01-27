import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import './App.css';
import Home from './components/Home';
import AddFile from './components/AddFile';
import AddCategory from './components/AddCategory';
import AddTag from './components/AddTag';
import CategoryPage from './components/CategoryPage';
import Bookmarks from './components/Bookmarks';
import Tag from './components/Tag';
import SearchPage from './components/SearchPage';
import Pinned from './components/Pinned';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/add-file" element={<AddFile />} />
        <Route path="/add-category" element={<AddCategory />} />
        <Route path="/add-tag" element={<AddTag />} />
        <Route path="/categories/:id" element={<CategoryPage />}/>
        <Route path="/tag/:id" element={<Tag />}/>
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/pinned" element={<Pinned />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
