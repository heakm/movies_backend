import express from "express";
import db from "../db/config.js";
const router = express.Router();
let timestamp = '[' + new Date().toISOString().substring(11,23) + '] - ';
router.get("/count", async (req, res) => {
    console.log("%s getting first 50 users in the system",timestamp);
    try{
        let results = await db.collection('users').find({}).count();
        res.send([{count: results}]).status(200);
    }catch(error){
        console.error("%s getting all users in the system - %s",timestamp, error);
        next(error);
    }
});

router.get("/star", async (req, res, next) => {
    console.log("%s return the list of movies rated with 5 stars", timestamp);
    try {
        // let results = await db.collection('movies').aggregate([{$match : {"genres": "Comedy|Drama|Romance"}},{$project :{_id:0}}]).toArray();
        let results = await db.collection('users').aggregate([
            {
                $lookup: {
                    from: "movies",
                    localField: "movies.movieid",
                    foreignField:"_id",
                    as: "highest_rated_movies"
                }
            },
            {
                $unwind : "$movie"
            },
            {$group: 
                {
                    _id: 0
                }
            },
            {
                $limit: 2
            }
            // {$match: { "highest_rated_movies.movies.rating": 5 }},
        ]).limit(4).toArray();
        res.send(results).status(200);
    } catch (error) {
    console.error("%s error return the list of movies rated with 5 stars - %s", timestamp, error);
    next(error);
}
});


router.get("/", async (req, res) => {
    console.log("%s getting first 50 users in the system",timestamp);
    try{
        let results = await db.collection('users').find({}).limit(50).toArray();
        res.send(results).status(200);
    }catch(error){
        console.error("%s getting all users in the system - %s",timestamp, error);
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    let id = parseInt(req.params.id);
    console.log("%s retrieving user from the system with id %d", timestamp, id);
    try {
        let results = await db.collection('users').find({ _id: id }).toArray();
        if (results.length > 0) {
            res.send(results).status(200);
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("%s retrieving user from the system with id [%s] - %s", timestamp, id, error);
        next(error);
    }
});

router.delete("/:id", async(req,res,next) => {
    let id = parseInt(req.params.id);
    console.log("%s deleting user from the system with id %d",timestamp,id);
    try{
        let results = await db.collection('users').deleteOne({"_id":id});
        if (!results || Object.keys(results).length === 0) {
            return res.status(400).send({ error: 'Bad Request', message: 'The request body is empty' });
        }
        if(results.deletedCount === 0){
            return res.status(404).send({ error: 'Not Found', message: 'The requested resource was not found' });
        }
        res.send().status(204);
    }catch(error){
        console.error("%s error in saving users to the system with id [%s] - %s",timestamp,id, error);
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    let params = req.body;
    console.log("%s saving users to the system with id %s", timestamp, params._id);
    // Check if the body is empty
    if (!Object.keys(params).length) {
        return res.status(400).send({ error: 'Bad Request', message: 'The request body is empty' });
    }
    try {
        const options = { ordered: true };
        await db.collection('users').insertMany([params], options);
        res.sendStatus(201);
    } catch (error) {
        console.error("%s error in saving users to the system with id [%s] - %s", timestamp, params._id, error);
        next(error);
    }
});

router.put("/:id", async(req,res,next) => {
    if (!Object.keys(params).length) {
        return res.status(400).send({ error: 'Bad Request', message: 'The request body is empty' });
    }
    let id = parseInt(req.params.id);
    console.log("%s updating users to the system with id %d",timestamp,id);
    try{
        let update = req.body;
        if(!update || Object.keys(update).length === 0){
            throw new Error("Invalid data received for updating user.");
        }
        let results = await db.collection('users').updateOne({"_id":id}, {$set: update});
        res.send(results).status(200);
    }catch(error){
        console.error("%s error in saving movies to the system with id [%d] - %s",timestamp,id ,error);
        next(error);
    }
});

router.get("/top/age/:ageRange", async (req, res, next) => {
    let ageRange = req.params.ageRange;
    let [min_ageStr,max_ageStr] = ageRange.split("-");
    let [min_age,max_age] = [parseInt(min_ageStr), parseInt(max_ageStr)];

    if (isNaN(min_age) || isNaN(max_age) || min_age > max_age) {
        return res.status(400).send("Invalid age range. Please use a valid format, such as '30-40'.");
    }

    console.log("%s Return total number of ratings of users between %d and %d", timestamp,min_age,max_age);
    try {
        let results = await db.collection('users').countDocuments({ $and: [ {"age": {$gt: min_age}}, {"age": {$lt: max_age}} ]} );
        res.send({total: results}).status(200);
    } catch (error) {
        console.error("%s error in getting the list of higher number of movies until the limit of %d", timestamp,min_age,max_age);
        next(error);
    }
});

export default router;