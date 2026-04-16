export const errorHandler = (err, req, res, next) => {

    let statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);

    // Mongoose casting err handles
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        err.message = 'Resource not found';
    }

    // Validation handling
    if (err.name === 'ValidationError') {
        statusCode = 400;
        err.message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || 'An error occurred',
        data: null,
        error: process.env.NODE_ENV === 'production' ? undefined : {
            stack: err.stack,
            path: req.originalUrl,
            timestamp: new Date().toISOString(),
        }
    });
};

export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
