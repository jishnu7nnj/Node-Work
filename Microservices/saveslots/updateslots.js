const express= require('express');
const app= express();
const http= require('http');
const cassandra= require('cassandra-driver');
const bodyparser= require('body-parser');
const logger= require('C:/Node/Microservices/config/logger.js');

app.use(bodyparser.json());

const port= process.env.PORT || 2790;

var server= http.createServer(app);
server.listen(port, function(){
    console.log("Listening to port 2790. . .");
})

var cassandraClient= new cassandra.Client({contactPoints: ['localhost'], keyspace: 'deliveryprac'});
cassandraClient.connect(function(err){
    console.log('Connection made to the cassandra database. . . ');
})

logger.info("updateslots microservice started");

app.put('/updateslots/:status', function(req, res){
        requestObj= {};
        if(!req.params){
            requestObj.app_name= "updateslots";
            requestObj.message= "Request from saveslots microservice does not have parameters";
            requestObj.params= req.params;
            logger.error(JSON.stringify(requestObj));
            res.sendStatus(400);
        }
        else{
            requestObj.app_name= "updateslots";
            requestObj.message= "Request has all the required parameters";
            requestObj.body= req.body;
            logger.info(JSON.stringify(requestObj));
            const request_id= req.body.request_id;
            const slot_id= req.body.slot_id;
            const slot_start= req.body.slot_start;
            const slot_end= req.body.slot_end;
            const status= req.params.status;
            updateSlots(request_id, slot_id, slot_start, slot_end, status);
            res.sendStatus(200);
        }
    });

const updateSlots= function(request_id, slot_id, slot_start, slot_end, status){
    const requestUpdateObj= {};
    const responseUpdateObj= {};

    requestUpdateObj.app_name= "updateslots";
    requestUpdateObj.message= "Request recieved from saveslots microservice";
    requestUpdateObj.request_id= request_id;
    requestUpdateObj.slot_id= slot_id;
    requestUpdateObj.slot_start= slot_start;
    requestUpdateObj.slot_end= slot_end;
    requestUpdateObj.status= status;
    logger.info(JSON.stringify(requestUpdateObj));

    var updateQuery= "INSERT INTO slots(slot_id, request_id, slot_end, slot_start, status) VALUES (?,?,?,?,?)";
    var updateParams= [slot_id, request_id, slot_end, slot_start, status];
    logger.debug(updateQuery +" with " +updateParams);
    logger.info(updateQuery);
    cassandraClient.execute(updateQuery, updateParams, {prepare:true}, function(err, result){
        if(err){
            logger.error("Error in updation");
        }else{
            responseUpdateObj.app_name= "updateslots";
            responseUpdateObj.message= "Response sent to saveslots microservice";
            logger.info(JSON.stringify(responseUpdateObj));
            return
        }
    }) 
}