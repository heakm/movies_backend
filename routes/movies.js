import express from "express";
import db from "../db/config.js";
const router = express.Router();
let timestamp = '[' + new Date().toISOString().substring(11, 23) + '] - ';


router.get("/count",async (req,res,next)=>{
   console.log("%s getting the number of movies in the system",timestamp);
   try{
        let results = await db.collection("movies").find({}).count();
        res.send({count:results}).status(200);
   }catch(error){
       console.error("%s getting the number of movies in the system - %s",timestamp,error);
       next(error);
   }
});

router.get("/", async (req, res) => {
    console.log("%s getting first 50 movies in the system", timestamp);
    try {
        let results = await db.collection('movies').find({}).limit(50).toArray();
        res.send(results).status(200);
    } catch (error) {
        console.error("%s getting all users in the system - %s", timestamp, error);
        next(error);
    }
});

router.get("/star", async (req, res, next) => {
    console.log("%s return the list of movies rated with 5 stars", timestamp);
    try {
        let results = await db.collection('users').aggregate([{$unwind : "$movies"},{$lookup: {
                    from: "movies",localField: "movies.movieid",foreignField:"_id",as: "moviesInformation"}},{$match: {"movies.rating":5}},
            {$group:
                    {_id:"$moviesInformation._id",title:{$first:"$moviesInformation.title"},rating:{$first:"$movies.rating"},
                        genres:{$first: "$moviesInformation.genres"}}
            },{$sort:{_id:1}
            }]).toArray();
        let newResults = [];
        results.forEach(result => {
            newResults.push({"_id": result._id[0],"title": result.title[0],"rating": result.rating,"genres": result.genres[0]});
        });
        res.send(newResults).status(200);
    } catch (error) {
    console.error("%s error return the list of movies rated with 5 stars - %s", timestamp, error);
    next(error);
}
});

router.get("/:id", async (req, res, next) => {
    let id = parseInt(req.params.id);
    console.log("%s retrieving user from the system with id %d", timestamp, id);
    try {
        let results = await db.collection('movies').find({ _id: id }).toArray();
        if (results.length > 0) {res.send(results).status(200);} else {res.status(404).send("movie not found");}
    } catch (error) {
        console.error("%s retrieving movie from the system with id [%s] - %s", timestamp, id, error);
        next(error);
    }
});

router.delete("/:id", async (req, res, next) => {
    let id = parseInt(req.params.id);
    console.log("%s deleting a movie with id %d", timestamp, id);
    try {
        let results = await db.collection('movies').deleteOne({ "_id": id });
        if (!results || Object.keys(results).length === 0) {
            return res.status(400).send({ error: 'Bad Request', message: 'The request body is empty' });
        }
        if (results.deletedCount === 0) {
            return res.status(404).send({ error: 'Not Found', message: 'The requested resource was not found' });
        }
        res.send().status(204);
    } catch (error) {
        console.error("%s error in deleting a movie with id [%s] - %s", timestamp, id, error);
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    let params = req.body;
    console.log("%s saving movie to the system with id %s", timestamp, params._id);

    if (!Object.keys(params).length) {
        return res.status(400).send({ error: 'Bad Request', message: 'The request body is empty' });
    }

    try {
        const existingMovie = await db.collection('movies').findOne({ _id: params._id });
        if (existingMovie) {
            return res.status(409).send({ error: 'Conflict', message: 'A movie with the same _id already exists' });
        }

        const options = { ordered: true };
        await db.collection('movies').insertMany([params], options);
        res.sendStatus(201);
    } catch (error) {
        console.error("%s error in saving movies to the system with id [%s] - %s", timestamp, params._id, error);
        next(error);
    }
});

router.put("/", async (req, res, next) => {
    let params = req.body;
    console.log("%s saving movie to the system with id %s", timestamp, params._id);

    if (!Object.keys(params).length) {
        return res.status(400).send({ error: 'Bad Request', message: 'The request body is empty' });
    }
    try {
        const existingMovie = await db.collection('movies').findOne({ _id: params._id });
        if (existingMovie) {
            let results = await db.collection('users').updateOne({ "_id": id }, { $set: update });
            res.send(results).status(200);
        }
        const options = { ordered: true };
        await db.collection('movies').insertMany([params], options);
        res.sendStatus(201);
    } catch (error) {
        console.error("%s error in saving movies to the system with id [%s] - %s", timestamp, params._id, error);
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
        let results = await db.collection('users.movies').find({ $and: [{ $gt: higher_num }, { $lt: higher_num }] }).sort({}).toArray();
        res.send(results).status(200);
    } catch (error) {
        console.error("%s error in getting the list of higher number of movies until the limit of %d", timestamp, higher_num);
        next(error);
    }
});

export default router;