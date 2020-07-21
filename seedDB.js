const Types = require("./routes/Types");
const mongojs = require("mongojs");
const db = require("./models");

// db.sidebars.remove({})
// db.sidebarchildren.remove({})
// db.sidebargrandchildren.remove({})
// db.dashboards.find({})

// db.sidebars.find({})
// db.sidebarchildren.find({})
// db.sidebargrandchildren.find({})
// db.dashboards.remove({})

const employees = [
    {
        firstName: "Isaiah",
        lastName: "Harrison",
        dob: "05/28/1989",
        jobTitle: "Developer"
    },
    {
        firstName: "Jasmin",
        lastName: "Burke",
        dob: "07/18/1994",
        jobTitle: "Human Resources",
    }
];

const dashboard2 = [
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "12"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "4"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "4"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "6"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "6"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "6"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "4"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "4"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "4"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    },
    {
        "title": "sample",
        "conditions": ["5e7bd7cdf54f6b61dcdb1d63"],
        "component": "timesheet",
        "columns": "3"
    }
]

const dashboard = [
    {
        title: "time sheet",
        conditions: ["5e7bd7cdf54f6b61dcdb1d61", "5e7bd7cdf54f6b61dcdb1d68"],
        component: "timesheet",
        columns: "4"
    },
    {
        title: "history",
        conditions: ["5e7bd7cdf54f6b61dcdb1d63"],
        component: "table",
        columns: "4"
    },
    {
        title: "charts",
        conditions: ["5e7bd7cdf54f6b61dcdb1d63"],
        component: "charts",
        columns: "2"
    }
]

const sideBar = [
    {
        title: "Timesheet",
        fn: "selectTimesheet",
        data: [
            {
                title: "employees",
                icons: ["far fa-user-circle", "fas fa-dot-circle", "far fa-dot-circle"],
                isOpen: null,
                onClick: null,
                types: ["list", "click"],
                clickType: Types.SET_CHILD_CLICK_OPTION,
                fn: "selectEmployeeDropwdown",
                data: [
                    {
                        text: "Sample",
                        subText : "Sample",
                        icon: "fas fa-id-card-alt",
                        isActive: null,
                        types: ["customFunction"],
                        fn: "selectEmployee"
                    }
                ]
            }
        ]
    },
    {
        title: "Directory",
        data: []
    },
    {
        title: "KPI reporting",
        data: []
    },
    {
        title: "Kiosk",
        data: []
    },
    {
        title: "Document storage",
        data: []
    },
    {
        title: "Messaging",
        data: []
    },
    {
        title: "Alert",
        data: []
    }
];

const createMultiple = (table, data) => {
    const array = [];
    data.forEach(dt => array.push(db[table].create(dt)));
    return Promise.all(array);
}


// const inserts = [];
dashboard2.forEach(data => db.Dashboard.create(data));
// Promise.all(inserts).then(data => console.log("hey")).catch(err => console.log(err))

// db.Dashboard.create(dashboard2[0])
// db.Dashboard.create(dashboard2[0]).then(data => console.log(data)).catch(err => console.log(err))



/*
employees.forEach(data => db.Employee.create(data));

dashboard.forEach(data => db.Dashboard.create(data));

// sidebar population //////////////////////////
const allDropdowns = [];
const childIndex = [];
const grandChildIndex = [];

// add parent dropdown options
sideBar.forEach((data, index) => {
    // parent.push(index)
    allDropdowns.push(db.SideBar.create({
        ...data,
        data: []
    }))
});

allDropdowns.push("next")
// add child dropdown options
sideBar.forEach((data, index) => {
    if(data.data && data.data.length){
        data.data.forEach(cd => {
            childIndex.push(index)
            allDropdowns.push(db.SideBarChild.create({
                ...cd,
                data: []
            }))
        });
    }
});

allDropdowns.push("next")
// add grandchild dropdown options
let childCount = 0;
sideBar.forEach((data, index) => {
    if(data.data.length){
        data.data.forEach((cd, i) => {
            if(cd.data.length){
                cd.data.forEach(d => {
                    grandChildIndex.push(childCount)
                    allDropdowns.push(db.SideBarGrandChild.create({
                        ...d
                    }))
                })
            }
        });
        childCount++;
    }
});

Promise.all(allDropdowns)
    .then(data => {
        
        const sideBarData = {
            parent: [],
            child: [],
            grandChild: []
        }
        let target = "parent" 

        data.forEach(data => {
            if(target === "parent"){
                if(data === "next"){
                    target = "child"
                } else {
                    sideBarData[target].push(data);
                }
            } else if(target === "child"){
                if(data === "next"){
                    target = "grandChild"
                } else {
                    sideBarData[target].push(data);
                }
            } else {
                sideBarData[target].push(data);
            }
        })

        const idUpdates = [];

        childIndex.map((data, index) => {
            const parentId = sideBarData.parent[data]._id;
            const childId = sideBarData.child[index]._id;
            idUpdates.push(
                db.SideBar.findOneAndUpdate({
                    _id: mongojs.ObjectId(parentId)
                }, { $push: { data: childId } }, { new: true })
            )
        })

        grandChildIndex.map((data, index) => {
            const childId = sideBarData.child[data]._id;
            const grandChildId = sideBarData.grandChild[index]._id;
            idUpdates.push(
                db.SideBarChild.findOneAndUpdate({
                    _id: mongojs.ObjectId(childId)
                }, { $push: { data: grandChildId } }, { new: true })
            )
        })

        Promise.all(idUpdates)
            .then(data => console.log(data))
            .catch(err => console.log(err))
        
    })
    .catch(err => console.log(err))
//////////////////////////
*/