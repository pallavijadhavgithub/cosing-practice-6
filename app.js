const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
module.exports = app;
app.use(express.json());

const filePath = path.join(__dirname, "covid19India.db");
let db = null;

const convertingStateIntoCamelcase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertingDistrictIntoCamelcase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
initializerDbAndServer();

//get API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT * 
         FROM state
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertingStateIntoCamelcase(eachState))
  );
});

//get API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertingStateIntoCamelcase(state));
});

//post API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO 
        district(district_name,state_id,cases,cured, active, deaths)
    VALUES(
       '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//get API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertingDistrictIntoCamelcase(district));
});

//delete API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM
            district
        WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//PUT update API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
        UPDATE district
        SET
        
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths};
        WHERE district_id = ${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictStateQuery = `
        SELECT 
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM district 
        WHERE state_id = ${stateId};`;
  const stateDistrict = await db.get(getDistrictStateQuery);
  response.send(stateDistrict);
});

//get API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictNameQuery = `
        SELECT state_id
        FROM district
        WHERE district_id = ${districtId};`;
  const res = await db.get(getDistrictNameQuery);

  const getStateQuery = `
    SELECT state_name AS stateName
    FROM state
    WHERE state_id = ${res.state_id};`;

  const result = await db.get(getStateQuery);
  response.send(result);
});
