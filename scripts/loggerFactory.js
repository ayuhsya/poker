const winston = require('winston');

module.exports = {
    getLogger: function (module) {
        var loggerLevel = process.env.LOGGER_LEVEL;
        return winston.createLogger({
            level: loggerLevel,
            format: winston.format.json(),
            colorize: true,
            transports: [
                //
                // - Write all logs with level `error` and below to `error.log`
                // - Write all logs with level `info` and below to `combined.log`
                //
                // new winston.transports.File({ filename: 'error.log', level: 'error' }),
                // new winston.transports.File({ filename: 'combined.log' }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.splat(),
                        winston.format.simple()
                    )
                })
                // new winston.transports.File({
                //     filename: 'poker.log',
                //     level: loggerLevel,
                //     format: winston.format.combine(
                //         winston.format.colorize(),
                //         winston.format.splat(),
                //         winston.format.simple()
                //     )
                // })
            ],
        });
    }
}