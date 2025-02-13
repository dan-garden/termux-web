const url = "https://termux-web.herokuapp.com";
// const url = "http://localhost:5000";
const maxCount = 100;
const speed = 1000;

const input = document.querySelector("#input");
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
                if (o && o.results) {
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

async function uploadFile(filename) {
    const input = `curl -s -F "file=@${filename}" https://dan-garden.com/api/post-image.php`;
    return await exec(input).then(() => loadOutput());
}

async function takePhoto(id="1", open="0") {
    const filename = "photos/" + id + "_" + Date.now()+".jpeg";
    const res = await exec(`termux-camera-photo -c ${id} ${filename}${open ==="1" ? ` && termux-open ${filename}` : ''} && echo "Photo taken using id:${id}"`);
    uploadFile(filename);
    return res;
}

async function makeDirectory(name) {
    return await exec(`mkdir ${name}`);
}

async function share(string) {
    return await exec(`termux-clipboard-set ${string} && echo ${string}`);
}

function showOutput(request) {
    const result = request.result || request;

    if (result.input === "clear" || result.input === "cls") {
        output.innerHTML = "";
    } else {
        if (typeof result.output === "object") {
            result.output = JSON.stringify(result.output, null, 4) + "\n";
        }

        const aopts = {
            attributes: [{
                name: "target",
                value: "_blank"
            }]
        };

        output.innerHTML += `<span class="output-input">${result.input ? anchorme(result.input, aopts) : ""}</span> \n`;
        output.innerHTML += `<span class="output-output">${result.output ? anchorme(result.output, aopts) : ""}</span>`;
        output.innerHTML += `<span class="output-error">${result.error ? anchorme(result.error, aopts) : ""}</span>`;
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
    speed: {
        fn: setSpeed,
        title: "Set Speed",
        icon: "fast-forward",
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
        icon: "terminal",
        inputs: {
            command: {
                placeholder: "Command..."
            }
        }
    },
    clear: {
        fn: exec,
        title: "Clear Output",
        icon: "trash",
        inputs: {
            cmd: {
                type: "hidden",
                value: "clear",
            }
        }
    },
    ls: {
        fn: exec,
        title: "List Files",
        icon: "list",
        inputs: {
            cmd: {
                type: "hidden",
                value: "ls"
            }
        }
    },
    mkdir: {
        fn: makeDirectory,
        title: "Make Directory",
        icon: "plus-square",
        inputs: {
            name: {
                placeholder: "Directory Name"
            }
        }
    },
    battery: {
        fn: getBattery,
        title: "Get Battery",
        icon: "battery"
    },
    location: {
        fn: getLocation,
        title: "Get Location",
        icon: "map-pin",
    },
    vibrate: {
        fn: vibrate,
        title: "Vibrate",
        icon: "smartphone",
        inputs: {
            millis: {
                type: "number",
                placeholder: "Milliseconds..."
            }
        }
    },
    torch: {
        fn: torch,
        title: "Torch",
        icon: "sun"
    },
    notify: {
        fn: notify,
        title: "Notify",
        icon: "alert-circle",
        inputs: {
            title: {
                placeholder: "Title..."
            },
            content: {
                placeholder: "Content..."
            }
        }
    },

    share: {
        fn: share,
        title: "Share",
        icon: "share",
        inputs: {
            string: {
                placeholder: "String..."
            }
        }
    },

    contacts: {
        fn: getContacts,
        title: "Get Contacts",
        icon: "book"
    },

    front_photo: {
        fn: takePhoto,
        title: "Front Photo",
        icon: "skip-forward|camera",
        inputs: {
            id: {
                type: "hidden",
                value: "1"
            },
            open: {
                type: "hidden",
                placeholder: "open value.  0 = false | 1 = true",
                value: "0"
            }
        }
    },

    back_photo: {
        fn: takePhoto,
        title: "Back Photo",
        icon: "skip-back|camera",
        inputs: {
            id: {
                type: "hidden",
                value: "0"
            },
            open: {
                type: "hidden",
                placeholder: "open value.  0 = false | 1 = true",
                value: "0"
            }
        }
    }

}


loadOutput();


const commandTypes = Object.keys(commands);

commandTypes.forEach(commandType => {
    const command = commands[commandType];
    const inputs = command.inputs || [];
    const inputTypes = Object.keys(inputs);

    const widget = document.createElement("form");
    widget.classList.add("widget");
    widget.setAttribute("data-type", commandType);
    widget.innerHTML = `
    ${inputTypes.map(inputType => {
        const input = inputs[inputType];
        // return `<input value="${input.value || ''}" type="${input.type || 'text'}" placeholder="${input.placeholder || ''}" name="${inputType}"/>`;
    }).join("\n")}
    <button title="${command.title}" type="submit">${
        command.icon.split("|").map(icon => `<i data-feather="${icon}"></i>`).join('')
    }</button>
    `;

    input.append(widget);
    feather.replace();

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



document.querySelector("#reload").addEventListener("click", e => {
    e.preventDefault();
    output.innerHTML = "";
    showOutput({ input: "Reloading..." });
    loadOutput();
})