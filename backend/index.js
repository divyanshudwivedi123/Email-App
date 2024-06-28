import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import {google} from "googleapis";
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;
const PORT = process.env.PORT || 3000;
let REFRESH_TOKEN;
let ACCESS_TOKEN;
let EMAIL;

const app = express();
app.use(cors());
app.use(express.json());



const authClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

const scopes = [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send"
  ];


app.get("/api/home", (req, res) => {
    res.send("This is inbox app !");
})

// Google Auth screen
app.get('/api/auth/google', (req, res) => {
    const authUrl = authClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    res.redirect(authUrl); // Redirects the user to Google's OAuth consent screen
});

// Post Google Auth Page
app.get("/api/auth/user", async(req, res) => {
    const code = req.query.code;
    const { tokens } = await authClient.getToken(code);
    authClient.setCredentials(tokens);
    const {access_token, refresh_token} = tokens;
    ACCESS_TOKEN = access_token;
    REFRESH_TOKEN = refresh_token;
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/profile`;
    const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        }
    });
    const profileData = response.data;
    const email = profileData.emailAddress;
    EMAIL = email;
    console.log(EMAIL);
    console.log(ACCESS_TOKEN);

    console.log("--------------------------------------")
    console.log(REFRESH_TOKEN);
    res.json({"authenticated" : "Yes"});
})


// API to send mails
app.get("/api/google/mail", sendMail);

async function sendMail(req, res){
    try{
        const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: EMAIL,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: ACCESS_TOKEN,
        },
    });
    const recepientMail = req.query.email;
    const mailOptions = {
        from: EMAIL,
        to: recepientMail,
        subject: 'Hello from gmail using API',
        text: 'Hello from gmail email using API',
        html: '<h1>Hello from gmail email using API</h1>',
      };
      const result = await transport.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully', result });

    }catch(error){
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', message: error.message });
    }
}

app.get("/api/google/mails", async (req, res) => {
    try {
        const { token } = await authClient.getAccessToken();
        const userId = "dwivedidivyanshu30@gmail.com";
        const url = `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages?maxResults=2`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

// Starting the server.

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

// app.get("/api/profile", async (req, res) => {
//     try {
//         const { token } = await authClient.getAccessToken();
//         const userid = "dwivedidivyanshu30@gmail.com";
//         const url = `https://gmail.googleapis.com/gmail/v1/users/${userid}/profile`;

//         const response = await axios.get(url, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//         console.log(response.data);
//         res.json(response.data);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('An error occurred');
//     }
// });


