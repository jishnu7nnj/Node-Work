const express= require('express');
const app= express();
const http= require('http');
const bodyparser= require('body-parser');
const cassandra= require('cassandra-driver');
const uuid = require('uuid-random');
const moment= require('moment');
var currentDate= new Date();
const logger= require('C:/Node/Microservices/config/logger.js');


app.use(bodyparser.json());

const port= process.env.PORT || 2909;

var server= http.createServer(app);
server.listen(port, function(){
    console.log("Listenning to port 2909. . .");
});

var cassandraClient= new cassandra.Client({contactPoints: ['localhost'], keyspace: 'deliveryprac'});
cassandraClient.connect(function(err){
    console.log('Connection made to the cassandra database. . . ');
});
console.log(currentDate);
logger.info(`checkupduration microservice has started`);

var query= 'SELECT * FROM store_data where store_id= ? AND truck_type=?';

app.post('/checkupduration/:storeID/:truckType', function(req, res){
    const Object= [];
    const request_id= uuid();
    const requestBodyObject= {};

    var store_id= req.params.storeID;
    var truck_type= req.params.truckType;
    var params= [store_id, truck_type];
    if (Object.keys(req.body).length === 0) {
        requestBodyObject.app_name= "checkduration";
        requestBodyObject.message= "Request body recieved is empty";
        requestBodyObject.body= req.body;
        logger.error(JSON.stringify(requestBodyObject));

        return res.sendStatus(400);
    }else{
    cassandraClient.execute(query, params, {prepare:true}, function(err, result){
        if(err){
            const logObj= {}
            logObj.app_name= "checkupduration";
            logObj.message="Error fetching data from the table";
            logger.error(JSON.stringify(logObj));
        }
        else{
            const requestObj= {};
            requestObj.app_name= "checkduration";
            requestObj.message= "Request recieved from getslotdata microservice";
            requestObj.body= req.body;
            logger.info(JSON.stringify(requestObj));

             for(let i=0; i<result.rows.length; i++){
                const slot_id= uuid();
                const respObject= {};
                if(result.rows[i].availability_in_minutes<320){
                    continue;
                }
                else{
                    const reqStartDate = moment.utc(req.body.start);
                    const reqEndDate = moment.utc(req.body.end);
                    const resultAvl_date= moment.utc(result.rows[i].availability_date);
                    const avl_start_Midnight = resultAvl_date.startOf('day').format();
                    const avl_end_midnight = resultAvl_date.endOf('day').format();
                    if((reqStartDate <= resultAvl_date) && (reqEndDate >= resultAvl_date)){
                        respObject.slot_id= slot_id,
                        respObject.slot_start= avl_start_Midnight,
                        respObject.slot_end= avl_end_midnight,
                        respObject.status= 'open'
                        Object.push(respObject);
                        insertIntoSlots(request_id, slot_id, avl_start_Midnight, avl_end_midnight, respObject.status);              
                        console.log(req.body.start);
                        console.log(req.body.end);
                    }
            }
            }
            if(Object.length === 0){
                res.send("There are no slots available on the requested dates");
            }else{
                const responseObj= {};
                responseObj.app_name= "checkupduration";
                responseObj.message= "Response sent to getslotdata microservice"
                responseObj.body= Object;
                logger.info(JSON.stringify(responseObj));

                res.send(Object);
        }
    }
    });
}
})

const insertIntoSlots = function(request_id, slot_id, slot_start, slot_end, status){

    const responseQuery= 'INSERT INTO slots (request_id, slot_id, slot_start, slot_end, status) VALUES (?,?,?,?,?)';
    const responseParams= [request_id, slot_id, slot_start, slot_end, status];

    logger.info("INSERT INTO slots (request_id, slot_id, slot_start, slot_end, status) VALUES (?,?,?,?,?)");
    logger.debug(`INSERT query into slots with ${request_id}, ${slot_id}, ${slot_start}, ${slot_end}, ${status}`);

    cassandraClient.execute(responseQuery, responseParams,{prepare: true}, function(err, result){
        if(err){
            logger.error("Error inserting data into slots-table");
        }
        else{
            logger.info("Data inserted successfully into slots-table");
        }
    })
}