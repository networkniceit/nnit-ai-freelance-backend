// services/recommendation.js
// AI-powered recommendations (personalized job/certificate suggestions)
const OpenAI = require('openai');
const Job = require('../models/Job');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getJobRecommendations(userId) {
    const user = await User.findById(userId);
    const jobs = await Job.find({});
    const prompt = `User: ${user.full_name}, Skills: ${user.skills || 'N/A'}\nJobs: ${jobs.map(j => j.title + ' - ' + j.description).join('; ')}\nRecommend top 3 jobs for this user.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
    });
    return response.choices[0].message.content;
}

async function getCertificateRecommendations(userId) {
    const user = await User.findById(userId);
    const certs = await Certificate.find({});
    const prompt = `User: ${user.full_name}, Role: ${user.role}\nCertificates: ${certs.map(c => c.type + ' - ' + c.issued_by).join('; ')}\nRecommend top 3 certificates for this user.`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
    });
    return response.choices[0].message.content;
}

module.exports = { getJobRecommendations, getCertificateRecommendations };
