import express from "express";
import db from "../db/config.js";
const router = express.Router();
let timestamp = '[' + new Date().toISOString().substring(11,23) + '] - ';
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

router.get("/star", async (req,res, next) => {
    console.log("%s return the list of movies rated with 5 stars", timestamp);
    try {
        let results = await db.collection('users').find({ "movies.rating": 5 }).sort({}).toArray();
        res.send(results).status(200);
    } catch (error) {
        console.error("%s error return the list of movies rated with 5 stars - %s",timestamp, error);
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
});

//issue in getting the movie with and it's confusing between /star and id
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

router.get("/higher/:higher_num", async (req, res, next) => {
    let higher_num = parseInt(req.params.higher_num);
    console.log("%s getting the list of highest number until the limit of %d", timestamp, higher_num);
    try {
        let results = await db.collection('users.movies').find({ "movieid": { $gt: higher_num } }).sort({}).toArray();
        res.send(results).status(200);

    } catch (error) {
        console.error("%s error in getting the list of higher number of movies until the limit of %d", timestamp, higher_num);
        next(error);
    }
});

router.get("/ratings/:order", async (req, res, next) => {
    let higher_num = parseInt(req.params.order);
    console.log("%s return the list of movies ordered by the number of rating %d", timestamp, higher_num);
    try {
        let results = await db.collection('users.movies').find({ $and: [ {$gt: higher_num}, {$lt: higher_num} ]} ).sort({}).toArray();
        res.send(results).status(200);
    } catch (error) {
        console.error("%s error in getting the list of higher number of movies until the limit of %d", timestamp, higher_num);
        next(error);
    }
});

export default router;