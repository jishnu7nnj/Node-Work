const express= require('express');
const app= express();
const http= require('http');
const Request= require('request');
const bodyparser= require('body-parser');
var currentDate= new Date();
const logger= require('C:/Node/Microservices/config/logger.js')

app.use(bodyparser.json());

const port= process.env.PORT || 2908;

var server= http.createServer(app);
server.listen(port, function(){
    console.log("Main service started. . . ");
})
logger.info(`Started getslotdata micro-service`);

app.post('/slotdata', function(req, res){
    const requestBodyObject= {};  
    // if request body is empty
    if (!req || Object.keys(req.body).length === 0){
        requestBodyObject.app_name = "getslotdata";
        requestBodyObject.message= "Request body is empty";
        requestBodyObject.body= req.body;
        logger.error(JSON.stringify(requestBodyObject));
        res.sendStatus(400);
    }
    if(!req.body.start || !req.body.end || !req.body.store_id || !req.body.truck_type){
        requestBodyObject.app_name= "getslotdata";
        requestBodyObject.message= "Body does not have the required parameters";
        requestBodyObject.body= req.body;
        logger.error(JSON.stringify(requestBodyObject));
        res.status(400).send("Check the dates and enter again");
    }
    if(req.body.start < currentDate){
        req.body.start = currentDate;
    }
    if(req.body.end < req.body.start){
        requestBodyObject.app_name= "getslotdata";
        requestBodyObject.message= "The end date is before the start date";
        requestBodyObject.body= req.body;
        logger.info(JSON.stringify(requestBodyObject));
        res.sendStatus(400);
    }
    else{
        requestBodyObject.app_name= "getslotdata";
        requestBodyObject.message= "Request object has all the required properties";
        requestBodyObject.body= req.body;
        logger.error(JSON.stringify(requestBodyObject));

        const requestBody= req.body;
        const storeID= req.body.store_id;
        const truckType= req.body.truck_type;
        checkupduration(requestBody, storeID, truckType, res, function(slotResponse){
            res.send(JSON.parse(slotResponse));
        });
    }
});

const checkupduration= function(requestBody, storeID, truckType, response, callback){
    
    const requestBodyCD= {};
    const responseBodyCD= {};

    requestBodyCD.app_name= "getslotdata";
    requestBodyCD.message= "Sending request to checkupduration microservice";
    requestBodyCD.body= requestBody;
    logger.info(JSON.stringify(requestBodyCD));


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
        responseBodyCD.app_name= "getslotdata";
        responseBodyCD.message= "Response recieved from checkupduration microservice";
        responseBodyCD.body= JSON.parse(responseBody);
        logger.info(JSON.stringify(responseBodyCD));
        
        console.log("Checkupcapacity successfuly executed");
        callback(responseBody);

    }
}
)
}