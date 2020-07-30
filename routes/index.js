const db = require("../models");
const mongojs = require("mongojs");
const mongoose = require("mongoose")
const clockwork = require('clockwork')({key: process.env.CLOCK_WORK_API_KEY});

const axios = require("axios");
axios.defaults.headers.post['Content-Type'] ='application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const moment = require("moment");
var mtz = require('moment-timezone');

const routeMapper = require("./routeMapper");
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

    // PUT /api/table/:table/:id
    app.put("/api/table/:table/:id", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].update(
            { _id: mongojs.ObjectId(req.params.id) },
            { $set: req.body },
            (error, data) => res.send(error ? error : data)
        );
    });

    // DELETE /api/table/:table/:id
    app.delete("/api/table/:table/:id", (req, res) => {
        getDB(req.headers.blakio_store)[req.params.table].remove(
            { _id: mongojs.ObjectID(req.params.id) },
            (error, data) => res.send(error ? error : data)
        );
    });
}