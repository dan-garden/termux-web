require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const uuidv4 = require('uuid/v4');
const tasks = require('./tasks');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let commands = [];
let outputs = [];

app.post("/set-output", (req, res) => {
    outputs.push(req.body);
    res.json({
        status: true,
        ...req.body
    });
});

app.get("/get-output", (req, res) => {
    let results = outputs.filter(command => {
        return command.id === req.query.id;
    })[0] || false;

    // results = results.map(line => {
    //     if(line) {
    //         if(line.input && line.output && (line.output.trim().startsWith("{") || line.output.trim().startsWith("["))) {
    //             line.output = JSON.parse(line.output);
    //         }
    //     }
    
    //     return line;
    // })

    // res.json({
    //     results
    // })

    res.json({
        results
    })
});

app.get("/get-outputs", (req, res) => {
    res.json(outputs);
});


app.get("/exec", (req, res) => {
    const id = uuidv4();
    const input = req.query.input;
    commands.push({id: id, input: input});
    res.json({
        status: true,
        id
    })
});

app.get("/commands", (req, res) => {
    res.json({
        commands
    });
    commands = [];
});



tasks.run();
app.use('/', express.static(__dirname + '/public'))
app.listen(process.env.PORT, console.log("Server stared on port " + process.env.PORT));