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

router.get("/", async (req, res,next) => {
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
router.get("/release/between/:years",async (req,res,next)=>{
    let [firstYear,lastYear] = req.params.years;
    console.log("%s getting movies between %s and %s",timestamp,firstYear,lastYear)
    try{
        await db.collection('movies').find({}).toArray();
    }catch (error){
        next(error)
    }
})
router.get("/genres/year",async (req,res,next)=>{
    console.log("%s getting all movies by splitting genres and adding year")
    try{
        let results = await db.collection('movies').aggregate([{$addFields: {
                resultObj: {$regexFind: {regex: /\((\d{4})\)|-(\d{4})/, input: "$title"}}
            }
        }, {$addFields: {year: {$cond: [{ $ne: [ "$resultObj.group", undefined ] }, { $arrayElemAt: [ "$resultObj.captures", 0 ] },
                        { $arrayElemAt: [ "$resultObj.captures", 1 ] }]}}
        },
            {$addFields: {genres: {$split: ["$genres", "|"]}}},
            {$project: {_id: 1, title: 1, year: 1, genres: 1}}
        ]).toArray();
        if(results.length > 0){
            res.status(200).send(results)
        }
        res.status(404).send("no results found");
    }catch (error){
        console.log("%s error in getting all movies by splitting genres and adding year",timestamp)
        next(error)
    }
})
router.get("/genres/count/:genres", async (req, res, next) => {
    let genres = req.params.genres.split('-'); // convert string to array
    console.log("%s returning user by his genres %s", timestamp, genres);
    const regexQuery = { genres: { $regex: '(' + genres.join('|') + ')', $options: 'i' } };
    try {
        let results = await db.collection('movies').countDocuments(regexQuery);
        if (results > 0) {
            return res.status(200).send({count: results})
        }
        console.log("%s no result found when returning users by genres %s and found %d", timestamp, genres, results.length)
        return res.status(404).send("No result found")
    } catch (error) {
        console.log("%s error while returning users by genres %s", timestamp, genres)
        next(error);
    }
})
router.get("/genres/:genres",async(req,res,next)=>{
    let genres = req.params.genres.split("-");
    console.log("%s returning user by his genres %s",timestamp,genres);
    const regexQuery = { genres: { $regex: '(' + genres.join('|') + ')', $options: 'i' } };
    try{
        let results = await db.collection('movies').find(regexQuery).toArray();
        if(results.length > 0){
            return res.status(200).send({count:results})
        }
        console.log("%s no result found when returning users by genres %s and found %d",timestamp,genres,results.length)
        return res.status(404).send("No result found")
    }catch (error){
        console.log("%s error while returning users by genres %s",timestamp,genres)
        next(error);
    }
})

router.delete("/:id", async (req, res, next) => {
    let id = parseInt(req.params.id);
    console.log("%s deleting a movie with id %d", timestamp, id);
    try {
        let results = await db.collection('movies').deleteOne({ "_id": id });
        if (!(!results || Object.keys(results).length === 0)) {
            if (results.deletedCount === 0) {
                return res.status(404).send({error: 'Not Found', message: 'The requested resource was not found'});
            }
            res.send().status(204);
        } else {
            return res.status(400).send({error: 'Bad Request', message: 'The request body is empty'});
        }
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