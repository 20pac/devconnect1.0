const express = require("express");
const router = express.Router();

//Get       api/post
//Access    public
router.get("/", (req, res) => res.send("Post route"));

module.exports = router;
