module.exports = async function (fastify, opts) {

fastify.get('/internal/health', async (request, reply) => {

const key = request.headers['x-brain-key'];

if (key !== process.env.BRAIN_API_KEY) {
return reply.code(401).send({error:"unauthorized"});
}

return {
api:"ok",
db:"ok",
redis:"ok",
workers:"ok",
timestamp:new Date().toISOString()
};

});

fastify.get('/internal/project-state', async (request, reply) => {

const key = request.headers['x-brain-key'];

if (key !== process.env.BRAIN_API_KEY) {
return reply.code(401).send({error:"unauthorized"});
}

return {
api:"ok",
waitlistConnected:true,
walletFlowReady:false,
referralFlowReady:false,
rewardDistributionReady:false,
contractsDeployed:false,
timestamp:new Date().toISOString()
};

});

};
