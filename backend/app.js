const express = require("express");
const projectRoutes = require("./routes/project.router");
const path = require("path");
const fs = require("fs");
const schedule = require("node-schedule");
const app = express();

app.use(express.json());

app.use("/projects", projectRoutes);

app.get("/", async (req, res) => res.send("hello Smart contract !"));
module.exports = app;