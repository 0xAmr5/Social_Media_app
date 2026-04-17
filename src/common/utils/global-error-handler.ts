
import { Request,Response,NextFunction } from "express";

 export class appError extends Error {
    constructor(public message:string,public statusCode:number) {
        super(message);
        this.message=message;
        this.statusCode=statusCode;
    }
}




export const globalErrorHandler = (err:appError,req:Request,res:Response,next:NextFunction)=>{
console.log(err.cause)
const statusCode = err.statusCode as number || 500;
res.status(statusCode).json({
     message: err.message ,
    statusCode: statusCode,
    stack:err.stack
 })

}