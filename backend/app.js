const express = require("express");
const projectRoutes = require("./routes/project.router");
const path = require("path");
const fs = require("fs");
const schedule = require("node-schedule");
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

//Set the base path to the angular-test dist folder
app.use(express.static(path.join(__dirname, 'admin')));


app.use("/projects", projectRoutes);

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
});
app.get("/", async (req, res) => res.send("hello Smart contract !"));
module.exports = app;
