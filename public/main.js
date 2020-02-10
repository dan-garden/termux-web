const url = "https://termux-web.herokuapp.com";
const maxCount = 100;
const speed = 1000;
const output = document.querySelector("#output");

async function exec(cmd) {
    showOutput({
        input: cmd
    })
    const req = await fetch(url + "/exec?input=" + encodeURIComponent(cmd));
    const res = await req.json();
    let count = 0;
    const output = await new Promise((resolve, reject) => {
        const check = setInterval(async () => {
            if (count > maxCount) {
                resolve({
                    status: "error",
                    message: "Too slow"
                });
            } else {
                const o = await getOutput(res.id);
                if (o && o.result) {
                    clearInterval(check);
                    resolve(o);
                } else {
                    count++;
                }
            }
        }, speed);
    })
    return output;
}


async function getOutput(id) {
    const req = await fetch(url + "/get-output?id=" + id);
    const res = await req.json();

    return res;
}

async function getOutputs() {
    const req = await fetch(url + "/get-outputs");
    const res = await req.json();

    return res;
}

async function getBattery() {
    return await exec("termux-battery-status");
}

async function getLocation() {
    return await exec("termux-location");
}

async function vibrate(d = 1000) {
    return await exec("termux-vibrate -d " + d);
}

async function notify(title, content) {
    return await exec(`termux-notification -t "${title}" -c "${content}"  --led-on 1000`);
}

async function setSpeed(val) {
    return await exec(`setspeed ` + val);
}

async function getContacts() {
    return await exec(`termux-contact-list`);
}


let torchState = 'off';
async function torch() {
    torchState = torchState === 'on' ? 'off' : 'on';

    return await exec(`termux-torch ${torchState}`);
}




function showOutput(request) {
    const result = request.result || request;

    if (result.input === "clear" || result.input === "cls") {
        output.innerHTML = "";
    } else {
        if (typeof result.output === "object") {
            result.output = JSON.stringify(result.output, null, 4) + "\n";
        }

        output.innerHTML += `<span class="output-input">${result.input || ""}</span> \n`;
        output.innerHTML += `<span class="output-output">${result.output || ""}</span>`;
        output.innerHTML += `<span class="output-error">${result.error || ""}</span>`;
        output.scrollTop = output.scrollHeight;
    }
}

function loadOutput() {
    getOutputs().then(outputs => {
        output.innerHTML = ``;
        outputs.forEach(showOutput);
    });
}


const commands = {
    clear: {
        fn: exec,
        title: "Clear Output",
        inputs: {
            cmd: {
                type: "hidden",
                value: "clear",
            }
        }
    },
    speed: {
        fn: setSpeed,
        title: "Set Speed",
        inputs: {
            speed: {
                type: "number",
                placeholder: "Milliseconds..."
            }
        }
    },
    command: {
        fn: exec,
        title: "Command Input",
        inputs: {
            command: {
                placeholder: "Command..."
            }
        }
    },
    battery: {
        fn: getBattery,
        title: "Get Battery"
    },
    location: {
        fn: getLocation,
        title: "Get Location"
    },
    vibrate: {
        fn: vibrate,
        title: "Vibrate",
        inputs: {
            millis: {
                type: "number",
                placeholder: "Milliseconds..."
            }
        }
    },
    torch: {
        fn: torch,
        title: "Torch"
    },
    notify: {
        fn: notify,
        title: "Notify",
        inputs: {
            title: {
                placeholder: "Title..."
            },
            content: {
                placeholder: "Content..."
            }
        }
    },
    contacts: {
        fn: getContacts,
        title: "Get Contacts"
    }

}


loadOutput();


const input = document.querySelector("#input");
const commandTypes = Object.keys(commands);

commandTypes.forEach(commandType => {
    const command = commands[commandType];
    const inputs = command.inputs || [];
    const inputTypes = Object.keys(inputs);

    const widget = document.createElement("form");
    widget.classList.add("widget");
    widget.setAttribute("data-type", commandType);
    widget.innerHTML = `
    <h4>${command.title}</h4>
    ${inputTypes.map(inputType => {
        const input = inputs[inputType];
        // return `<input value="${input.value || ''}" type="${input.type || 'text'}" placeholder="${input.placeholder || ''}" name="${inputType}"/>`;
    }).join("\n")}
    <button type="submit">Submit</button>
    `;

    input.append(widget);

    widget.addEventListener("submit", async e => {
        e.preventDefault();
        const data = new FormData(widget);
        // const values = inputTypes.map(inputType => data.get(inputType));
        let includesNull = false;
        const values = inputTypes.map(inputType => {
            const input = inputs[inputType];
            if (!includesNull) {
                let val;
                if (input.type === "hidden") {
                    val = input.value;
                } else {
                    val = prompt("Enter " + input.placeholder || inputType, input.value);
                }

                if (!val) {
                    includesNull = true;
                }
                return val;
            } else {
                return null;
            }
        });

        if (!values.includes(null)) {
            command.fn(...values).then(loadOutput);
        }
        widget.reset();
    });

});