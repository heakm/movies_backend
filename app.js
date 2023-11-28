
import movies from "./routes/movies.js";
import users from "./routes/users.js";
import express from 'express'
const app = express()
const port = 3000
app.use(express.json());
// Load the /movies routes
app.use("/movies", movies);
// Load the /users routes
app.use("/users", users);
app.listen(port, () => { console.log(`backend listening on port ${port}`) })