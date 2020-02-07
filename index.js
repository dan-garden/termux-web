const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
const uuidv4 = require('uuid/v4');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let commands = [];

app.post("/set-output", (req, res) => {
    console.log(req.body);
    res.json({
        status: true
    });
});



app.get("/exec", (req, res) => {
    const id = uuidv4();
    const input = req.query.input;
    commands.push({id: id, input: input});
    res.json({
        status: true
    })
});

app.get("/commands", (req, res) => {
    res.json({
        commands
    });
    commands = [];
});


app.listen(3000, console.log("app listening on port 3000"));