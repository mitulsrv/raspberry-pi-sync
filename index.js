const sqlite = require('sqlite3');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());

app.get('/echo', (req, res) => {
    res.json({
        status: true,
        message: "Server is running"
    });
})

app.get('/api/install', (req,res) => {
    const db = new sqlite.Database('./sensors.db', (error) => {
        if(error){
            return res.json({
                status: false,
                message: error.message
            })
        }else{
            db.run("CREATE TABLE Sensor_V1(SenseId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, SE1 INTEGER, SE2 INTEGER, SE3 INTEGER, flgStatus INTEGER, CreatedTimeStamp DATE DEFAULT (datetime('now', 'localtime')))", (err) => {
                if(err){
                    return res.json({
                        status: false,
                        message: err.message
                    })
                }else{
                    return res.json({
                        status: true,
                        message: "Application is installed successfully"
                    })
                }
            })
        }
    })
})

app.post('/api/sense', async (req, res) => {
    const SE1 = req.body.SE1;
    const SE2 = req.body.SE2;
    const SE3 = req.body.SE3;

    const db = await new sqlite.Database('./sensors.db', (error) => {
        if(error){
            return res.json({
                status: false,
                message: error.message
            })
        }else{
            db.run("INSERT INTO Sensor_V1(SE1, SE2, SE3, flgStatus)VALUES("+SE1+", "+SE2+", "+SE3+", 1)", (err) => {
                if(err){
                    return res.json({
                        status: false,
                        message: err
                    })
                }else{
                    return res.json({
                        status: true,
                        message: "Data saved successfully"
                    })
                }
            })
        }
    })
    
})

app.get('/api/sense', async (req, res) => {
    
    const db = await new sqlite.Database('./sensors.db', (error) => {
        if(error){
            return res.json({
                status: false,
                message: error.message
            })
        }else{
            db.all("SELECT * FROM Sensor_V1", [], (err, sensors) => {
                if(err){
                    return res.json({
                        status: false,
                        message: err
                    })
                }else{
                    return res.json({
                        status: true,
                        message: "Data fetched successfully",
                        data: sensors
                    })
                }
            })
        }
    })
})

app.get('/api/sync', async (req ,res) => {
    const db = await new sqlite.Database('./sensors.db', (error) => {
        if(error){
            return res.json({
                status: false,
                message: error.message
            })
        }else{
            db.all("SELECT * FROM Sensor_V1 WHERE flgStatus = 1", [], (err, sensors) => {
                if(err){
                    return res.json({
                        status: false,
                        message: err
                    })
                }else{
                     sensors.forEach((ses) => {
                        var data = { "SE1": ses.SE1, "SE2": ses.SE2, "SE3": ses.SE3, "flgStatus": ses.flgStatus };
                         axios.post('http://192.168.43.88/sense/api/post-sense-sqlserver', data).then((response) => {
                            console.log(response.data);
                            if(response.data.status){
                                db.run('DELETE FROM Sensor_V1 WHERE SenseId = ' + ses.SenseId, (error) => {
                                    if(error){
                                        return res.json({
                                            status: false,
                                            message: err
                                        })                  
                                    }
                                })
                            }
                        })
                    })
                    return res.json({
                        status: true,
                        message: "Data Sync successfully",
                        data: sensors
                    })
                }
            })
        }
    })  
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})