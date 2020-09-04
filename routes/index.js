const db = require("../models");
const mongojs = require("mongojs");
const mongoose = require("mongoose")
const clockwork = require('clockwork')({ key: process.env.CLOCK_WORK_API_KEY });

const axios = require("axios");
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const moment = require("moment");
var mtz = require('moment-timezone');


const md5 = require('md5');
const SquareConnect = require('square-connect');
const config = require('./config.js');
// Configure Square defcault client
const defaultClient = SquareConnect.ApiClient.instance
defaultClient.basePath = config.SQ_SANDBOX_BASEURL
// Configure Square OAuth API instance
const oauthInstance = new SquareConnect.OAuthApi();
// INCLUDE PERMISSIONS YOU WANT YOUR SELLER TO GRANT YOUR APPLICATION
const scopes = ["ITEMS_READ", "MERCHANT_PROFILE_READ", "PAYMENTS_WRITE_ADDITIONAL_RECIPIENTS", "PAYMENTS_WRITE", "PAYMENTS_READ"]

const {
    pinMapper,
    routeMapper
} = require("../config");

const getDB = (blakio_store) => {
    return db[routeMapper[blakio_store]].models;
}

const getUpdate = req => {
    const update = {};
    if (req.body.field) update.$push = { [req.body.field]: req.body.data };
    if (req.body.setFields) update.$set = { ...req.body.setFields };
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
    if (!arr.length) return res.json({
        hours: "0"
    });
    let chunks = [];
    const division = arr.length / 2;
    const size = arr.length / division;

    if (arr.length === 2) {
        chunks = [[...arr]]
    } else {
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size))
        }
    }

    if (chunks[chunks.length - 1].length === 1) {
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
            if (data.length === 0) {
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
        }).catch(err => res.json({ err }))
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



    // GET api/confirmation
    app.get("/api/confirmation", (req, res) => {
        res.sendFile('./confirmation/index.html', { root: __dirname })
    })

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
                'content-type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username,
                password
            },
            params: {
                grant_type: 'client_credentials'
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
            if (data.length) {
                getTimeWorks(data, getDB(req.headers.blakio_store).Time, employeeId, res)
            } else {
                res.json({
                    hours: "0"
                })
            }
        }).catch(err => res.json({ err }))
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
        if (req.body.field || req.body.setFields) {
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
        clockwork.sendSms({ To: '+18147530157', Content: req.body.message },
            (err, resp) => {
                if (err) res.json({ err });
                res.json({ message: `Message sent ${resp.responses[0].id}` });
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
        if (check) {
            res.json({
                logIn: Object.values(pinMapper).includes(check)
            })
        } else if (pin && store) {
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
            { "time._id": mongoose.Types.ObjectId(req.body.id) },
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



    // SQUARE API
    /**
     * Description:
     *  Serves the link that merchants click to authorize your application
    */
    app.get("/api/sandbox_request_token", (req, res) => {
        // Set the Auth_State cookie with a random md5 string to protect against cross-site request forgery.
        // Auth_State will expire in 300 seconds (5 mins) after the page is loaded.
        const state = md5(Date.now());
        const url = config[req.headers.blakio_store].SQ_SANDBOX_BASEURL + `/oauth2/authorize?client_id=${config[req.headers.blakio_store].SQ_SANDBOX_APP_ID}&` + `response_type=code&` + `scope=${scopes.join('+')}` + `&state=` + state;
        res.cookie("Auth_State", state, { expire: Date.now() + 300000 }).send(
            `<p>
            <a href='${url}'> SANDBOX: Authorize this application</a>
        </p>`
        )
    });

    /**
     * Description:
     *  Serves requests from Square to your application's redirect URL
     *  Note that you need to set your application's Redirect URL to
     *  http://localhost:8000/sandbox_callback from your application dashboard
     *
     * Query Parameters:
     *  state: the Auth State set in request_token
     *  response_type: the type of the response; should be "code"
     *  code: the authorization code
     */
    app.get('/api/sandbox_callback', (req, res) => {
        console.log(req.query)
        // Verify the state to protect against cross-site request forgery.
        if (req.cookies["Auth_State"] !== req.query['state']) {
            res.json({error: "Invalid state parameter."})
        }

        else if (req.query['error']) {
            // Check to see if the seller clicked the Deny button and handle it as a special case.
            if (("access_denied" === req.query['error']) && ("user_denied" === req.query["error_description"])) {
                res.json({error: "You chose to deny access to the app."})
            }
            // Display the error and description for all other errors.
            else {
                res.json({error: eq.query["error_description"]})
            }
        }
        // When the response_type is "code", the seller clicked Allow
        // and the authorization page returned the auth tokens.
        else if ("code" === req.query["response_type"]) {
            // Extract the returned authorization code from the URL
            var code = req.query.code

            // Provide the code in a request to the Obtain Token endpoint
            var body = {
                client_id: config[req.headers.blakio_store].SQ_SANDBOX_APP_ID,
                client_secret: config[req.headers.blakio_store].SQ_SANDBOX_APP_SECRET,
                code: code,
                grant_type: 'authorization_code',
            }
            oauthInstance.obtainToken(body)
                // Extract the returned access token from the ObtainTokenResponse object
                .then(data => {
                    // Because we want to keep things simple and we're using Sandbox,
                    // we call a function that writes the tokens to the page so we can easily copy and use them directly.
                    // In production, you should never write tokens to the page. You should encrypt the tokens and handle them securely.
                    res.json({
                        access_token: data.access_token,
                        refresh_token: data.refresh_token,
                        expires_at: data.expires_at,
                        merchant_id: data.merchant_id
                    })
                })
                // The response from the Obtain Token endpoint did not include an access token. Something went wrong.
                .catch(error => {
                    res.json({error: error.response.body.message})
                })
        }
        else {
            // No recognizable parameters were returned.
            res.json({error: "Expected parameters were not returned"})
        }
    });
}