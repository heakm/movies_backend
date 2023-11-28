import express from "express";
import db from "../db/config.js";

import { ObjectId } from "mongodb";
const router = express.Router();
let timestamp = '[' + new Date().toISOString().substring(11,23) + '] - ';
// return first 50 documents from movies collection
router.get("/", async (req, res) => {
    console.log("%s getting first 50 movies in the system",timestamp);
    try{
        let results = await db.collection('movies').find({}).limit(50).toArray();
        res.send(results).status(200);
    }catch(error){
        console.error("%s getting all users in the system - %s",timestamp, error);
        next(error);
    }
});

router.get("/:id", async (req, res,next) => {
    let id = parseInt(req.params.id);
    console.log("%s getting a movie with id %d",timestamp,id);
    try{
        let results = await db.collection('movies').find({ _id : id}).toArray();
        if(JSON.stringify(results) === '{}'){
            res.send().status(404);
        }
        res.send(results).status(200);
    }catch(error){
        console.error("%s getting a movie with id [%s] - %s",timestamp , id, error);
        next(error);
    }
});
router.delete("/:id", async(req,res,next) => {
    let id = parseInt(req.params.id);
    console.log("%s deleting a movie with id %d",timestamp,id);
    try{
        let results = await db.collection('movies').deleteOne({"_id":id});
        res.send().status(204);
    }catch(error){
        console.error("%s error in deleting a movie with id [%s] - %s",timestamp,id, error);
        next(error);
    }
});
router.post("/",async(req,res,next) => {
    let params = req.body;
    console.log("%s saving movie with id %s",timestamp,params._id);
    try {
        const options = { ordered: true };
        await db.collection('users').insertOne(params,options);
        res.send().status(201);        
    } catch (error) {
        console.error("%s error in saving movie with id [%s] - %s",timestamp,params._id ,error);
        next(error);
    }

})
router.put("/:id", async(req,res,next) => {
    let id = parseInt(req.params.id);
    console.log("%s saving movie with id %d",timestamp,id);
    try{
        let results = await db.collection('users').updateOne({"_id":id});
        res.send(results).status(200);
    }catch(error){
        console.error("%s error in saving movie with id [%d] - %s",timestamp,id ,error);
        next(error);
    }
});
export default router;