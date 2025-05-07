const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'Farishensem1',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
});

module.exports = {
    query: (text, params) => pool.query(text, params)
};

// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'theroadtoninja@gmail.com',
//         pass: 'hbmi ragt djow evch'
//     }
// });

// app.post('/send-email', async (req, res) => {
//     const mailOptions = {
//         from: 'theroadtoninja@gmail.com',
//         to: 'mrfaris2011@gmail.com',
//         subject: 'Hello World',
//         text: 'Hello World'
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         res.status(200).send('Email sent successfully');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Failed to send email');
//     }
// });