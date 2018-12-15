# Project

Game Connect takes gamers' preferences on games and recommends new games to individual users based on their similarities. As
the amount of users becomes greater, the recommendations become more and more accurate and the users will have a higher
probabilities of actually liking the game.

Our Mission:
To create a world where gamers can boldly go where gamers like them have gone before. 


# Repository Structure

Separated into three separate categories: [Milestones](https://github.com/CSCI-3308-T5/milestones), [Meetings](https://github.com/CSCI-3308-T5/meetings), and [Project](https://github.com/CSCI-3308-T5/project). 

Milestones: contains all milestones throughout the semester

Meetings: gives a brief summmary of every meeting along with the start and end times

Project: contains all the files created for our project whether they were used in the final outcome or not.

* The root directory contains the recommender script, test cases, and files that Heroku requires (dependencies and procfile), among other things
* The routes folder contains the nodejs backend
* The public folder contains everything that will be sent to a user
  * The views folder contains all of the pug/jade files used to create the frontend pages
  * The static folder contains all of the stuff that is sent to the user as is
    * The css folder contains all css files
    * The js folder contains all of the front-end javascript
    * The images folder contains all images served to the user, like the favicon


# Building Docs
We have no documentation, but most of the code has comments.


# Building Code

Code is automatically built in Heroku whenever a Github push is done. To build locally, just run `npm install` from the project root directory.


# Running Code

The website can be run locally (on http://localhost:3000/) after building it and running `node routes/index.js` (this will crash almost immediately unless you are signed in to a Heroku account with access to the project). Alternatively, after pushing to GitHub, Heroku will build it automatically, and you can use it at https://gameconnect.herokuapp.com.

# Testing

We used TravisCI to automate our testing. We wrote tests for our python scripts using Unittest, and we used TravisCI to make sure that they passed whenever we made a commit. The test cases can also be run manually with the command `python3 test_rec.py`, provided the correct dependencies are installed.
 
TravisCI confirmation:
https://travis-ci.com/CSCI-3308-T5/project
