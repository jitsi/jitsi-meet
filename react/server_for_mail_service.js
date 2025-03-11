const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors")

const app = express();

var corsOptions = {
    origin: '*',
}
app.use(cors(corsOptions))
app.use(express.json());

const PORT = 3000;

app.post('/send/mail', async (req, res) => {
    let { mailOption, transporter } = req.body;
    let transport = nodemailer.createTransport(transporter);
    transport.sendMail(mailOption, (error, info) => {
        if (error) {
            res.status(500).send({ error: 'Failed to send mail' });
        } else {
            res.status(200).send({ message: 'Mail sent successfully' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
