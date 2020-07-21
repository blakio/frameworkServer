const db = require("../models");
const mongojs = require("mongojs");
const mongoose = require("mongoose")
const clockwork = require('clockwork')({key: process.env.CLOCK_WORK_API_KEY});

const axios = require("axios");
axios.defaults.headers.post['Content-Type'] ='application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const getUpdate = req => {
    const update = {};
    if(req.body.field)      update.$push = { [req.body.field]: req.body.data };
    if(req.body.setFields)  update.$set = { ...req.body.setFields };
    return update;
}

module.exports = (app) => {
    // GET api/time
    app.get("/api/time", (req, res) => {
        axios.get(`http://api.timezonedb.com/v2.1/get-time-zone?key=7PUNDMDEMWEX&format=json&by=position&lat=40.689247&lng=-74.0445022`).then(data => {
            res.json(data.data);
        }).catch(err => res.json(err))
    });

    // GET api/table/:table
    app.get("/api/table/:table", (req, res) => {
        db[req.params.table].find({})
            .then(table => res.json(table))
            .catch(err => res.json(err));
    });

    // POST /api/table/:table
    app.post("/api/table/:table", (req, res) => {
        if(req.body.field || req.body.setFields){
            const update = getUpdate(req);
            const options = { upsert: true };

            db[req.params.table].findOneAndUpdate(req.body.query, update, options, function (err, table) {
                res.json(err ? err : table)
            });
        } else {
            db[req.params.table].create(req.body)
                .then(table => res.json(table))
                .catch(err => res.json(err));
        }
    });

    // POST /api/table/search/Time
    app.post("/api/table/search/:table", (req, res) => {
        db[req.params.table].find(req.body.query)
            .then(table => res.json(table))
            .catch(err => res.json(err));
    });

    // POST /api/table/search/Time
    app.post("/api/table/aggregate/:table/:id", (req, res) => {
        // const id = req.body.query[0].$match.employeeId;
        // req.body.query[0].$match.employeeId = mongoose.Types.ObjectId(id);
        console.log(req.body.query)
        db[req.params.table].aggregate([
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
        db[req.params.table].update(
            { _id: mongojs.ObjectId(req.params.id) },
            { $set: req.body },
            (error, data) => res.send(error ? error : data)
        );
    });

    // DELETE /api/table/:table/:id
    app.delete("/api/table/:table/:id", (req, res) => {
        db[req.params.table].remove(
            { _id: mongojs.ObjectID(req.params.id) },
            (error, data) => res.send(error ? error : data)
        );
    });

    // side bar routes
    // app.get("/api/sidebar", (req, res) => {
    //     db.SideBar.find({})
    //         .populate({ 
    //             path: 'data',
    //             populate: {
    //               path: 'data',
    //               model: 'SideBarGrandChild'
    //             } 
    //          })
    //         .then(data => res.json(data))
    //         .catch(err => res.json(err))
    // });

    /*

    EXAMPLES

    app.post("/submit", ({body}, res) => {
    db.Book.create(body)
        .then(({_id}) => db.Library.findOneAndUpdate({}, { $push: { books: _id } }, { new: true }))
        .then(dbLibrary => {
        res.json(dbLibrary);
        })
        .catch(err => {
        res.json(err);
        });
    });

    */
}