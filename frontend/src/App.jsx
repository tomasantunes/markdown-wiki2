import {React, useEffect} from 'react';
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
import SearchTags from './components/SearchTags';
import Pinned from './components/Pinned';
import Login from './components/Login';
import FilePage from './components/FilePage';
import config from './config.json';


function App() {
  useEffect(() => {
    document.title = config['SITENAME'];
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search-tags" element={<SearchTags />} />
        <Route path="/add-file" element={<AddFile />} />
        <Route path="/add-category" element={<AddCategory />} />
        <Route path="/add-tag" element={<AddTag />} />
        <Route path="/categories/:id" element={<CategoryPage />}/>
        <Route path="/file/:id" element={<FilePage />}/>
        <Route path="/tag/:id" element={<Tag />}/>
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/pinned" element={<Pinned />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
