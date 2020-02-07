async function exec(cmd) {
    const req = await fetch("/exec?input=" + encodeURIComponent(cmd));
    const res = await req.json();

    const output = await new Promise((resolve, reject) => {
        const check = setInterval(async () => {
            const o = await getOutput(res.id);
            if(o && o.result) {
                clearInterval(check);
                resolve(o);
            }
        }, 1000);
    })
    return output;
}


async function getOutput(id) {
    const req = await fetch("/get-output?id="+id);
    const res = await req.json();

    return res;
}


async function getBattery() {
    const req = await exec("termux-battery-status");
    return req.result.output;
}

async function getLocation() {
    const req = await exec("termux-location");
    return req.result.output;
}

async function vibrate(d=1000) {
    exec("termux-vibrate -d "+d);
}