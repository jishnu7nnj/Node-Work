const express= require('express');
const app= express();
const http= require('http');
const cassandra= require('cassandra-driver');
const bodyparser= require('body-parser');
const logger= require('C:/Node/Microservices/config/logger.js');

app.use(bodyparser.json());

const port= process.env.PORT || 2770;

const server= http.createServer(app);
server.listen(port, function(){
    console.log("The deleteslots microservice started. . . ");
})

var cassandraClient= new cassandra.Client({contactPoints: ['localhost'], keyspace: 'deliveryprac'});
cassandraClient.connect(function(err){
    console.log('Connection made to the cassandra database. . . ');
})

logger.info("deleteslots microservice has started");

app.delete('/deleteslots/:requestID/:slotID', function(req, res){
    const logObj= {};
    if(!req.params){
        logObj.app_name= "deleteslots";
        logObj.message= "Request from saveslots microservice does not have parameters";
        logger.error(JSON.stringify(logObj));
        res.sendStatus(404);
    }else{
        logObj.app_name= "deleteslots";
        logObj.message= "Request has all the parameters";
        logger.info(JSON.stringify(logObj));
        const slot_id= req.params.slotID;
        const request_id= req.params.requestID;
        deleteSlots(request_id, slot_id)
            res.sendStatus(200);
    }
})


const deleteSlots= function(request_id, slot_id){
    const requestDeleteObj= {};
    const responseDeleteObj= {};

    requestDeleteObj.app_name= "deleteslots";
    requestDeleteObj.message= "Request to delete slots recieved from saveslots microservice";
    requestDeleteObj.request_id= request_id;
    requestDeleteObj.slot_id= slot_id;
    logger.info(JSON.stringify(requestDeleteObj));

    console.log(request_id, slot_id);
    const selectQuery= "SELECT * FROM slots WHERE request_id= ?";
    const selectParams= [request_id];
    cassandraClient.execute(selectQuery, selectParams, {prepare: true}, function(err, result){
        if(err){
            logger.error("Error retrieving data from the slots table");
        }else{
            for(let i=0; i<result.rows.length; i++){
                    const status =result.rows[i].status;
                    const slot_id= result.rows[i].slot_id;
                    if(status === "open"){
                    const deleteQuery= "DELETE FROM slots WHERE request_id=? AND slot_id= ?";
                    const deleteParams= [request_id, slot_id];
                    logger.debug(deleteQuery);
                    logger.debug(deleteQuery +" with "+deleteParams);
                        cassandraClient.execute(deleteQuery, deleteParams, {prepare: true}, function(err, result){
                            if(err){
                                logger.error("Error deleting data from slots");
                            }
                            else{
                                responseDeleteObj.app_name= "deleteslots";
                                responseDeleteObj.message= "Response sent to saveslots microservice";
                                logger.info(JSON.stringify(responseDeleteObj));
                                return
                            }
                        })
                    }
                }
            } 
        });
    }