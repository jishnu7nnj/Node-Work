const express= require('express');
const app= express();
const http= require('http');
const Request= require('request');
const bodyparser= require('body-parser');
var currentDate= new Date();

app.use(bodyparser.json());

const port= process.env.PORT || 2908;

var server= http.createServer(app);
server.listen(port, function(){
    console.log("Main service started. . . ");
})

app.post('/slotdata', function(req, res){    
    // if request body is empty
    if (!req || Object.keys(req.body).length === 0){
        console.log("Body is empty");
        res.sendStatus(400);
    }
    if(!req.body.start || !req.body.end || !req.body.store_id || !req.body.truck_type){
        console.log("Body does not have the required parameters");
        res.status(400).send("Check the dates and enter again");
    }
    if(req.body.start < currentDate){
        req.body.start = currentDate;
    }
    if(req.body.end < req.body.start){
        console.log("Error: end date is before the start date")
        res.sendStatus(400);
    }
    else{
        const requestBody= req.body;
        const storeID= req.body.store_id;
        const truckType= req.body.truck_type;
        checkupduration(requestBody, storeID, truckType, res, function(slotResponse){
        console.log("CHECKUPDURATION");
            res.send(slotResponse);
        });
    }
});

const checkupduration= function(requestBody, storeID, truckType, response, callback){
    Request.post({
        "headers": {
            "content-type": "application/json"
        },
        "url": 'http://localhost:2909/checkupduration/' + storeID+'/'+truckType,
        "body": JSON.stringify(requestBody)
    }, (error, res)=>{
    if(error){
        console.log("ERROR CONNECTING");
        return response.sendStatus(500);
    }if(!res || res.statusCode === 500){
        response.sendStatus(500);
    }else{
        const responseBody= res.body;
        console.log("Checkupcapacity successfuly executed");
        callback(responseBody);
    }
}
)
}

const insertIntoSlots = function(request_id, slot_id, slot_start, slot_end, status){

    const responseQuery= 'INSERT INTO slots (request_id, slot_id, slot_start, slot_end, status) VALUES (?,?,?,?,?)';
    const responseParams= [request_id, slot_id, slot_start, slot_end, status];
    cassandraClient.execute(responseQuery, responseParams,{prepare: true}, function(err, result){
        if(err){
            console.log("Error inserting data into slots-table");
        }
        else{
            console.log("Data inserted successfully into slots-table");
        }
    })
}