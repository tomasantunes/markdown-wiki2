var express = require('express');
var router = express.Router();

// If the user is not logged in he is redirected to the login page. Else we return the index.html file for that route.
router.get('/', (req,res) => {
  console.log(req.session.isLoggedIn);
  if(req.session.isLoggedIn) {
    res.redirect('/dashboard');
  }
  else {
    res.redirect('/login');
  }
});

module.exports = router;
