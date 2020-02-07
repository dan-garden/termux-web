async function exec(cmd) {
    const req = await fetch("/exec?input=" + encodeURIComponent(cmd));
    const res = await req.json();

    const output = await new Promise((resolve, reject) => {
        const check = setInterval(async () => {
            const o = await getOutput(res.id);
            if(o) {
                clearInterval(check);
                resolve(o);
            }
        }, 1000);
    })

    console.log(output);
    return res;
}


async function getOutput(id) {
    const req = await fetch("/get-output?id="+id);
    const res = await req.json();

    return res;
}