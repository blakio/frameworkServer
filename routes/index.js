const db = require("../models");
const mongojs = require("mongojs");
const seedDB = require("./seedDB");
// seedDB(db);

module.exports = (app) => {

    // GET api/table/:table
    app.get("/api/table/:table", (req, res) => {
        db[req.params.table].find({})
            .then(table => res.json(table))
            .catch(err => res.json(err));
    });

    // POST /api/table/:table
    app.post("/api/table/:table", (req, res) => {
        db[req.params.table].create(req.body)
            .then(table => res.json(table))
            .catch(err => res.json(err));
    });

    // PUT /api/table/:table/:id
    app.put("/api/table/:table/:id", (req, res) => {
        db[req.params.table].update(
            { _id: mongojs.ObjectId(req.params.id) },
            { $set: req.body },
            (error, data) => res.send(error ? errorr : data)
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
    app.get("/api/sidebar", (req, res) => {
        db.SideBar.find({})
            .populate({ 
                path: 'data',
                populate: {
                  path: 'data',
                  model: 'SideBarGrandChild'
                } 
             })
            .then(data => res.json(data))
            .catch(err => res.json(err))
    });

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