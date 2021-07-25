'use strict';
const express = require('express');
const bearerToken = require('express-bearer-token')
const cors = require('cors')
require('dotenv').config();
const app = express()
const PORT = 3002;
const morgan = require('morgan')

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

morgan.token('logger', (req, res) => { return new Date() })

app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

// apply middleware
app.use(cors({
    exposedHeaders: [
        "Content-Length",
        "x-token-access",
        "x-token-refresh",
        "x-total-count",
    ],
})
);

app.use(express.json());
app.use(bearerToken());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
console.log(__dirname)
const response = (req, res) =>
    res.status(200).send("<h1>REST API JCWM16AH</h1>");
app.get("/", response);

const {
   userRoutes,
   movieRoutes
} = require("./routers");

app.use("/user", userRoutes);
app.use("/movies", movieRoutes);

app.all("*", (req, res) => {
    res.status(404).send({ message: "resource not found" });
});

app.listen(PORT, () => console.log(`listen in PORT ${PORT}`));