const db = require("../models");
const mongojs = require("mongojs");
const mongoose = require("mongoose")
const clockwork = require('clockwork')({key: process.env.CLOCK_WORK_API_KEY});

const axios = require("axios");
axios.defaults.headers.post['Content-Type'] ='application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const moment = require("moment");
var mtz = require('moment-timezone');

const {
    pinMapper,
    routeMapper
} = require("../config");

const getDB = (blakio_store) => {
    return db[routeMapper[blakio_store]].models;
}

const getUpdate = req => {
    const update = {};
    if(req.body.field)      update.$push = { [req.body.field]: req.body.data };
    if(req.body.setFields)  update.$set = { ...req.body.setFields };
    return update;
}

const getTimeDifferences = (pairs) => {
    const times = [];
    pairs.forEach(data => {
        const start = moment(data[0].time.formatted);
        const end = moment(data[1].time.formatted);
        times.push(moment.duration(end.diff(start)));
    });
    const hoursDiff = [];
    times.forEach(data => {
        hoursDiff.push(data.asHours())
    })
    const arrSum = arr => arr.reduce((a, b) => a + b, 0)
    return arrSum(hoursDiff).toFixed(2);
}

const getTimeWorks = (td, Time, employeeId, res) => {

    const arr = [...td];
    if (!td[0].time.hasClockedIn) {
        arr.shift();
    }
    if(!arr.length) return res.json({
        hours: "0"
    });
    let chunks = [];
    const division = arr.length / 2;
    const size = arr.length / division;

    if(arr.length === 2){
        chunks = [ [...arr] ]
    } else {
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }
    }

    if(chunks[chunks.length - 1].length === 1){
        const curId = chunks[chunks.length - 1][0].time._id;
        const query = [
            { $match: { employeeId } },
            { $unwind: "$time" },
            {
                "$match": {
                    "time._id": {
                        "$gt": curId
                    }
                }
            }
        ];
        Time.aggregate(query).then(data => {
            if(data.length === 0){
                chunks.pop();
                return res.json({
                    hours: getTimeDifferences(chunks)
                })
            } else {
                chunks[chunks.length - 1].push(data[0])
                return res.json({
                    hours: getTimeDifferences(chunks)
                })
            }
        }).catch(err => res.json({err}))
    } else {
        return res.json({
            hours: getTimeDifferences(chunks)
        })
    }
}

module.exports = (app) => {
    /**
     * GET
     */



    // GET api/square/callback
    app.get("/api/square/callback", (req, res) => {
        console.log(req)
        res.send("ok")
    })
    
    // GET api/accessToken
    app.get("/api/accessToken", (req, res) => {
        const username = "AVj7DISqu3xid2JT0pv82WPa7iEHx8k39JVZ3OoMT2QA-pGIwcJOQeiDIIZwT2XQVVbpdUuDjcNP4ko4";
        const password = "ENxNp7xsqEZkIpDthMnp0cB7fzDH0RwfCsm_xGYjWFFoWpk1GLAm_G1XRZpZIRUlM7UZdwX__s_-7jn-";
        // const username = "sb-dgdjr2944412_api1.business.example.com";
        // const password = "MdOx3Ne$";
        
        axios({
            url: 'https://api.sandbox.paypal.com/v1/oauth2/token',
            method: 'post',
            headers: { 
                'Accept': 'application/json', 
                'Accept-Language': 'en_US',
                'content-type':'application/x-www-form-urlencoded'
            },
            auth: {
                username,
                password
            },
            params: {
                grant_type:'client_credentials'
            }
        }).then(data => {
            res.send(data.data.access_token)
        }).catch(err => res.send(err))
    });

    // GET api/time
    app.get("/api/time", (req, res) => {
        axios.get(`http://api.timezonedb.com/v2.1/get-time-zone?key=7PUNDMDEMWEX&format=json&by=position&lat=40.689247&lng=-74.0445022`).then(data => {
            res.json(data.data);
        }).catch(err => res.json(err))
    });

    // GET api/timesheet/hours/:date
    app.post("/api/timesheet/hours/day/:id", (req, res) => {
        const { day } = req.body;
        // const day = "07/25/20";
        const tzDifference = mtz(day).tz("America/New_York").format();
        const diffString = tzDifference.slice(tzDifference.length - 6);
        const split = diffString.split(":");
        const sign = split[0].includes("-") ? "subtract" : "add";
        const hours = split[0].replace("-", "");
        const minutes = split[1];

        const start = moment(day).startOf("day")[sign](hours, "hours")[sign](minutes, "minutes").unix()
        const end = moment(day).endOf("day")[sign](hours, "hours")[sign](minutes, "minutes").unix();
        const employeeId = mongoose.Types.ObjectId(req.params.id);
        getDB(req.headers.blakio_store).Time.aggregate([
            {
                $match: { employeeId }
            },
            {
                $unwind: "$time"
            },
            {
                "$match": {
                    "time.timestamp": {
                        "$gte": start,
                        "$lte": end
                    }
                }
            }
        ]).then(data => {
            if(data.length){
                getTimeWorks(data, getDB(req.headers.blakio_store).Time, employeeId, res)
            } else {
                res.json({
                    hours: "0"
                })
            }
        }).catch(err => res.json({err}))
    })

    // GET api/table/:table
    app.get("/api/table/:table", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].find({})
            .then(table => res.json(table))
            .catch(err => res.json(err));
    });



    /**
     * POST
     */



    // POST /api/table/:table
    app.post("/api/table/:table", (req, res) => {
        if(req.body.field || req.body.setFields){
            const update = getUpdate(req);
            const options = { upsert: true };

            getDB(req.headers.blakio_store)[req.params.table].findOneAndUpdate(req.body.query, update, options, function (err, table) {
                res.json(err ? err : table)
            });
        } else {
            getDB(req.headers.blakio_store)[req.params.table].create(req.body)
                .then(table => res.json(table))
                .catch(err => res.json(err));
        }
    });

    // POST /api/table/search/Time
    app.post("/api/table/search/:table", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].find(req.body.query)
            .then(table => res.json(table))
            .catch(err => res.json(err));
    });

    // POST /api/table/search/Time
    app.post("/api/table/aggregate/:table/:id", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].aggregate([
            {
                $match: {
                    employeeId: mongoose.Types.ObjectId(req.params.id)
                }
            },
            ...req.body.query
        ])
            .then(table => res.send(table))
            .catch(err => res.json(err));
    });

    // POST api/sendtext
    app.post("/api/sendtext", (req, res) => {
        clockwork.sendSms({ To: '+18147530157', Content: req.body.message}, 
            (err, resp) => {
                if (err) res.json({ err });
                res.json({ message: `Message sent ${resp.responses[0].id}`});
            });
    });

    // POST api/getTimeChangeConstraints
    app.post("/api/getTimeChangeConstraints", (req, res) => {
        const query = res.body.query
        getDB(req.headers.blakio_store)[req.params.table].aggregate([
            {
                $match: {
                    employeeId: mongoose.Types.ObjectId(req.params.id)
                }
            },
            ...req.body.query
        ])
            .then(table => res.send(table))
            .catch(err => res.json(err));
    });

    app.post("/api/login", (req, res) => {
        const {
            pin,
            check
        } = req.body;
        const store = pinMapper[pin];
        if(check){
            res.json({
                logIn: Object.values(pinMapper).includes(check)
            })
        } else if(pin && store){
            res.json({ store })
        } else {
            res.status(404).json({
                title: "Incorrect Pin",
                message: "Please try again. Thanks"
            })
        }
    });

    app.post("/api/getTimeBoundaries/:id/:timestamp", (req, res) => {

        const boundaries = {};

        const {
            id,
            timestamp
        } = req.params;

        const next = [
            { $match: { employeeId: mongoose.Types.ObjectId(id) } },
            { $unwind: "$time" },
            { "$match": { "time.timestamp": { "$gt": parseInt(timestamp) } } }
        ];

        const prev = [
            { $match: { employeeId: mongoose.Types.ObjectId(id) } },
            { $unwind: "$time" },
            { "$match": { "time.timestamp": { "$lt": parseInt(timestamp) } } }
        ];

        getDB(req.headers.blakio_store).Time.aggregate(next).limit(1)
            .then(data => {
                boundaries.next = data[0];
                getDB(req.headers.blakio_store).Time.aggregate(prev).sort({ "time.timestamp": "desc" }).limit(1)
                    .then(data2 => {
                        boundaries.prev = data2[0];
                        res.json(boundaries);
                    }).catch(err => res.json(err))
            })
            .catch(err => res.json(err));
    });

    // PUT /api/table/array/:table/:id
    app.post("/api/updateTime", (req, res) => {
        getDB(req.headers.blakio_store).Time.update(
            { "time._id":  mongoose.Types.ObjectId(req.body.id)},
            {
                "$set": {
                    "time.$.formatted": req.body.formatted,
                    "time.$.timestamp": req.body.timestamp
                }
            }
        ).then(data => {
            res.json(data)
        }).catch(err => res.send(err));
    });


    /**
     * PUT
     */



    // PUT /api/table/:table/:id
    app.put("/api/table/:table/:id", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].update(
            { _id: mongojs.ObjectId(req.params.id) },
            { $set: req.body },
            (error, data) => res.send(error ? error : data)
        );
    });



    /**
     * DELETE
     */



    // DELETE /api/table/:table/:id
    app.delete("/api/table/:table/:id", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].remove(
            { _id: mongojs.ObjectID(req.params.id) },
            (error, data) => res.send(error ? error : data)
        );
    });
}