const url = "https://termux-web.herokuapp.com";
const maxCount = 100;
const speed = 1000;


async function exec(cmd) {
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
    return await exec(`termux-notification -t "${title}" -c "${content}"`);
}

async function setSpeed(val) {
    return await exec(`setspeed `+val);
}


function showOutput(request) {
    const output = document.querySelector("#output");
    const result = request.result;
    if(typeof result.output === "object") {
        result.output = "\n" + JSON.stringify(result.output, null, 4);
    }

    output.textContent += result.output;
    output.scrollTop = output.scrollHeight;
}



(() => {

    document.querySelectorAll(".widget").forEach(widget => {
        widget.addEventListener("submit", async e => {
            e.preventDefault();

            const data = new FormData(widget);
            const type = widget.getAttribute("data-type");

            if(type === "speed") {
                const speed = data.get("speed");
                setSpeed(speed).then(showOutput);
            } else if(type === "command") {
                const command = data.get("command");
                exec(command).then(showOutput);
            } else if(type === "battery") {
                getBattery().then(showOutput);
            } else if(type === "location") {
                getLocation().then(showOutput);
            } else if(type === "vibrate") {
                const millis = data.get("millis");
                vibrate(millis).then(showOutput);
            } else if(type === "notify") {
                const title = data.get("title");
                const content = data.get("content");
                notify(title, content).then(showOutput);
            }

            widget.reset();
        })
    })

})()