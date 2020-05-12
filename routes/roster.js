const express = require("express");
const router = express.Router();
const Roster = require("../models/roster");
const User = require("../models/user");
const fs = require("fs");
const bcrypt = require('bcrypt');

//get a specific users rosters
router.get("/user/:game/:id", async (req, res) => {
  try {
    const allRosters = await Roster.find({ userId: req.params.id, game: req.params.game });
    let rosters = [];
    for (const ros of allRosters) {
        const user = await User.findById(ros.userId);
        rosters.push({
          name: ros.name,
          userName: user.user,
          type: ros.type,
          downloads: ros.downloads,
          updates: ros.updates,
          sliderType: ros.sliderType,
          _id: ros._id,
        });
    }
    res.status(200).json({ rosters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//search teams
router.get("/teams/:game/:search", async (req, res) => {
  let search = req.params.search.replace(" ", "").toLowerCase();
  try {
    let creators = [];
    let allTeams = [];
    const allRosters = await Roster.find({game : req.params.game});
    for (roster of allRosters) {
      if(roster.type === 'roster' && roster.data.teams){
      let user = await User.findById(roster.userId);
      rosterCreator = "";
      if (user) {
        rosterCreator = user.user;
      }
      rosterName = roster.name;

        roster.data.teams.forEach((tm) => {
          allTeams.push(tm);
          creators.push({ rosterCreator, rosterName });
        });
    }
    }
    let filteredTeams = allTeams.filter((team) =>
      team.name.toLowerCase().includes(search)
    );
    let removeDupes = filteredTeams.map((tm) => (tm = JSON.stringify(tm)));
    removeDupes = [...new Set(removeDupes)];
    let jsonAllTeams = allTeams.map((tm) => JSON.stringify(tm));

    let teams = [];
    for (tm of removeDupes) {
      let i = jsonAllTeams.indexOf(tm);
      tm = JSON.parse(tm);
      tm.rosterCreator = creators[i].rosterCreator;
      tm.rosterName = creators[i].rosterName;
      teams.push(tm);
    }

    res.status(200).json({ teams });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//search players
router.get("/players/:game/:search", async (req, res) => {
  let search = req.params.search.replace(" ", "").toLowerCase();
  try {
    let creators = [];
    let allPlayers = [];
    const allRosters = await Roster.find({game : req.params.game});
    for (roster of allRosters) {
      if(roster.type === 'roster' && roster.data.teams){
        let user = await User.findById(roster.userId);
        rosterCreator = "";
        if (user) {
          rosterCreator = user.user;
        }
        rosterName = roster.name;
          for (team of roster.data.teams) {
            team.roster.forEach((ply) => {
              allPlayers.push(ply);
              creators.push({ rosterCreator, rosterName });
            });
          }
      }
    }
    let filteredPlayers = allPlayers.filter((ply) =>
      ply.name.replace(" ", "").toLowerCase().includes(search)
    );
    let removeDupes = filteredPlayers.map((ply) => (ply = JSON.stringify(ply)));
    removeDupes = [...new Set(removeDupes)];

    let jsonAllPlayers = allPlayers.map((ply) => JSON.stringify(ply));

    let players = [];
    for (ply of removeDupes) {
      let i = jsonAllPlayers.indexOf(ply);
      ply = JSON.parse(ply);
      ply.rosterCreator = creators[i].rosterCreator;
      ply.rosterName = creators[i].rosterName;
      players.push(ply);
    }

    if (players.length > 250) {
      players = players.slice(0, 250);
    }

    res.status(200).json({ players });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//get a specific roster (download)
router.get("/download/:id", async (req, res) => {
  try {
    const ros = await Roster.findById(req.params.id);
    const downloads = ros.downloads + 1;
    ros.downloads = downloads;
    await ros.save();
    if (ros.type == "draftclass") {
      res.status(200).json(ros.data);
    } else {
      res
        .status(200)
        .json({ teams: ros.data.teams, freeAgents: ros.data.freeAgents });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//requrie password auth
//delete a specific roster
router.post("/delete/:id", checkPasswordWithExistingRoster,  async (req, res) => {
  const ros = await Roster.findById(req.params.id);
  try {
    await ros.remove();
    res.status(200).json({ message: "Successfully deleted roster" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//get all rosters in a list
router.get("/all/:game", async (req, res) => {
  try {
    const allRosters = await Roster.find({game: req.params.game});
    let rosters = [];
    let search = req.query.name ? req.query.name.replace(" ", "").toLowerCase() : '';
    for (const ros of allRosters) {
      if (ros.name.replace(" ", "").toLowerCase().includes(search)) {
        let user;
        try {
          user = await User.findById(ros.userId);
        } catch (err) {
          user = null;
        }
        rosters.push({
          name: ros.name,
          userName: user ? user.user : "",
          type: ros.type,
          downloads: ros.downloads,
          updates: ros.updates,
          sliderType: ros.sliderType,
          _id: ros._id,
        });
      }
    }
    res.status(200).json({ rosters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//require passowrd auth and check for maxed out
//create a roster
router.post("/upload/:game", checkPassword, async (req, res) => {
  const userId = res.user._id;
  const userMaxUploads = res.user.uploadsAllowed;

  const uploadedRosters = await Roster.find({userId, game: req.params.game});
  if(uploadedRosters.length >= userMaxUploads){
    return res.status(403).json({message: 'You have hit your upload quota'})
  }

  const rosterOnDB = await Roster.findOne(
    {
      name: req.body.name,
      userId: req.body.userId,
      game: req.params.game,
      type: req.body.type,
    },
    (err, res) => {
      if (err) {
        return null;
      } else {
        return res;
      }
    }
  );

  if (rosterOnDB != null) {
    res.status(400).json({ message: "You already have a roster with that name" });
    return;
  }
  const roster = new Roster({
    name: req.body.name,
    userId: req.body.userId,
    game: req.params.game,
    type: req.body.type,
    downloads: 0,
    updates: 0,
    data: req.body.data,
    sliderType: req.body.sliderType
  });
  try {
    await roster.save();
    res.status(201).json({ message: "Successfully created roster" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//check for password
//update a roster
router.patch("/update/:id", checkPasswordWithExistingRoster, async (req, res) => {
  try {
    const ros = await Roster.findById(req.params.id);
    if (req.body.userId != ros.userId) {
      res.status(403).json({ message: "Access Denied" });
      return;
    }
    const updates = ros.updates + 1;
    ros.updates = updates;
    ros.data = req.body.data;
    ros.type = req.body.type;
    let name = req.body.name;
    ros.sliderType = req.body.sliderType;
    ros.name = name;
    await ros.save();
    res.status(201).json({ message: "Successfully updated roster" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

async function checkPasswordWithExistingRoster(req, res, next) {
  //check rosters user id
  try {
    const roster = await Roster.findById(req.params.id);
    const user = await User.findById(roster.userId);
    if (await bcrypt.compare(req.body.password, user.password)) {
        res.status(200);
    }else{
      return res.status(403).json({ message: 'Access Denied' });
    }
  } catch (err) {
    return res.status(403).json({ message: 'Access Denied' });
  }
  next();
}


async function checkPassword(req, res, next) {
  //check rosters user id
  let user;
  try {
    user = await User.findById(req.body.userId);
    if (await bcrypt.compare(req.body.password, user.password)) {
        res.status(200);
    }else{
      return res.status(403).json({ message: 'Access Denied' });
    }
  } catch (err) {
    return res.status(403).json({ message: 'Access Denied' });
  }
  res.user = user;
  next();
}
