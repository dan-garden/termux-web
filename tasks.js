const fetch = require('node-fetch');


class Tasks {
    constructor() {
        this.count = 0;
        this.speed = 0;
        this.interval = false;
        this.scheduled = {
            10000: [this.bins]
        };



        this.notifications = {
            10000: [false]
        };
    }

    async notify(title, content) {
        const command = `termux-notification -t "${title}" -c "${content}"`;
        const cmd = await fetch("https://termux-web.herokuapp.com/exec?input=" + encodeURIComponent(command));
        console.log("sending notification");
    }

    async bins(every, i) {
        if(!this.notifications[every][i]) {
            const req = await fetch("https://bin-days.herokuapp.com/dates?address=63%20burrendong%20road%20coombabah");
            const json = await req.json();
            const result = json.result;
            const timeframe = "withinDay";


            const binTypes = Object.keys(result[timeframe]);
            binTypes.forEach(async binType => {
                const date = result[timeframe][binType];
                if(date) {
                    this.notifications[every][i] = true;
                    await this.notify("Bin Reminder!", `Don't forget to put the ${binType} bin out before tomorrow!`);
                }
            })
        }
    }

    run() {
        this.interval = setInterval(() => {
            Object.keys(this.scheduled).forEach(every => {

                if(this.count % every === 0) {
                    this.scheduled[every].forEach((fn, i) => {
                        fn.bind(this)(every, i);
                    })
                }

            })
            
            this.count++;
        }, this.speed);
    }
}



module.exports = new Tasks();