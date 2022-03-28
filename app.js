const express = require('express');
const jwt = require('jsonwebtoken');
const QR = require('qrcode');
const QRCode = require('./model/qrCode');
const settings = require('./settings.json');

const app = express();

app.use(express.json());
app.set('view engine', 'html');

app.get('/generate', async (req, res) => {
    try {
        const timestamp = Date.now();

        const encryptedData = jwt.sign(
            {userLogin: timestamp},
            settings.token,
            {
                expiresIn: '5m',
            }
        );

        // Generate qr code
        const dataImage = await QR.toDataURL(encryptedData);
        await QRCode.create({
            qr_code: dataImage,
            create_date: new Date(),
        });

        // Return qr code
        return res.status(200).json({dataImage});
    }
    catch (err) {
        console.log(err);
    }
});

app.post("/scan", async (req, res) => {
    try {
        const { token, deviceInformation } = req.body;

        if (!token && !deviceInformation) {
            res.status(400).send("Token and deviceInformation is required");
        }

        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        const qrCode = await QRCode.findOne({
            userId: decoded.userId,
            disabled: false,
        });

        if (!qrCode) {
            res.status(400).send("QR Code not found");
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
            { _id: qrCode._id },
            {
                isActive: true,
                connectedDeviceId: connectedDevice._id,
                lastUsedDate: new Date(),
            }
        );

        // Find user
        const user = await User.findById(decoded.userId);

        // Create token
        const authToken = jwt.sign({ user_id: user._id }, process.env.TOKEN_KEY, {
            expiresIn: "2h",
        });

        // Return token
        return res.status(200).json({ token: authToken });
    } catch (err) {
        console.log(err);
    }
});

module.exports = app;
