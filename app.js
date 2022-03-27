require('dotenv').config();
require('./config/database').connect();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QR = require('qrcode');
const User = require('./model/user');
const ConnectedDevice = require('./model/connectedDevice');
const QRCode = require('./model/qrCode');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
app.set('view engine', 'html');

app.post('/register', async (req, res) => {
    try {
        // Get user input
        const {firstName, lastName, email, password} = req.body;

        // Validate user input
        if (!(email && password && firstName && lastName)) {
            res.status(400).send('All input is required');
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({email});

        if (oldUser) {
            return res.status(409).send('User Already Exist. Please Login');
        }

        // Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
            {user_id: user._id, email},
            process.env.TOKEN_KEY,
            {
                expiresIn: '2h',
            },
        );

        // return new user
        res.status(201).json({token});
    }
    catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});

app.post('/login', async (req, res) => {
    // Our login logic starts here
    try {
        // Get user input
        const {email, password} = req.body;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send('All input is required');
        }

        // Validate if user exist in our database
        const user = await User.findOne({email});

        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
                {user_id: user._id, email},
                process.env.TOKEN_KEY,
                {
                    expiresIn: '2h',
                },
            );

            // save user token
            user.token = token;

            // user
            return res.status(200).json({token});
        }
        return res.status(400).send('Invalid Credentials');
    }
    catch (err) {
        console.log(err);
    }
    // Our login logic ends here
});

app.post('/qr/generate', async (req, res) => {
    try {
        const {userId} = req.body;

        // Validate user input
        if (!userId) {
            res.status(400).send('User Id is required');
        }

        const user = await User.findById(userId);

        // Validate is user exist
        if (!user) {
            res.status(400).send('User not found');
        }

        const qrExist = await QRCode.findOne({userId});

        // If qr exist, update disable to true and then create a new qr record
        if (!qrExist) {
            await QRCode.create({userId});
        }
        else {
            await QRCode.findOneAndUpdate({userId}, {$set: {disabled: true}});
            await QRCode.create({userId});
        }

        // Generate encrypted data
        const encryptedData = jwt.sign(
            {userId: user._id},
            process.env.TOKEN_KEY,
            {
                expiresIn: '1d',
            },
        );

        // Generate qr code
        const dataImage = await QR.toDataURL(encryptedData);
        const data = dataImage.replace(/^data:image\/\w+;base64,/, '');
        const fileName = userId.toString();
        fs.writeFile(`${fileName}.png`, data, {encoding: 'base64'}, function(err){
            //Finished
        });

        console.log(`${path.join(__dirname)}/${fileName}.png`);
        // Return qr code
        res.header('Content-Type', 'image/png');
        return res.status(200).sendFile(`${path.join(__dirname)}/${fileName}.png`);
    }
    catch (err) {
        console.log(err);
    }
});

app.post('/qr/scan', async (req, res) => {
    try {
        const {token, deviceInformation} = req.body;

        if (!token && !deviceInformation) {
            res.status(400).send('Token and deviceInformation is required');
        }

        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        const qrCode = await QRCode.findOne({
            userId: decoded.userId,
            disabled: false,
        });

        if (!qrCode) {
            res.status(400).send('QR Code not found');
        }

        const connectedDeviceData = {
            userId: decoded.userId,
            qrCodeId: qrCode._id,
            deviceName: deviceInformation.deviceName,
            deviceModel: deviceInformation.deviceModel,
            deviceOS: deviceInformation.deviceOS,
            deviceVersion: deviceInformation.deviceVersion,
        };

        const connectedDevice = await ConnectedDevice.create(connectedDeviceData);

        // Update qr code
        await QRCode.findOneAndUpdate(
            {_id: qrCode._id},
            {
                isActive: true,
                connectedDeviceId: connectedDevice._id,
                lastUsedDate: new Date(),
            },
        );

        // Find user
        const user = await User.findById(decoded.userId);

        // Create token
        const authToken = jwt.sign({user_id: user._id}, process.env.TOKEN_KEY, {
            expiresIn: '2h',
        });

        // Return token
        return res.status(200).json({token: authToken});
    }
    catch (err) {
        console.log(err);
    }
});


module.exports = app;
