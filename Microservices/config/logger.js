var winston= require('winston');
var { transports, createLogger, format } = winston;

var logger = createLogger({
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json(),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: 'C:/Node/Microservices/config/logs/output-logs.log',
            handleExceptions: true,
            json: true,
            colorize: false
        }),
        new winston.transports.File({
            level: 'error',
            filename: 'C:/Node/Microservices/config/logs/error-logs.log',
            handleExceptions: true,
            json: true,
            colorize: false
        }),
        new winston.transports.File({
            level: 'debug',
            filename: 'C:/Node/Microservices/config/logs/debug-logs.log',
            handleExceptions: true,
            json: true,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ]
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};