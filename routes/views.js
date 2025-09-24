var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

router.get('/dashboard', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/search', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/search-tags', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/add-file', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/add-category', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/add-tag', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/categories/:id', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/file/:id', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/tag/:id', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/bookmarks', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

router.get('/pinned', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  else {
    res.redirect('/login');
  }
});

module.exports = router;