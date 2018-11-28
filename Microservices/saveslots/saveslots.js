const express= require('express');
const app= express();
const http= require('http');
const Request= require('request');
const bodyparser= require('body-parser');
const cassandra= require('cassandra-driver');
const logger= require('C:/Node/Microservices/config/logger.js');

app.use(bodyparser.json());

const port= process.env.PORT || 2780;

var server= http.createServer(app);
server.listen(port, function(){
    console.log("The saveslots main service started. . . ");
})

var cassandraClient= new cassandra.Client({contactPoints: ['localhost'], keyspace: 'deliveryprac'});
cassandraClient.connect(function(err){
    console.log('Connection made to the cassandra database. . . ');
})

logger.info("saveslots microservice is started");

var selectQuery= "SELECT * from slots WHERE slot_id= ?";

app.put('/saveslots/:slot_id', function(req, res){
    const requestObj= {};
    if(Object.keys(req.body).length === 0){
        requestObj.app_name= "saveslots";
        requestObj.message= "Request body is empty";
        requestObj.body= req.body;
        logger.error(JSON.stringify(requestObj));
        return res.sendStatus(500);
    }
    if(!req.body.status){
        requestObj.app_name= "saveslots";
        requestObj.message= "The request body does not have the required parameters";
        requestObj.body= req.body;
        logger.error(JSON.stringify(requestObj));
        res.sendStatus(500);
    }
    else{
        var params= [req.params.slot_id];
        cassandraClient.execute(selectQuery, params, {prepare: true}, function(err, result){
            logger.debug(selectQuery +" with " +params);
            logger.info(selectQuery);
            if(err){
                logger.error("Error in selectQuery from saveslots.js");
                res.sendStatus(400);
            }
            else{
                const logObj= {};
                logObj.app_name= "saveslots";
                logObj.message= "Succesfully executed the select query";
                logObj.body= result.rows[0];
                logger.info(JSON.stringify(logObj));

                const request_id= result.rows[0].request_id;
                const status= req.body.status;
                const slot_id= result.rows[0].slot_id;
                const slot_start= result.rows[0].slot_start;
                const slot_end= result.rows[0].slot_end;
                const resultBody= result.rows[0];
                updateslots(resultBody, slot_id, status, function(statusCode){
                    console.log(statusCode);
                    if(statusCode=== "OK"){
                    deleteSlots(request_id, slot_id, function(statusCode){
                        res.sendStatus(statusCode);
                    });
                }    
                })
            }
        });
    }
})

const updateslots= function(resultBody, slot_id, status, callback){
    const requestUpdateObj= {};
    const responseUpdateObj= {};

    requestUpdateObj.app_name= "saveslots";
    requestUpdateObj.message= "Request sent to updateslots microservice";
    requestUpdateObj.body= resultBody;
    logger.info(JSON.stringify(requestUpdateObj));

    Request.put({
        "headers": {
            "content-type": "application/json"
        },
        "url": "http://localhost:2790/updateslots/"+status,
        "body": JSON.stringify(resultBody)
    }, (error, response) => {
        if(error){
            logger.error("Error in calling the updateslots microservice");
        }
        else{
            const request_id= resultBody.request_id;
            responseUpdateObj.app_name= "saveslots";
            responseUpdateObj.message= "Response recieved from update slots microservice";
            responseUpdateObj.status= response.body;
            logger.info(JSON.stringify(responseUpdateObj));
            callback(response.body);
        }
   });
}

const deleteSlots= function(requestID, slot_id, callback){
    const requestDeleteObj= {};
    const responseDeleteObj= {};

    requestDeleteObj.app_name= "saveslots";
    requestDeleteObj.message= "Request sent to deleteslots microservice";
    requestDeleteObj.request_id= requestID;
    requestDeleteObj.slot_id= slot_id;
    logger.info(JSON.stringify(requestDeleteObj));

    Request.delete({
        "headers": {
            "content-type": "application/json"
        },
        "url": "http://localhost:2770/deleteslots/"+requestID+"/"+slot_id
    }, (error, response)=> {
        if(error){
            logger.error("Error calling the deleteslots microservice");
        }else{
            responseDeleteObj.app_name= "saveslots";
            responseDeleteObj.message= "Response recieved from deleteslots microservice";
            responseDeleteObj.status= response.body
            logger.info(JSON.stringify(responseDeleteObj));
            callback(response.body);
        }
    }
)
}
